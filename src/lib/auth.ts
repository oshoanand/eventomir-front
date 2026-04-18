import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import YandexProvider from "next-auth/providers/yandex";
import GoogleProvider from "next-auth/providers/google";
import VkProvider from "next-auth/providers/vk";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "@/utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// =================================================================
// CUSTOM PRISMA ADAPTER
// =================================================================
const CustomAdapter = PrismaAdapter(prisma) as Adapter;

const originalCreateUser = CustomAdapter.createUser;
CustomAdapter.createUser = async (data: any) => {
  return originalCreateUser!({
    ...data,
    profile_picture: data.image || null,
  });
};

const originalLinkAccount = CustomAdapter.linkAccount;
CustomAdapter.linkAccount = async (account: any) => {
  await prisma.user.update({
    where: { id: account.userId },
    data: { auth_provider: account.provider },
  });
  return originalLinkAccount!(account);
};

// 🚨 Фолбэк-функции для бесплатного тарифа
const DEFAULT_FREE_FEATURES = {
  maxPhotoUpload: 3,
  emailSupport: true,
  chatSupport: false,
  profileSeo: false,
};

// Нормализация JSON-фичей из БД
const normalizeFeatures = (rawFeatures: any) => {
  const normalized: Record<string, any> = {};
  if (typeof rawFeatures === "object" && rawFeatures !== null) {
    for (const [key, data] of Object.entries(rawFeatures)) {
      if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        (data as any).value !== undefined
      ) {
        normalized[key] = (data as any).value;
      } else {
        normalized[key] = data;
      }
    }
  }
  return normalized;
};

export const authOptions: NextAuthOptions = {
  adapter: CustomAdapter,
  session: {
    strategy: "jwt",
  },
  providers: [
    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID as string,
      clientSecret: process.env.YANDEX_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    VkProvider({
      clientId: process.env.VK_CLIENT_ID as string,
      clientSecret: process.env.VK_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error(
              "Требуется указать адрес электронной почты и пароль",
            );
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              subscription: {
                include: { plan: true },
              },
            },
          });

          if (!user || !user.password) {
            throw new Error("Неверный адрес электронной почты или пароль!");
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password,
          );

          if (!isValidPassword) {
            throw new Error("Неверный адрес электронной почты или пароль!");
          }

          const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
          if (!secret) {
            throw new Error(
              "КРИТИЧЕСКАЯ ОШИБКА: NEXTAUTH_SECRET не задан в .env файле сервера!",
            );
          }

          // 🚨 Надежная проверка подписки (устойчива к изменениям Prisma Schema)
          const now = new Date();
          const sub = user.subscription as any; // Cast to any to bypass strict TS schema mismatches
          let activeFeatures = DEFAULT_FREE_FEATURES;
          let subEndDate = null;

          if (sub) {
            // Поддержка как старого булева значения, так и нового строкового статуса
            const isSubActive =
              sub.status === "ACTIVE" || sub.isActive === true;
            const isNotExpired = !sub.endDate || new Date(sub.endDate) > now;

            if (isSubActive && isNotExpired) {
              activeFeatures = {
                ...DEFAULT_FREE_FEATURES,
                ...normalizeFeatures(sub.plan?.features),
              };
              subEndDate = sub.endDate
                ? new Date(sub.endDate).toISOString()
                : null;
            }
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
            { algorithm: "HS256" },
          );

          if (user.role === "partner") {
            throw new Error(
              JSON.stringify({
                type: "PARTNER_REDIRECT",
                token: token,
              }),
            );
          }

          return {
            id: user.id,
            name: user.name || "",
            email: user.email,
            phone: user.phone || "",
            role: user.role || "customer",
            accessToken: token,
            features: activeFeatures,
            subscriptionEndDate: subEndDate,
          } as any;
        } catch (error: any) {
          console.error("🚨 Authorize Error:", error);

          if (error.message && error.message.includes("PARTNER_REDIRECT")) {
            throw error;
          }

          // Если это наша кастомная ошибка валидации, передаем ее клиенту
          if (
            error.message ===
              "Требуется указать адрес электронной почты и пароль" ||
            error.message === "Неверный адрес электронной почты или пароль!" ||
            error.message.includes("КРИТИЧЕСКАЯ ОШИБКА")
          ) {
            throw error;
          }

          // Если произошел системный сбой (например, Prisma упала), показываем реальную ошибку
          // throw new Error(`Системная ошибка сервера: ${error.message}`);
          throw new Error(`Системная ошибка сервера`);
        }
      },
    }),
  ],

  callbacks: {
    async signIn() {
      return true;
    },

    // --- JWT CALLBACK ---
    async jwt({ token, user, account, trigger, session }) {
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }

      if (user) {
        token.id = user.id;
        token.image = user.image ? user.image.toString() : null;
        token.name = user.name ? user.name.toString() : "";
        token.email = user.email ? user.email.toString() : "";
        token.role = (user as any).role || null;

        const isOAuth = ["yandex", "google", "vk"].includes(
          account?.provider || "",
        );

        if (isOAuth) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { subscription: { include: { plan: true } } },
          });

          const now = new Date();
          const sub = dbUser?.subscription as any;
          let activeFeatures = DEFAULT_FREE_FEATURES;
          let subEndDate = null;

          if (sub) {
            const isSubActive =
              sub.status === "ACTIVE" || sub.isActive === true;
            const isNotExpired = !sub.endDate || new Date(sub.endDate) > now;

            if (isSubActive && isNotExpired) {
              activeFeatures = {
                ...DEFAULT_FREE_FEATURES,
                ...normalizeFeatures(sub.plan?.features),
              };
              subEndDate = sub.endDate
                ? new Date(sub.endDate).toISOString()
                : null;
            }
          }

          token.features = activeFeatures;
          token.subscriptionEndDate = subEndDate;

          const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
          if (secret) {
            token.accessToken = jwt.sign(
              {
                id: user.id,
                name: user.name,
                email: user.email,
                role: token.role,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
              },
              secret,
              { algorithm: "HS256" },
            );
          }
        } else {
          token.accessToken = (user as any).accessToken;
          token.features = (user as any).features;
          token.subscriptionEndDate = (user as any).subscriptionEndDate;
        }
      }
      return token;
    },

    // --- SESSION CALLBACK ---
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.image = token.image as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        (session.user as any).features = token.features as Record<string, any>;
        (session.user as any).subscriptionEndDate =
          token.subscriptionEndDate as string | null;
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
