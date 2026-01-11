import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@repo/database";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import bcrypt from "bcryptjs";

const MAX_TOKEN_IMAGE_LENGTH = 1024;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("Invalid password");
        }

        return user;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        // Fetch full user with role and permissions
        const fullUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            userRole: {
              include: {
                permissions: true,
              },
            },
          },
        });

        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        const image = typeof user.image === "string" ? user.image : undefined;
        token.picture = image && image.length <= MAX_TOKEN_IMAGE_LENGTH ? image : undefined;
        (token as any).phone = (user as any).phone;
        (token as any).role = fullUser?.userRole?.name || (user as any).role;
        (token as any).permissions = fullUser?.userRole?.permissions.map(p => p.name) || [];
      } else if (token.id && !(token as any).role) {
        // Auto-repair existing tokens missing role/permissions
        const fullUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            userRole: {
              include: {
                permissions: true,
              },
            },
          },
        });
        if (fullUser) {
          (token as any).role = fullUser.userRole?.name || "user";
          (token as any).permissions = fullUser.userRole?.permissions.map(p => p.name) || [];
        }
      }
      if (trigger === "update" && session?.user) {
        token.name = session.user.name;
        token.email = session.user.email;
        const image = typeof session.user.image === "string" ? session.user.image : undefined;
        token.picture = image && image.length <= MAX_TOKEN_IMAGE_LENGTH ? image : undefined;
        (token as any).phone = (session.user as any).phone;
      }
      if (typeof token.picture === "string" && token.picture.length > MAX_TOKEN_IMAGE_LENGTH) {
        token.picture = undefined;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as any).id = token.id;
        if (token.name !== undefined) session.user.name = token.name as string | null;
        if (token.email !== undefined) session.user.email = token.email as string | null;
        if (typeof token.picture === "string" && token.picture.length <= MAX_TOKEN_IMAGE_LENGTH) {
          session.user.image = token.picture;
        } else {
          session.user.image = null;
        }
        if ((token as any).phone !== undefined) (session.user as any).phone = (token as any).phone;
        if ((token as any).role !== undefined) (session.user as any).role = (token as any).role;
        if ((token as any).permissions !== undefined) (session.user as any).permissions = (token as any).permissions;
      }
      return session;
    },
  },
};
