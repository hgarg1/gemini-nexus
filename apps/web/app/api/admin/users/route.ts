import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import bcrypt from "bcryptjs";
import { resolvePasswordPolicy, validatePasswordWithPolicy } from "@/lib/password-policy";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "Super Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, email, password, roleId } = await req.json();

    const policySetting = await prisma.systemSettings.findUnique({
      where: { key: "password_policy" },
    });
    const policy = resolvePasswordPolicy(policySetting?.value);
    const policyError = validatePasswordWithPolicy(password, policy);
    if (policyError) {
      return NextResponse.json({ error: policyError }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId,
      },
      include: {
        userRole: true,
      },
    });

    // Log action
    await prisma.usageLog.create({
      data: {
        userId: (session.user as any).id,
        action: "admin_user_create",
        resource: user.id,
        details: { name, email, roleId },
      },
    });

    return NextResponse.json({
        ...user,
        role: user.userRole?.name || "user"
    });
  } catch (error: any) {
    console.error("ADMIN_USER_CREATE_ERROR", error);
    return NextResponse.json({ error: "Failed to create operative" }, { status: 500 });
  }
}
