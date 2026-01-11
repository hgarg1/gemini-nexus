import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { rpID, origin } from "@/lib/webauthn";

export async function POST(req: Request) {
  const body = await req.json();
  const { response, userId } = body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { authenticators: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const challengeRecord = await prisma.verificationToken.findFirst({
    where: { identifier: userId },
  });

  if (!challengeRecord) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 400 });
  }

  const authenticator = user.authenticators.find(
    (auth) => auth.credentialID === response.id
  );

  if (!authenticator) {
    return NextResponse.json({ error: "Authenticator not registered" }, { status: 400 });
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challengeRecord.token,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: authenticator.credentialID,
      credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, "base64url"),
      counter: authenticator.counter,
      transports: authenticator.transports ? JSON.parse(authenticator.transports) : undefined,
    },
  } as any);

  if (verification.verified) {
    const { authenticationInfo } = verification;
    
    await prisma.authenticator.update({
      where: { credentialID: authenticator.credentialID },
      data: {
        counter: authenticationInfo.newCounter,
      },
    });

    await prisma.verificationToken.deleteMany({ where: { identifier: userId } });

    // Login successful - return user data so frontend can signIn via next-auth credentials
    // Ideally we mint a session here or use next-auth's signIn('credentials') flow.
    // For this implementation, we will verify here and then the frontend will 
    // call signIn("credentials", { ... }) with a special "passkey" flag or similar, 
    // OR we can just assume if this verify endpoint returns true, the frontend acts accordingly.
    // But next-auth needs to know.
    // We can use a custom Credentials provider that accepts "webauthn" data.
    // Or we return a token here that the credentials provider accepts.
    
    return NextResponse.json({ verified: true, email: user.email });
  }

  return NextResponse.json({ verified: false }, { status: 400 });
}
