import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import YandexProvider from "next-auth/providers/yandex";
import GoogleProvider from "next-auth/providers/google";
import VkProvider from "next-auth/providers/vk";

// 🚨 Safe JWT Decoder: Works natively in Next.js Edge Runtime without 'jsonwebtoken'
function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

// Fallback features
const DEFAULT_FREE_FEATURES = {
  maxPhotoUpload: 3,
  emailSupport: true,
  chatSupport: false,
  profileSeo: false,
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Days
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

          const backendUrl =
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

          // 1. Delegate Authentication to Node.js Backend
          const res = await fetch(`${backendUrl}/api/auth/app/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          // 2. Handle Backend Rejections
          if (!res.ok) {
            if (data.type === "PARTNER_REDIRECT") {
              throw new Error(JSON.stringify(data));
            }
            throw new Error(
              data.message || "Неверный адрес электронной почты или пароль!",
            );
          }

          const { token, user } = data;

          if (!token) {
            throw new Error("Ошибка сервера: токен авторизации не получен.");
          }

          // 3. 🚨 DECODE JWT NATIVELY TO EXTRACT ID AND ROLE
          const decodedToken = decodeJwt(token);

          if (!decodedToken || decodedToken.id === undefined) {
            throw new Error("Ошибка сервера: недействительный токен.");
          }

          const userId = decodedToken.id;

          // 🚨 Strict check allows empty strings ("") to pass through!
          const userRole =
            decodedToken.role !== undefined ? decodedToken.role : "customer";

          // 4. Legacy Partner Redirect Support
          if (userRole === "partner") {
            throw new Error(
              JSON.stringify({
                type: "PARTNER_REDIRECT",
                token: token,
              }),
            );
          }

          // 5. Return Payload to NextAuth JWT Callback
          return {
            id: userId,
            name: user?.name || "",
            email: user?.email || credentials.email,
            phone: user?.phone || "",
            role: userRole,
            image: user?.image || null,
            accessToken: token,
            features: data.features || DEFAULT_FREE_FEATURES,
            subscriptionEndDate: data.subscriptionEndDate || null,
          } as any;
        } catch (error: any) {
          console.error("🚨 Authorize Error:", error.message);

          if (error.message && error.message.includes("PARTNER_REDIRECT")) {
            throw error;
          }

          throw new Error(error.message || "Системная ошибка сервера");
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
      // 🚨 Robust Session Update: Allows adopting new Token & Features post-registration
      if (trigger === "update" && session) {
        if (session.role !== undefined) token.role = session.role;
        if (session.accessToken) token.accessToken = session.accessToken;
        if (session.features) token.features = session.features;
        if (session.subscriptionEndDate !== undefined) {
          token.subscriptionEndDate = session.subscriptionEndDate;
        }
      }

      // Initial Sign In Hook
      if (account && user) {
        const isOAuth = ["yandex", "google", "vk"].includes(
          account.provider || "",
        );

        if (isOAuth) {
          // 🚨 OAUTH DELEGATION TO BACKEND
          try {
            const backendUrl =
              process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";
            const oauthRes = await fetch(`${backendUrl}/api/auth/oauth`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                email: user.email,
                name: user.name,
                image: user.image,
              }),
            });

            const oauthData = await oauthRes.json();

            if (oauthRes.ok && oauthData.token) {
              // 🚨 NATIVE DECODE OAUTH TOKEN FOR ID & ROLE
              const decodedOAuthToken = decodeJwt(oauthData.token);

              if (decodedOAuthToken) {
                token.id = decodedOAuthToken.id;
                // 🚨 Strict check ensures `""` stays `""` for the complete-registration route
                token.role =
                  decodedOAuthToken.role !== undefined
                    ? decodedOAuthToken.role
                    : "customer";
              }

              token.accessToken = oauthData.token;
              token.features = oauthData.features || DEFAULT_FREE_FEATURES;
              token.subscriptionEndDate = oauthData.subscriptionEndDate || null;
            } else {
              console.error("OAuth Backend Sync Failed:", oauthData);
            }
          } catch (err) {
            console.error("OAuth Backend Fetch Error:", err);
          }
        } else {
          // Credentials login data mapping
          token.id = user.id;
          token.role =
            (user as any).role !== undefined ? (user as any).role : "customer";
          token.accessToken = (user as any).accessToken;
          token.features = (user as any).features || DEFAULT_FREE_FEATURES;
          token.subscriptionEndDate = (user as any).subscriptionEndDate || null;
        }

        // Map standard user info
        token.image = user.image ? user.image.toString() : null;
        token.name = user.name ? user.name.toString() : "";
        token.email = user.email ? user.email.toString() : "";
      }

      return token;
    },

    // --- SESSION CALLBACK ---
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.image = token.image as string | null;
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
