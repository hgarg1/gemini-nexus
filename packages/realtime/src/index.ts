import { Server } from "socket.io";
import { createServer } from "http";
import { Redis } from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { prisma } from "@repo/database";
import { setupWorker } from "./worker";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

setupWorker(io);

const pubClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// Add basic request handler to debug HTTP connectivity
httpServer.on("request", (req, res) => {
  if (req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
    return;
  }
  // Log incoming requests that aren't handled by Socket.IO
  if (!req.url?.startsWith("/socket.io/")) {
    // console.log(`>> UNHANDLED_REQUEST: ${req.method} ${req.url}`);
  }
});

io.on("connection", (socket) => {
  console.log(`>> AGENT_CONNECTED: ${socket.id}`);

  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
    console.log(`>> AGENT_${socket.id}_JOINED_STREAM: ${chatId}`);
  });

  socket.on("join-user", (userId) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    console.log(`>> AGENT_${socket.id}_JOINED_USER_ROOM: ${userId}`);
  });

  socket.on("typing", ({ chatId, userId, userName }) => {
    socket.to(chatId).emit("user-typing", { userId, userName });
  });

  socket.on("stop-typing", ({ chatId, userId }) => {
    socket.to(chatId).emit("user-stop-typing", { userId });
  });

  socket.on("new-message", ({ chatId, message }) => {
    socket.to(chatId).emit("message-received", message);
  });

  socket.on("direct-message", ({ recipientId, message }) => {
    if (!recipientId || !message) return;
    socket.to(`user:${recipientId}`).emit("direct-message", message);
  });

  socket.on("message-reaction", ({ chatId, messageId, emoji, userId, action, recipientId }) => {
    if (recipientId) {
        socket.to(`user:${recipientId}`).emit("message-reaction", { messageId, emoji, userId, action });
    } else if (chatId) {
        socket.to(chatId).emit("message-reaction", { messageId, emoji, userId, action });
    }
  });

  socket.on("disconnect", () => {
    console.log(`>> AGENT_DISCONNECTED: ${socket.id}`);
  });
});

// Periodic Telemetry Broadcast
setInterval(async () => {
  try {
    const [userCount, chatCount, messageCount, memoryCount] = await Promise.all([
      prisma.user.count(),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.memory.count(),
    ]);

    io.emit("system-telemetry", {
      users: userCount,
      chats: chatCount,
      messages: messageCount,
      memories: memoryCount,
      timestamp: new Date().toISOString(),
      latency: Math.floor(Math.random() * 5) + 5, // Simulated DB latency
    });
  } catch (err) {
    console.error(">> TELEMETRY_FAILURE", err);
  }
}, 5000);

const PORT = process.env.SOCKET_PORT || 3006;
httpServer.listen(PORT, () => {
  console.log(`>> REALTIME_NEXUS_OPERATIONAL_ON_PORT_${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.error(">> UNCAUGHT_EXCEPTION", err);
});

process.on("unhandledRejection", (reason) => {
  console.error(">> UNHANDLED_REJECTION", reason);
});
