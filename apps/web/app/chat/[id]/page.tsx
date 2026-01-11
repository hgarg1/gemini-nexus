import ChatInterface from "@/components/chat-interface";

export default async function SharedChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ChatInterface chatId={resolvedParams.id} />;
}