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
      name: "Credenciales Institucionales",
      credentials: {
        email: { label: "Correo Institucional", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase()
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        // Sofía Valenzuela (Directora de Colegio San Martín)
        if (email === "sofia@sanmartin.edu") {
          return {
            id: "user-sofia-admin",
            name: "Sofía Valenzuela",
            email: "sofia@sanmartin.edu",
            role: "SCHOOL_ADMIN",
            image: "https://api.dicebear.com/7.x/bottts/svg?seed=sofia",
          }
        }

        // Carlos Mendoza (Auxiliar de Portón)
        if (email === "carlos.puertas@sanmartin.edu") {
          return {
            id: "user-carlos-staff",
            name: "Carlos Mendoza",
            email: "carlos.puertas@sanmartin.edu",
            role: "STAFF",
            image: "https://api.dicebear.com/7.x/bottts/svg?seed=carlos",
          }
        }

        // Cuentas institucionales válidas
        if (email.includes("@")) {
          const rawName = email.split("@")[0].replace(".", " ")
          const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
          return {
            id: `user-${email}`,
            name: formattedName,
            email: email,
            role: "SCHOOL_ADMIN",
          }
        }

        return null
      },
    }),
  ],
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días de persistencia de sesión
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // El sandbox de clientes del home es accesible directamente
      if (nextUrl.pathname.startsWith("/admin/simulador")) return true

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
        if ((user as any).role) {
          token.role = (user as any).role
        }
      }
      if (account?.provider === "google" && account.id_token) {
        token.googleIdToken = account.id_token
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        if (token.sub) session.user.id = token.sub
        if (token.email) session.user.email = token.email
        if (token.name) session.user.name = token.name
        if (token.picture) session.user.image = token.picture as string
        if (token.role) (session.user as any).role = token.role
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
