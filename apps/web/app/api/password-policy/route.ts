import { NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { resolvePasswordPolicy } from "@/lib/password-policy";

export async function GET() {
  const setting = await prisma.systemSettings.findUnique({
    where: { key: "password_policy" },
  });
  const policy = resolvePasswordPolicy(setting?.value);
  return NextResponse.json({ policy });
}
