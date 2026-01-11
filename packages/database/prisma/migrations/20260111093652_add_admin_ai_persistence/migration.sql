-- CreateTable
CREATE TABLE "AdminAIChat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Session',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAIChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAIMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "proposal" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAIChat_userId_idx" ON "AdminAIChat"("userId");

-- AddForeignKey
ALTER TABLE "AdminAIChat" ADD CONSTRAINT "AdminAIChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAIMessage" ADD CONSTRAINT "AdminAIMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AdminAIChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
