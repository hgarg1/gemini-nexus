import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { listGeminiModels } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    let apiKey = undefined;
    if (session?.user && (session.user as any).id) {
      const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { apiKey: true }
      });
      apiKey = user?.apiKey || undefined;
    }

    const models = await listGeminiModels(apiKey);
    return NextResponse.json({ models });
  } catch (error: any) {
    console.error("Models Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
