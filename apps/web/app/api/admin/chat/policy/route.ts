import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { resolveChatPolicySettings, defaultChatPolicy, defaultChatOrgOverride } from "@/lib/chat-policy";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const setting = await prisma.systemSettings.findUnique({
    where: { key: "chat_policy" },
  });

  const { policy, orgOverride } = resolveChatPolicySettings(setting?.value);

  return NextResponse.json({ 
    policy: { ...defaultChatPolicy, ...policy }, 
    orgOverride: { ...defaultChatOrgOverride, ...orgOverride } 
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { policy, orgOverride } = body;

    // Basic validation could happen here, but resolveChatPolicySettings handles it partially.
    // We should strictly stringify the input.

    await prisma.systemSettings.upsert({
      where: { key: "chat_policy" },
      update: { value: JSON.stringify({ policy, orgOverride }) },
      create: { key: "chat_policy", value: JSON.stringify({ policy, orgOverride }) },
    });

    // Log the action
    await prisma.usageLog.create({
      data: {
        userId: (session.user as any).id,
        action: "admin.chat_policy_update",
        details: { policy, orgOverride },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update chat policy", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
