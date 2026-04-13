// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      phone?: string | null;
      accessToken: string;
      features: Record<string, any>;
      subscriptionEndDate?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    phone?: string | null;
    accessToken: string;
    features: Record<string, any>;
    subscriptionEndDate?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    accessToken: string;
    // 🚨 FIX: Add features to the JWT token payload
    features: Record<string, any>;
    subscriptionEndDate?: string | null;
  }
}
