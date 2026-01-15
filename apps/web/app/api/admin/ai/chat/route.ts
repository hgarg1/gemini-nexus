import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAdminRole } from "@/lib/admin-auth";
import { prisma } from "@repo/database";
import { adminTools, adminFunctions } from "@/lib/admin-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if (!context || !isAdminRole(context.roleName)) {
      return NextResponse.json({ error: "Unauthorized access detected." }, { status: 403 });
    }

    const { prompt, history, confirmedAction, chatId } = await req.json();
    const adminId = context.user.id;

    let activeChatId = chatId;

    // Handle explicit confirmation execution
    if (confirmedAction) {
      const { type, data } = confirmedAction;
      let result;
      if (type === "ban_user") {
        result = await adminFunctions.execute_ban(data.userId, adminId);
      } else if (type === "unban_user") {
        result = await adminFunctions.execute_unban(data.userId);
      }

      // Save user confirmation and model result to DB
      if (activeChatId) {
        await prisma.adminAIMessage.createMany({
          data: [
            { chatId: activeChatId, role: "user", content: `Protocol confirmed: Initiate ${type.toUpperCase()}.` },
            { chatId: activeChatId, role: "model", content: `Action ${type.toUpperCase()} executed successfully.` },
          ],
        });
        await prisma.adminAIChat.update({
          where: { id: activeChatId },
          data: { updatedAt: new Date() },
        });
      }

      return NextResponse.json({ 
        message: `Action ${type.toUpperCase()} executed successfully.`,
        result 
      });
    }

    // Auto-create chat if not provided
    if (!activeChatId) {
      const chat = await prisma.adminAIChat.create({
        data: {
          userId: adminId,
          title: prompt.slice(0, 30) || "New Session",
        },
      });
      activeChatId = chat.id;
    }

    const permissions = context.permissions || [];

    const systemInstruction = `You are NEXUS_CORE_AI, the supreme administrative intelligence for this platform.
Your purpose is to assist the high-level administrator with system telemetry, operative management, and security protocols.
Current Admin: ${context.user.name || "ADMIN"} (${context.user.email || "UNKNOWN"})
Permissions: ${permissions.join(", ")}

You have access to real-time system stats, operative databases, organizations, and the permission bank via tools.
For dangerous actions like 'ban_user' or 'unban_user', always explain WHY you are proposing it.
The UI will handle the actual execution after the admin confirms.

Be precise, technical, and maintain a high-fidelity cyberpunk persona.`;

    // FIX: Pass systemInstruction correctly as a Content object to getGenerativeModel
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      tools: adminTools as any,
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }],
      },
    });

    // Load history from DB if provided
    let chatHistory: { role: string; parts: { text: string }[] }[] = [];
    if (activeChatId) {
      const dbMessages = await prisma.adminAIMessage.findMany({
        where: { chatId: activeChatId },
        orderBy: { createdAt: "asc" },
      });
      chatHistory = dbMessages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));
    }

    // Gemini requirements: alternating roles and ending with model
    const validatedHistory: any[] = [];
    for (const msg of chatHistory) {
      const expectedRole = validatedHistory.length % 2 === 0 ? "user" : "model";
      if (msg.role === expectedRole) {
        validatedHistory.push(msg);
      }
    }
    if (validatedHistory.length > 0 && validatedHistory[validatedHistory.length - 1].role === "user") {
      validatedHistory.pop();
    }

    const chat = model.startChat({
      history: validatedHistory,
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const functionCalls = response.functionCalls();

    let responseData: any = { message: response.text(), chatId: activeChatId };

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (!call) return NextResponse.json({ message: response.text(), chatId: activeChatId });
      
      const dangerousFunctions = ["ban_user", "unban_user"];
      
      if (dangerousFunctions.includes(call.name)) {
        responseData = {
          message: `I am proposing a ${call.name.replace('_', ' ')} protocol for this operative. Do you wish to authorize?`,
          proposal: {
            type: call.name,
            data: call.args
          },
          chatId: activeChatId
        };
      } else {
        // Execute and return result loop
        let toolResponse;
        if (call.name === "get_system_stats") {
          toolResponse = await adminFunctions.get_system_stats();
        } else if (call.name === "search_operatives") {
          toolResponse = await adminFunctions.search_operatives(call.args as any);
        } else if (call.name === "get_user_details") {
          toolResponse = await adminFunctions.get_user_details(call.args as any);
        } else if (call.name === "list_organizations") {
          toolResponse = await adminFunctions.list_organizations();
        } else if (call.name === "get_roles") {
          toolResponse = await adminFunctions.get_roles();
        } else if (call.name === "get_permissions_bank") {
          toolResponse = await adminFunctions.get_permissions_bank();
        }

        if (toolResponse) {
          const toolResult = await chat.sendMessage([{
            functionResponse: {
              name: call.name,
              response: { content: toolResponse }
            }
          }]);
          responseData = { message: toolResult.response.text(), chatId: activeChatId, data: toolResponse };
        }
      }
    }

    // Persist messages to DB
    await prisma.adminAIMessage.createMany({
      data: [
        { chatId: activeChatId, role: "user", content: prompt },
        { 
          chatId: activeChatId, 
          role: "model", 
          content: responseData.message,
          proposal: responseData.proposal ? (responseData.proposal as any) : undefined
        },
      ],
    });
    await prisma.adminAIChat.update({
      where: { id: activeChatId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("ADMIN_AI_ERROR", error);
    return NextResponse.json({ error: "System fault in AI neural bridge." }, { status: 500 });
  }
}
