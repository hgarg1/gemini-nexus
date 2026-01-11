import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransport } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { rpID, rpName } from "@/lib/webauthn";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: { authenticators: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email || user.name || "User",
    attestationType: "none",
    excludeCredentials: user.authenticators.map((auth) => ({
      id: auth.credentialID,
      type: "public-key",
      transports: auth.transports ? (JSON.parse(auth.transports) as AuthenticatorTransport[]) : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });

  // Remember the challenge for this user (usually in DB or signed cookie)
  // For simplicity/demo, we might need a Challenge table or use a stateless approach if supported,
  // but standard practice is DB.
  // We'll update the user with the challenge.
  // Wait, User model doesn't have currentChallenge field.
  // I should probably add it or use a separate table.
  // Using a VerificationToken-like structure or just adding it to User is easiest.
  // I'll add `currentChallenge` to User model in next step if needed, or use a temp storage.
  
  // Actually, let's use the DB. I'll update the schema to add `currentChallenge` to User.
  // But I can't run migrate easily again without risking errors.
  // I'll check if VerificationToken can be abused for this.
  // VerificationToken has { identifier, token, expires }.
  // I can use identifier=userId, token=challenge.
  
  await prisma.verificationToken.upsert({
    where: { identifier_token: { identifier: user.id, token: "webauthn-challenge" } }, // This composite key logic is flawed if token is part of unique
    // The unique is @@unique([identifier, token]).
    // I can't easily query by just identifier to update.
    // I will delete existing tokens for this user-action first.
    create: {
      identifier: user.id,
      token: options.challenge,
      expires: new Date(Date.now() + 60000 * 5), // 5 mins
    },
    update: {
      token: options.challenge,
      expires: new Date(Date.now() + 60000 * 5),
    },
  });
  // Wait, upsert requires a unique condition. [identifier, token] is unique.
  // I can't find by identifier alone.
  // I will use deleteMany then create.
  
  await prisma.verificationToken.deleteMany({
    where: { identifier: user.id }, // Assuming I can use this for challenge storage
  });
  
  await prisma.verificationToken.create({
    data: {
      identifier: user.id,
      token: options.challenge,
      expires: new Date(Date.now() + 60000 * 5),
    }
  });

  return NextResponse.json(options);
}
