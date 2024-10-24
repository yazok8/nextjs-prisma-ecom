// src/lib/auth.ts

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import {prisma} from '@/lib/prisma';
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",  
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john@gmail.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) {
            console.log("Missing credentials");
            return null;
          }
      
          const { email, password } = credentials as { email: string; password: string };
      
          if (!email || !password) {
            console.log("Missing email or password");
            return null;
          }
      
          const normalizedEmail = email.toLowerCase();
      
          const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      
          if (!user) {
            console.log("User not found for email:", email);
            return null;
          }
      
          const isValid = await bcrypt.compare(password, user.hashedPassword);
      
          if (!isValid) {
            console.log("Invalid password for email:", email);
            return null;
          }
      
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Error in authorize function:", error);
          return null;
        }
      },
      
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          name: token.name,
          email: token.email,
          role: token.role,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/user/sign-in",
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
};
