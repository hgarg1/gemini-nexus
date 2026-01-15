import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@repo/database";
import { getTransmissionQueue } from "@/lib/queue";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getAdminContext(req);
  if (!context || !isSuperAdmin(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const payload = await req.json();
    const data: Record<string, any> = {};
    const assetUpdates: Record<string, any> = {};

    if ("name" in payload) data.name = payload.name;
    if ("slug" in payload) data.slug = payload.slug;
    if ("description" in payload) data.description = payload.description;
    
    // Offload assets to queue
    if ("logo" in payload) assetUpdates.logo = payload.logo;
    if ("banner" in payload) assetUpdates.banner = payload.banner;

    if ("chatPolicy" in payload) data.chatPolicy = payload.chatPolicy;
    if ("pointOfContactName" in payload) data.pointOfContactName = payload.pointOfContactName;
    if ("pointOfContactEmail" in payload) data.pointOfContactEmail = payload.pointOfContactEmail;
    if ("pointOfContactPhone" in payload) data.pointOfContactPhone = payload.pointOfContactPhone;
    if ("onboardingProfile" in payload) data.onboardingProfile = payload.onboardingProfile;

    if (Object.keys(assetUpdates).length > 0) {
      const transmissionQueue = getTransmissionQueue();
      if (transmissionQueue) {
          await transmissionQueue.add("org-asset-update", {
            orgId: id,
            ...assetUpdates
          });
      }
    }

    const updatedOrg = await prisma.organization.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedOrg);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getAdminContext(req);
  if (!context || !isSuperAdmin(context.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.organization.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 });
  }
}
