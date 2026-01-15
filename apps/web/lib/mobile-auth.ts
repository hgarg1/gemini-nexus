import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function getSessionUser(req: NextRequest) {
  // 1. Try standard NextAuth session (Web / Cookies)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return session.user;
  }

  // 2. Try Bearer Token (Mobile)
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      // We use the same secret that signed the token in /api/mobile-connect/login
      const secret = process.env.NEXTAUTH_SECRET || "super-secret-key-change-me";
      
      // Since we manually encoded it, we need to manually verify or use next-auth's decode
      // However, `getToken` expects a request object with cookies usually.
      // Let's rely on standard JWT verification for this manually created token.
      
      const { decode } = require("next-auth/jwt");
      const decoded = await decode({ token, secret });

      if (decoded) {
        // Map the decoded token back to a user object structure
        return {
          id: decoded.id || decoded.sub,
          name: decoded.name,
          email: decoded.email,
          image: decoded.picture,
          // Add other fields if needed, like role
        };
      }
    } catch (e) {
      console.error("Mobile Token Verification Failed:", e);
    }
  }

  return null;
}
