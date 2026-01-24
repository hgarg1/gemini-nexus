import { extractCheckpointSuggestion, generateGeminiResponse, extractMemories, generateImageLabels } from "@repo/ai";
import { computeDelta, materializeState, normalizeMessage } from "@repo/database";
import { prisma } from "@repo/database"; 
import { Server } from "socket.io";
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

export const transmissionQueue = new Queue("transmission-queue", { connection: connection as any });

export function setupWorker(io: Server) {
  const worker = new Worker(
    "transmission-queue",
    async (job) => {
      if (job.name === "org-asset-update") {
        const { orgId, logo, banner } = job.data;
        const data: any = {};
        if (logo !== undefined) data.logo = logo;
        if (banner !== undefined) data.banner = banner;
        
        if (Object.keys(data).length > 0) {
          await prisma.organization.update({
            where: { id: orgId },
            data
          });
          console.log(`>> ORG_ASSET_UPDATED: ${orgId}`);
        }
        return "ASSETS_PERSISTED";
      }

      const { prompt, chatId, history, config, apiKey, modelMessageId, images, image, userMessageId, branchId } = job.data;
      const imageList = Array.isArray(images) ? images : image ? [image] : [];

      try {
        const deletionMatch = prompt.match(
          /(?:forget|delete|remove)\s+(?:the\s+)?(?:memory\s*)?(?:about\s*)?[:"]?\s*(.+?)["']?\s*$/i
        );
        let memoryActionNote = "";
        let userId: string | null = null;
        if (deletionMatch) {
          const label = deletionMatch[1]?.trim();
          if (label) {
            const userMessage = await prisma.message.findUnique({
              where: { id: userMessageId },
              select: { chat: { select: { userId: true } } },
            });
            userId = userMessage?.chat?.userId || null;
            if (userId) {
              await prisma.memory.deleteMany({
                where: {
                  userId,
                  label: { equals: label, mode: "insensitive" },
                },
              });
              memoryActionNote = `MEMORY_ACTION: Deleted memory labeled "${label}" per user request.\n`;
            }
          }
        }

        if (!userId) {
          const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            select: { userId: true },
          });
          userId = chat?.userId || null;
        }

        let memoryContext = "";
        if (userId) {
          const memories = await prisma.memory.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            take: 20,
          });
          if (memories.length > 0) {
            memoryContext =
              "MEMORY_VAULT:\n" +
              memories
                .map((memory) => `- ${memory.label}: ${memory.content}`)
                .join("\n") +
              "\n\n";
          }
        }

        const promptWithMemory = `${memoryActionNote}${memoryContext}${prompt}`;

        // 1. Generate AI Response
        const responseText = await generateGeminiResponse(promptWithMemory, history, apiKey, config, imageList.length ? imageList : undefined);

        // 2. If image exists, generate semantic labels using Gemini Pro
        const labelsByImage: Record<string, string[]> = {};
        if (imageList.length > 0) {
          for (const entry of imageList) {
            try {
              const labels = await generateImageLabels(entry, apiKey);
              labelsByImage[entry] = labels;
              await prisma.asset.updateMany({
                where: { messageId: userMessageId, url: entry },
                data: { labels }
              });
            } catch (err) {
              console.error(">> LABELING_FAILURE", err);
            }
          }
        }

        // 3. Update DB with retry logic
        let updateRetries = 5;
        while (updateRetries > 0) {
          try {
            await prisma.message.update({
              where: { id: modelMessageId },
              data: { content: responseText }
            });
            break; // Success
          } catch (e: any) {
            // P2025: Record to update not found.
            if (e.code === 'P2025' && updateRetries > 1) {
              console.log(`>> MESSAGE_NOT_FOUND_RETRYING: ${modelMessageId} (${updateRetries} attempts left)`);
              updateRetries--;
              await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
              continue;
            }
            throw e; // Rethrow other errors or if retries exhausted
          }
        }

        if (userId) {
          try {
            const suggested = await extractCheckpointSuggestion(
              prompt,
              responseText,
              config?.modelName || "models/gemini-2.0-flash",
              apiKey
            );

            if (suggested) {
              const targetBranch =
                branchId ||
                (
                  await prisma.branch.findFirst({
                    where: { chatId, name: "master" },
                    select: { id: true },
                  })
                )?.id;

              const resolvedBranchId =
                targetBranch ||
                (
                  await prisma.branch.create({
                    data: { chatId, name: "master" },
                    select: { id: true },
                  })
                ).id;

              const branch = await prisma.branch.findUnique({
                where: { id: resolvedBranchId },
              });

              if (branch) {
                const parentId = branch.headId || branch.baseCheckpointId || null;
                const baseState = parentId ? await materializeState(prisma, parentId) : new Map();

                const messages = await prisma.message.findMany({
                  where: { chatId },
                  include: { assets: true },
                  orderBy: { createdAt: "asc" },
                });
                const currentMessages = messages.map(normalizeMessage);
                const delta = computeDelta(baseState, currentMessages);

                if (delta.adds.length || delta.updates.length || delta.deletes.length) {
                  const checkpoint = await prisma.checkpoint.create({
                    data: {
                      chatId,
                      branchId: resolvedBranchId,
                      label: suggested.label,
                      comment: suggested.comment || undefined,
                      delta,
                      parentId: parentId || undefined,
                      createdById: userId,
                    },
                  });

                  await prisma.branch.update({
                    where: { id: resolvedBranchId },
                    data: { headId: checkpoint.id },
                  });
                }
              }
            }
          } catch (err) {
            console.error(">> CHECKPOINT_EXTRACTION_FAILURE", err);
          }
        }

        if (userId) {
          try {
            const lastUserText = Array.isArray(history)
              ? [...history].reverse().find((entry: any) => entry?.role === "user")?.parts?.map((part: any) => part?.text).filter(Boolean).join(" ").trim()
              : "";
            const memoryPrompt = /\bremember\s+(that|this|it)\b/i.test(prompt) && lastUserText
              ? `Remember: ${lastUserText}`
              : prompt;

            const extracted = await extractMemories(memoryPrompt, responseText, apiKey);
            for (const memory of extracted) {
              const existing = await prisma.memory.findFirst({
                where: {
                  userId,
                  label: { equals: memory.label, mode: "insensitive" },
                },
              });
              if (existing) {
                await prisma.memory.update({
                  where: { id: existing.id },
                  data: { content: memory.content },
                });
              } else {
                await prisma.memory.create({
                  data: {
                    userId,
                    label: memory.label,
                    content: memory.content,
                  },
                });
              }
            }
          } catch (err) {
            console.error(">> MEMORY_EXTRACTION_FAILURE", err);
          }
        }

        // 4. Notify via Socket
        io.to(chatId).emit("message-updated", {
          id: modelMessageId,
          content: responseText,
          chatId,
          labelsByImage // Send labels back to UI
        });

        return responseText;
      } catch (error: any) {
        console.error(`>> JOB_FAILURE: ${job.id}`, error);
        await prisma.message.update({
          where: { id: modelMessageId },
          data: { content: `!! TRANSMISSION_ERROR: ${error.message}` }
        });
        io.to(chatId).emit("message-updated", {
          id: modelMessageId,
          content: `!! TRANSMISSION_ERROR: ${error.message}`,
          chatId
        });
        throw error;
      }
    },
    { connection: connection as any }
  );

  worker.on("completed", (job) => {
    console.log(`>> JOB_COMPLETED: ${job.id}`);
  });

  return worker;
}
