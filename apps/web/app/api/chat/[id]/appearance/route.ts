import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as any).id;
  const { appearance } = await req.json();

  const chat = await prisma.chat.findUnique({
    where: { id },
    include: { collaborators: true },
  });

  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  const isOwner = chat.userId === userId;
  // Assuming collaborators might have admin rights in future, but for now owner only?
  // Prompt said "hide the icon if user cannot manage the channel". Usually implies owner/admin.
  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden: Only the owner can customize channel appearance." }, { status: 403 });
  }

  await prisma.chat.update({
    where: { id },
    data: { appearanceSettings: appearance },
  });

  return NextResponse.json({ success: true });
}
