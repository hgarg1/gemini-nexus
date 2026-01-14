import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { resolvePasswordPolicy } from "@/lib/password-policy";
import { resolveChatPolicySettings } from "@/lib/chat-policy";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const isAuthorized = userRole === "Super Admin" || userRole === "Admin" || userRole?.toLowerCase() === "admin";
  if (!session?.user || !isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.systemSettings.findMany();
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const isAuthorized = userRole === "Super Admin" || userRole === "Admin" || userRole?.toLowerCase() === "admin";
  if (!session?.user || !isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { key, value } = await req.json();
    const permissions = ((session.user as any).permissions || []) as string[];
    if (key === "password_policy" && !permissions.includes("settings:password-policy")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (key === "chat_policy" && !permissions.includes("settings:chat-policy")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const normalizedValue = key === "password_policy"
      ? JSON.stringify(resolvePasswordPolicy(typeof value === "string" ? value : JSON.stringify(value)))
      : key === "chat_policy"
        ? JSON.stringify(resolveChatPolicySettings(typeof value === "string" ? value : JSON.stringify(value)))
        : value;

    const setting = await prisma.systemSettings.upsert({
      where: { key },
      update: { value: normalizedValue },
      create: { key, value: normalizedValue },
    });

    // Log action
    await prisma.usageLog.create({
      data: {
        userId: (session.user as any).id,
        action: "update_system_setting",
        resource: key,
        details: { value: normalizedValue },
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
