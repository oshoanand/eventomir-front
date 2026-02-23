// import type { NextAuthOptions } from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
// import { prisma } from "@/utils/prisma";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export const authOptions: NextAuthOptions = {
//   adapter: PrismaAdapter(prisma),
//   session: {
//     strategy: "jwt",
//   },
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "text" },
//         password: { label: "Password", type: "password" },
//       },

//       async authorize(credentials) {
//         try {
//           // 1. Validate credentials input
//           if (!credentials?.email || !credentials?.password) {
//             throw new Error(
//               "Требуется указать адрес электронной почты и пароль",
//             );
//           }

//           // 2. Find user in database
//           const user = await prisma.user.findUnique({
//             where: {
//               email: credentials.email,
//             },
//           });

//           // 3. Verify user exists AND has a password
//           // We combine these checks to prevent user enumeration (security best practice)
//           if (!user || !user.password) {
//             throw new Error("Неверный адрес электронной почты или пароль!");
//           }

//           // 4. Verify password
//           const isValidPassword = await bcrypt.compare(
//             credentials.password,
//             user.password,
//           );

//           if (!isValidPassword) {
//             throw new Error("Неверный адрес электронной почты или пароль!");
//           }

//           // 5. Generate Token
//           const secret = process.env.NEXTAUTH_SECRET;

//           if (!secret) {
//             throw new Error("Server configuration error");
//           }

//           const token = jwt.sign(
//             {
//               id: user.id,
//               name: user.name,
//               email: user.email,
//               role: user.role,
//               iat: Math.floor(Date.now() / 1000),
//               exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
//             },
//             secret,
//             {
//               algorithm: "HS256",
//             },
//           );

//           return {
//             id: user.id,
//             name: user.name,
//             email: user.email,
//             phone: user.phone,
//             role: user.role,
//             accessToken: token,
//           };
//         } catch (error: any) {
//           // 1. Log the actual technical error to the server console for the developer
//           console.error("Authorize Error:", error);

//           // 2. Determine if it's an error we manually threw above (User-friendly)
//           // or a system error (Prisma/DB crash)
//           const isCustomError =
//             error.message ===
//               "Требуется указать адрес электронной почты и пароль" ||
//             error.message === "Неверный адрес электронной почты или пароль!";

//           if (isCustomError) {
//             throw new Error(error.message);
//           }

//           // 3. If it's a database/prisma error, mask it with a generic message
//           throw new Error("Проверьте свой адрес электронной почты еще раз!");
//         }
//       },
//     }),
//   ],

//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;
//         token.image = user.image ? user.image.toString() : null;
//         token.name = user.name ? user.name.toString() : "";
//         token.email = user.email ? user.email.toString() : "";
//         token.accessToken = user.accessToken;
//         token.role = user.role;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (session.user) {
//         session.user.id = token.id as string;
//         session.user.image = token.image as string;
//         session.user.name = token.name as string;
//         session.user.email = token.email as string;
//         session.user.role = token.role as string;
//         session.user.accessToken = token.accessToken as string;
//       }
//       return session;
//     },
//   },
//   pages: {
//     signIn: "/login",
//   },
//   secret: process.env.NEXTAUTH_SECRET,
// };

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
          // 6. NEW: INTERCEPT PARTNER LOGIN FOR SEAMLESS TRANSFER
          // -------------------------------------------------------------
          if (user.role === "partner") {
            // Throwing an error prevents NextAuth from logging them in on localhost:3000.
            // We pass a JSON string so the frontend login page can parse the token and redirect.
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
          console.error("Authorize Error:", error);

          // 1. Check if the error is our custom JSON redirect string
          try {
            const parsedError = JSON.parse(error.message);
            if (parsedError.type === "PARTNER_REDIRECT") {
              // Pass the JSON string exactly as is to the frontend
              throw new Error(error.message);
            }
          } catch (e) {
            // If JSON.parse fails, it means it's a standard text error. We can ignore this catch block.
          }

          // 2. Determine if it's a user-friendly error we manually threw
          const isCustomError =
            error.message ===
              "Требуется указать адрес электронной почты и пароль" ||
            error.message === "Неверный адрес электронной почты или пароль!";

          if (isCustomError) {
            throw new Error(error.message);
          }

          // 3. If it's a database/prisma error, mask it with a generic message
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
