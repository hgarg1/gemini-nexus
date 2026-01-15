import { NextResponse } from "next/server";
import { prisma } from "@repo/database";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";

// This mimics NextAuth's internal signing key usage
// In production, ensure NEXTAUTH_SECRET is set
const secret = process.env.NEXTAUTH_SECRET || "super-secret-key-change-me";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new NextResponse("Missing credentials", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return new NextResponse("Invalid credentials", { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return new NextResponse("Invalid credentials", { status: 401 });
    }

    // Create a JWT token compatible with NextAuth
    const token = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.image,
      },
      secret,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      token,
    });
  } catch (error) {
    console.error("[MOBILE_LOGIN_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
