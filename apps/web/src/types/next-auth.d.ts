import type { DefaultSession } from "next-auth";
import type { UserRole } from "@tuong-tac-pro/db";

declare module "next-auth" {
  interface User {
    role: UserRole;
    sessionVersion: number;
  }
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      sessionVersion: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: UserRole;
    sessionVersion?: number;
  }
}
