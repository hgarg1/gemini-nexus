import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";

const MAX_IMAGE_LENGTH = 2_500_000;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      activeOrgId: true,
      notificationSettings: true,
      memberships: {
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              banner: true,
            },
          },
          role: { select: { name: true } },
          joinedAt: true,
        },
        orderBy: { joinedAt: "desc" },
      },
    },
  });

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim() : undefined;
    const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : undefined;
    const image = typeof body.image === "string" ? body.image : body.image === null ? null : undefined;
    const activeOrgId = typeof body.activeOrgId === "string" ? body.activeOrgId : body.activeOrgId === null ? null : undefined;
    const notificationSettings =
      typeof body.notificationSettings === "object" && body.notificationSettings !== null
        ? body.notificationSettings
        : undefined;

    if (name !== undefined && name.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
    }
    if (email !== undefined && !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (phoneRaw !== undefined && phoneRaw.length > 0 && !/^[+()0-9\s.-]{7,}$/.test(phoneRaw)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }
    if (typeof image === "string" && image.length > MAX_IMAGE_LENGTH) {
      return NextResponse.json({ error: "Image is too large" }, { status: 413 });
    }

    const userId = (session.user as any).id;

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }

    const data: {
      name?: string;
      email?: string;
      phone?: string | null;
      image?: string | null;
      activeOrgId?: string | null;
      notificationSettings?: any;
    } = {};

    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phoneRaw !== undefined) data.phone = phoneRaw.length ? phoneRaw : null;
    if (image !== undefined) data.image = image;
    if (notificationSettings !== undefined) data.notificationSettings = notificationSettings;

    if (activeOrgId !== undefined) {
      if (activeOrgId) {
        const membership = await prisma.organizationMember.findUnique({
          where: { organizationId_userId: { organizationId: activeOrgId, userId } },
          select: { id: true },
        });
        if (!membership) {
          return NextResponse.json({ error: "Invalid organization selection" }, { status: 400 });
        }
      }
      data.activeOrgId = activeOrgId;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        activeOrgId: true,
        notificationSettings: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("USER_UPDATE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
