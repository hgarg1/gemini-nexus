import { Server } from "socket.io";
import { createServer } from "http";
import { Redis } from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

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

io.on("connection", (socket) => {
  console.log(`>> AGENT_CONNECTED: ${socket.id}`);

  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
    console.log(`>> AGENT_${socket.id}_JOINED_STREAM: ${chatId}`);
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

  socket.on("disconnect", () => {
    console.log(`>> AGENT_DISCONNECTED: ${socket.id}`);
  });
});

const PORT = process.env.SOCKET_PORT || 3006;
httpServer.listen(PORT, () => {
  console.log(`>> REALTIME_NEXUS_OPERATIONAL_ON_PORT_${PORT}`);
});
