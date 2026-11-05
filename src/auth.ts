import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "Cuenta Demo",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        // Acceso demo instantáneo para evaluación de portafolio
        const email = credentials?.email as string | undefined
        if (email === "sofia@sanmartin.edu" || email === "admin@pickme.app") {
          return {
            id: "user-sofia-admin",
            name: "Sofía M. (Directora)",
            email: email,
            role: "SCHOOL_ADMIN",
            image: "https://api.dicebear.com/7.x/bottts/svg?seed=sofia",
          }
        }
        return null
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAdminPath = nextUrl.pathname.startsWith("/admin")

      if (isAdminPath) return isLoggedIn
      return true
    },
    jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id ?? token.sub
        token.name = user.name
        token.email = user.email
        token.picture = user.image
      }
      if (account?.provider === "google" && account.id_token) {
        token.googleIdToken = account.id_token
      }
      return token
    },
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
