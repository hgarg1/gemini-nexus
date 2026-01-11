import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Super Admin" && (session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.systemSettings.findMany();
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Super Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { key, value } = await req.json();

    const setting = await prisma.systemSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    // Log action
    await prisma.usageLog.create({
      data: {
        userId: (session.user as any).id,
        action: "update_system_setting",
        resource: key,
        details: { value },
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
