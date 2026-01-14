import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
const transmissionQueue = new Queue("transmission-queue", { connection: connection as any });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Super Admin") {
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
      await transmissionQueue.add("org-asset-update", {
        orgId: id,
        ...assetUpdates
      });
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
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "Super Admin") {
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
