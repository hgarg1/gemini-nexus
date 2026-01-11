import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { rpID } from "@/lib/webauthn";

export async function POST(req: Request) {
  // Login flow: User provides email, we look up user, get their credentials
  const { email } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { authenticators: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: user.authenticators.map((auth) => ({
      id: auth.credentialID,
      type: "public-key",
      transports: auth.transports ? JSON.parse(auth.transports) : undefined,
    })),
    userVerification: "preferred",
  });

  // Store challenge
  await prisma.verificationToken.deleteMany({ where: { identifier: user.id } });
  await prisma.verificationToken.create({
    data: {
      identifier: user.id,
      token: options.challenge,
      expires: new Date(Date.now() + 60000 * 5),
    },
  });

  return NextResponse.json({ options, userId: user.id });
}
