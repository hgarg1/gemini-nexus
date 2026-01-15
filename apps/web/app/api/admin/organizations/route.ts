import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@repo/database";

export async function GET(req: NextRequest) {
  const context = await getAdminContext(req);
  if (!context || !isSuperAdmin(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgs = await prisma.organization.findMany({
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ organizations: orgs });
}

export async function POST(req: NextRequest) {
  const context = await getAdminContext(req);
  if (!context || !isSuperAdmin(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { 
      name, 
      slug, 
      description, 
      pointOfContactName, 
      pointOfContactEmail, 
      pointOfContactPhone,
      primaryInviteRequiresApproval,
      primaryInviteLabel
    } = await req.json();

    const roleName = `Org Admin - ${name}`;

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { 
          name, 
          slug, 
          description,
          pointOfContactName,
          pointOfContactEmail,
          pointOfContactPhone
        },
      });

      const orgAdminRole = await tx.role.create({
        data: {
          name: roleName,
          description: `Org admin for ${name}`,
          organizationId: org.id
        }
      });

      const primaryLink = await tx.organizationLink.create({
        data: {
          organizationId: org.id,
          label: primaryInviteLabel || "Primary Invite",
          requiresApproval: primaryInviteRequiresApproval ?? false,
          isPrimary: true,
          roleId: orgAdminRole.id
        }
      });

      return { org, primaryLink };
    });

    return NextResponse.json({ ...result.org, primaryLink: result.primaryLink });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}
