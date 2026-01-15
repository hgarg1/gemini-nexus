import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAdminRole } from "@/lib/admin-auth";
import { prisma } from "@repo/database";
import { resolvePasswordPolicy } from "@/lib/password-policy";
import { resolveChatPolicySettings } from "@/lib/chat-policy";

export async function GET(req: NextRequest) {
  const context = await getAdminContext(req);
  if (!context || !isAdminRole(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.systemSettings.findMany();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const context = await getAdminContext(req);
  if (!context || !isAdminRole(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { key, value } = await req.json();
    const permissions = context.permissions || [];
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
        userId: context.user.id,
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
