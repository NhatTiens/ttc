import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCustomerCredentials } from "@/server/auth-service";
import { UserRole } from "@tuong-tac-pro/db";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(200)
});

function isUserRole(value: unknown): value is UserRole {
  return value === UserRole.CUSTOMER || value === UserRole.ADMIN;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: process.env.AUTH_TRUST_HOST === "true" || process.env.NODE_ENV !== "production",
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" }
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const user = await verifyCustomerCredentials(parsed.data.email, parsed.data.password);
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    async session({ session, token }) {
      const userId: unknown = token.userId;
      const role: unknown = token.role;
      const sessionVersion: unknown = token.sessionVersion;
      if (session.user && typeof userId === "string" && isUserRole(role) && typeof sessionVersion === "number") {
        session.user.id = userId;
        session.user.role = role;
        session.user.sessionVersion = sessionVersion;
      }
      return session;
    }
  }
});
