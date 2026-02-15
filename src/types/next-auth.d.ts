// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in session user type
   */
  interface Session {
    accessToken: string;
    user: {
      id: string;
      name: string;
      phone: string;
      image?: string | null;
      email?: string | null;
      role: string;
    };
  }

  /**
   * Extends the built-in user type
   */
  interface User {
    id: string;
    name: string;
    phone: string;
    image?: string | null;
    email?: string | null;
    role: string;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT type
   */
  interface JWT {
    id: string;
    role: string;
    name: string;
    phone: string;
    image?: string | null;
    email?: string | null;
    accessToken: string;
  }
}
