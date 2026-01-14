import { NextResponse } from "next/server";
import { prisma } from "@repo/database";

export async function GET() {
  const setting = await prisma.systemSettings.findUnique({
    where: { key: "allowed_squad_settings" },
  });

  const allowedSettings = setting ? JSON.parse(setting.value) : ["isPublic", "allowInvites", "description"];

  return NextResponse.json({ allowedSquadSettings: allowedSettings });
}
