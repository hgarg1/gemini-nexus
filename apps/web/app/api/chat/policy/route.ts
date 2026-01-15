import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { getEffectiveChatPolicy } from "@/lib/chat-policy-server";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (user as any).id;
  const policyPayload = await getEffectiveChatPolicy(userId);
  return NextResponse.json(policyPayload);
}
