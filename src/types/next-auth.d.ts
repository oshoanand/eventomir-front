// // types/next-auth.d.ts
// import NextAuth, { DefaultSession } from "next-auth";

// declare module "next-auth" {
//   /**
//    * Extends the built-in session user type
//    */
//   interface Session {
//     user: {
//       id: string;
//       name: string;
//       phone: string;
//       image?: string | null;
//       email?: string | null;
//       role: string;
//       accessToken: string;
//     };
//   }

//   /**
//    * Extends the built-in user type
//    */
//   interface User {
//     id: string;
//     name: string;
//     phone: string;
//     image?: string | null;
//     email?: string | null;
//     role: string;
//     accessToken: string;
//   }
// }

// declare module "next-auth/jwt" {
//   /**
//    * Extends the built-in JWT type
//    */
//   interface JWT {
//     id: string;
//     role: string;
//     name: string;
//     phone: string;
//     image?: string | null;
//     email?: string | null;
//     accessToken: string;
//   }
// }

// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      phone?: string | null;
      accessToken: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    phone?: string | null;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    accessToken: string;
  }
}
