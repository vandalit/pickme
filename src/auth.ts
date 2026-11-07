import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import { prisma } from "@/lib/db"

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

        // Consultar usuario real en BD (fuente de verdad para el rol)
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            include: { school: true },
          })

          if (dbUser) {
            return {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              role: dbUser.role,
              schoolId: dbUser.schoolId,
              image: dbUser.avatarUrl ?? undefined,
            }
          }
        } catch (_err) {
          // BD no disponible — continúa con credenciales de desarrollo
        }

        // Fallback de desarrollo: cuenta demo de Sofía (directora)
        if (email === "sofia@sanmartin.edu") {
          return {
            id: "user-sofia-admin",
            name: "Sofía Valenzuela",
            email: "sofia@sanmartin.edu",
            role: "SCHOOL_ADMIN",
            image: "https://api.dicebear.com/7.x/bottts/svg?seed=sofia",
          }
        }

        return null
      },
    }),
  ],
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
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
      const userRole = (auth?.user as any)?.role as string | undefined

      const isAdminPath = nextUrl.pathname.startsWith("/admin")
      const isStaffPath = nextUrl.pathname.startsWith("/staff")

      // Staff autenticado que intenta entrar a /admin → redirigir a /staff
      if (isAdminPath && isLoggedIn && userRole === "STAFF") {
        return Response.redirect(new URL("/staff", nextUrl))
      }

      // Rutas /admin y /staff requieren autenticación
      if ((isAdminPath || isStaffPath) && !isLoggedIn) {
        const loginUrl = new URL("/auth/login", nextUrl)
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
        return Response.redirect(loginUrl)
      }

      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id ?? token.sub
        token.name = user.name
        token.email = user.email
        token.picture = user.image
        if ((user as any).role) {
          token.role = (user as any).role
        }
        if ((user as any).schoolId) {
          token.schoolId = (user as any).schoolId
        }
      }
      if (account?.provider === "google" && account.id_token) {
        token.googleIdToken = account.id_token
        // Para Google OAuth: leer rol real desde BD en cada sign-in
        if (token.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: token.email as string },
            })
            if (dbUser) {
              token.role = dbUser.role
              token.sub = dbUser.id
              token.schoolId = dbUser.schoolId
            }
          } catch (_err) {
            // BD no disponible — mantener rol del token
          }
        }
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
        if (token.schoolId) (session.user as any).schoolId = token.schoolId
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
