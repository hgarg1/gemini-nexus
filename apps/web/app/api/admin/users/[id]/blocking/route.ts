import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin" && (session.user as any).role !== "Super Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { canBlockOthers, restrictedBlockIds, canViewBlockLogs } = await req.json();

  const data: any = {};
  if (typeof canBlockOthers === "boolean") data.canBlockOthers = canBlockOthers;
  if (typeof canViewBlockLogs === "boolean") data.canViewBlockLogs = canViewBlockLogs;
  if (Array.isArray(restrictedBlockIds)) data.restrictedBlockIds = restrictedBlockIds;

  await prisma.user.update({
    where: { id },
    data,
  });

  return NextResponse.json({ success: true });
}
