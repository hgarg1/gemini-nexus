import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const isAuthorized = userRole === "Super Admin" || userRole === "Admin" || userRole?.toLowerCase() === "admin";

  if (!session?.user || !isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: organizationId, linkId } = await params;
  const { active, requiresApproval, reissue } = await req.json();

  const data: Record<string, any> = {};
  if (typeof active === "boolean") data.active = active;
  if (typeof requiresApproval === "boolean") data.requiresApproval = requiresApproval;
  if (reissue) {
    data.code = randomUUID().replace(/-/g, "");
    data.useCount = 0;
    data.active = true;
  }

  try {
    const updated = await prisma.organizationLink.update({
      where: { id: linkId, organizationId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update link" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const isAuthorized = userRole === "Super Admin" || userRole === "Admin" || userRole?.toLowerCase() === "admin";

  if (!session?.user || !isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: organizationId, linkId } = await params;

  try {
    await prisma.organizationLink.delete({
      where: { id: linkId, organizationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
  }
}
