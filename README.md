# Gemini Nexus: The Ultimate AI Terminal

Gemini Nexus is a world-class, real-time collaborative wrapper for Google Gemini.

## 🚀 One-Command Launch

To start the entire ecosystem (Postgres, Redis, Web App, Mobile App):

```bash
docker-compose up -d && npm run dev
```

## 🛠 Features

- **Chat Persistence:** All conversations saved to PostgreSQL via Prisma.
- **Real-time Sync:** Powered by Socket.io and Redis for instant collaboration.
- **Hybrid Keys:** Use system-wide keys or provide your own for deep control.
- **Cross-Platform:** Beautiful web interface and a native mobile experience.
- **Environment Aware:** Local vs Prod detection for real-time chat sharing.

## 🏗 Architecture

- **Turborepo:** Monorepo management.
- **Next.js:** Web frontend and API routes.
- **Expo:** Cross-platform mobile app.
- **Docker:** Infrastructure orchestration.
- **Prisma:** Type-safe database access.

## 📝 Prerequisites

1.  **Docker Desktop:** Ensure Docker is running.
2.  **Google API Key:** Get one from [Google AI Studio](https://aistudio.google.com/).
3.  **Environment Variables:** Copy `.env` to `apps/web/.env` and fill in the blanks.

---

*Built for the next generation of AI power users.*