import { prisma } from "@repo/database";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations";
import { resolvePasswordPolicy, validatePasswordWithPolicy } from "@/lib/password-policy";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, name } = result.data;

    const policySetting = await prisma.systemSettings.findUnique({
      where: { key: "password_policy" },
    });
    const policy = resolvePasswordPolicy(policySetting?.value);
    const policyError = validatePasswordWithPolicy(password, policy);
    if (policyError) {
      return NextResponse.json({ error: policyError }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error("REGISTRATION_ERROR", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
