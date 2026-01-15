import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";
import bcrypt from "bcryptjs";
import { resolvePasswordPolicy, validatePasswordWithPolicy } from "@/lib/password-policy";

const resolveAdmin = async (req: NextRequest) => {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return null;

  const admin = await prisma.user.findUnique({
    where: { id: (sessionUser as any).id },
    select: { id: true, userRole: { select: { name: true } } },
  });

  const role = admin?.userRole?.name || "";
  return { admin, role };
};

export async function GET(req: NextRequest) {
  try {
    const context = await resolveAdmin(req);
    const isAuthorized =
      context?.role === "Super Admin" ||
      context?.role === "Admin" ||
      context?.role?.toLowerCase() === "admin";
    if (!context?.admin || !isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        isBanned: true,
        authenticators: { select: { credentialID: true } },
        userRole: { select: { name: true } },
        memberships: { select: { organization: { select: { name: true } } } },
      },
      take: 100,
    });

    const serializedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.userRole?.name || "user",
      organizations: user.memberships.map((m) => m.organization.name),
      authenticators: user.authenticators,
      isBanned: user.isBanned,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      emailVerified: user.emailVerified?.toISOString() || null,
    }));

    return NextResponse.json({ users: serializedUsers });
  } catch (error: any) {
    console.error("ADMIN_USERS_LIST_ERROR", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await resolveAdmin(req);
    if (!context?.admin || context.role !== "Super Admin") {
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
        userId: context.admin.id,
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
