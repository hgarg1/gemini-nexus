import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { prisma } from "@repo/database";
import { listGeminiModels } from "@repo/ai";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    
    let apiKey = undefined;
    if (user && (user as any).id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: (user as any).id },
        select: { apiKey: true }
      });
      apiKey = dbUser?.apiKey || undefined;
    }

    const models = await listGeminiModels(apiKey);
    return NextResponse.json({ models });
  } catch (error: any) {
    console.error("Models Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
