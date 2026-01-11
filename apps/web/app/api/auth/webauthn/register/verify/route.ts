import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@repo/database";
import { rpID, origin } from "@/lib/webauthn";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const userId = (session.user as any).id;

  const challengeRecord = await prisma.verificationToken.findFirst({
    where: { identifier: userId },
  });

  if (!challengeRecord) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 400 });
  }

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challengeRecord.token,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (verification.verified && verification.registrationInfo) {
    const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo as any;

    await prisma.authenticator.create({
      data: {
        userId,
        credentialID: Buffer.from(credentialID).toString("base64url"),
        credentialPublicKey: Buffer.from(credentialPublicKey).toString("base64url"),
        counter,
        credentialDeviceType,
        credentialBackedUp,
        transports: body.response.transports ? JSON.stringify(body.response.transports) : null,
        providerAccountId: Buffer.from(credentialID).toString("base64url"), // Using cred ID as providerAccountId for uniqueness
      },
    });

    // Cleanup challenge
    await prisma.verificationToken.deleteMany({ where: { identifier: userId } });

    return NextResponse.json({ verified: true });
  }

  return NextResponse.json({ verified: false, error: "Verification failed" }, { status: 400 });
}
