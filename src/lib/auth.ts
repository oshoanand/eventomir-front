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
// Intercepts DB events to reliably save auth_provider and profile_picture
// =================================================================
const CustomAdapter = PrismaAdapter(prisma) as Adapter;

// 1. Intercept User Creation
const originalCreateUser = CustomAdapter.createUser;
CustomAdapter.createUser = async (data: any) => {
  return originalCreateUser!({
    ...data,
    // Automatically copy NextAuth's 'image' to your custom 'profile_picture' column
    profile_picture: data.image || null,
  });
};

// 2. Intercept Account Linking
const originalLinkAccount = CustomAdapter.linkAccount;
CustomAdapter.linkAccount = async (account: any) => {
  await prisma.user.update({
    where: { id: account.userId },
    data: { auth_provider: account.provider },
  });
  return originalLinkAccount!(account);
};

// 🚨 Define a basic fallback in case the user has no subscription yet
const DEFAULT_FREE_FEATURES = {
  maxPhotoUpload: 3,
  emailSupport: true,
  chatSupport: false,
  profileSeo: false,
};

// Helper to normalize rich JSON features into simple key-value pairs for the session
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

          // Fetch the user AND their active subscription plan features
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

          const secret = process.env.NEXTAUTH_SECRET;
          if (!secret) {
            throw new Error("Server configuration error");
          }

          // 🚨 Evaluate Subscription State & Expiration Date
          const now = new Date();
          const sub = user.subscription;
          let activeFeatures = DEFAULT_FREE_FEATURES;
          let subEndDate = null;

          // 🚨 FIX: Changed sub.isActive to sub.status === "ACTIVE"
          if (
            sub &&
            sub.status === "ACTIVE" &&
            (!sub.endDate || sub.endDate > now)
          ) {
            // Merge database JSON features over the defaults
            activeFeatures = {
              ...DEFAULT_FREE_FEATURES,
              ...normalizeFeatures(sub.plan.features),
            };
            // Format the end date for the frontend JIT lock
            subEndDate = sub.endDate ? sub.endDate.toISOString() : null;
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
            subscriptionEndDate: subEndDate, // 🚨 Pass expiration date forward
          } as any;
        } catch (error: any) {
          console.error("Authorize Error:", error.message);

          if (error.message && error.message.includes("PARTNER_REDIRECT")) {
            throw error;
          }

          const isCustomError =
            error.message ===
              "Требуется указать адрес электронной почты и пароль" ||
            error.message === "Неверный адрес электронной почты или пароль!";

          if (isCustomError) throw error;
          throw new Error("Проверьте свой адрес электронной почты еще раз!");
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

      // If user logs in via OAuth (Google/Yandex/VK), we don't have their features yet.
      // We must fetch them from the database here.
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
          // Fetch features and expiration date from DB for OAuth logins
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { subscription: { include: { plan: true } } },
          });

          const now = new Date();
          const sub = dbUser?.subscription;
          let activeFeatures = DEFAULT_FREE_FEATURES;
          let subEndDate = null;

          // 🚨 FIX: Changed sub.isActive to sub.status === "ACTIVE"
          if (
            sub &&
            sub.status === "ACTIVE" &&
            (!sub.endDate || sub.endDate > now)
          ) {
            activeFeatures = {
              ...DEFAULT_FREE_FEATURES,
              ...normalizeFeatures(sub.plan.features),
            };
            subEndDate = sub.endDate ? sub.endDate.toISOString() : null;
          }

          token.features = activeFeatures;
          token.subscriptionEndDate = subEndDate; // 🚨 Inject to token

          const secret = process.env.NEXTAUTH_SECRET;
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
          // It's a Credentials login, features/dates were already fetched in authorize()
          token.accessToken = (user as any).accessToken;
          token.features = (user as any).features;
          token.subscriptionEndDate = (user as any).subscriptionEndDate; // 🚨 Inject to token
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
