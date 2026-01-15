import ChatInterface from "@/components/chat-interface";
import { Suspense } from "react";

export default async function SharedChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={null}>
      <ChatInterface chatId={resolvedParams.id} />
    </Suspense>
  );
}