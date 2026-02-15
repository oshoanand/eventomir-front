import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      } as const,

      async authorize(credentials) {
        try {
          // 1. Validate credentials
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and Password are required");
          }

          // 2. Find user in database
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          // 3. Verify user exists
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

          const secret = process.env.NEXT_PUBLIC_SECRET!!;
          const token = jwt.sign(
            {
              id: user.id,
              name: user.name,
              email: user.email,
              iat: Date.now() / 1000,
              exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            },
            secret,
            {
              algorithm: "HS256",
            },
          );
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            accessToken: token,
          };
        } catch (error: any) {
          throw new Error(error.message);
        } finally {
          async () => {
            await prisma.$disconnect();
          };
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.image = user.image ? user.image.toString() : null;
        token.name = user.name ? user.name.toString() : "";
        token.email = user.email ? user.email.toString() : "";
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.image = token.image;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.role = token.role;
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/login", // Custom sign-in page path
  },
  secret: process.env.NEXT_PUBLIC_SECRET,
};
