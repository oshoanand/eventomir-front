import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          // 1. Validate credentials input
          if (!credentials?.email || !credentials?.password) {
            throw new Error(
              "Требуется указать адрес электронной почты и пароль",
            );
          }

          // 2. Find user in database
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          // 3. Verify user exists AND has a password
          if (!user || !user.password) {
            throw new Error("Неверный адрес электронной почты или пароль!");
          }

          // 4. Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password,
          );

          if (!isValidPassword) {
            throw new Error("Неверный адрес электронной почты или пароль!");
          }

          // 5. Generate Token
          const secret = process.env.NEXTAUTH_SECRET;

          if (!secret) {
            throw new Error("Server configuration error");
          }

          const token = jwt.sign(
            {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              iat: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            },
            secret,
            {
              algorithm: "HS256",
            },
          );

          // -------------------------------------------------------------
          // 6. INTERCEPT PARTNER LOGIN FOR SEAMLESS TRANSFER
          // -------------------------------------------------------------
          if (user.role === "partner") {
            throw new Error(
              JSON.stringify({
                type: "PARTNER_REDIRECT",
                token: token,
              }),
            );
          }

          // 7. Normal login for customer/performer
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            accessToken: token,
          };
        } catch (error: any) {
          console.error("Authorize Error:", error.message);

          // 1. Pass through our special JSON error for partners
          if (error.message && error.message.includes("PARTNER_REDIRECT")) {
            throw error;
          }

          // 2. Pass through validation errors
          const isCustomError =
            error.message ===
              "Требуется указать адрес электронной почты и пароль" ||
            error.message === "Неверный адрес электронной почты или пароль!";

          if (isCustomError) {
            throw error;
          }

          // 3. Fallback for any other (system) errors
          throw new Error("Проверьте свой адрес электронной почты еще раз!");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.image = user.image ? user.image.toString() : null;
        token.name = user.name ? user.name.toString() : "";
        token.email = user.email ? user.email.toString() : "";
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.image = token.image as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        (session.user as any).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
