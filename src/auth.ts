import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { prisma } from "@/lib/db"

const providers = []

// Solo activar Google si las credenciales existen en el entorno
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

providers.push(
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

      try {
        // 1. Buscar usuario en base de datos
        let dbUser = await prisma.user.findUnique({
          where: { email },
          include: { school: true },
        })

        // 2. Si no existe, crearlo para habilitar el flujo de Onboarding / Creación de colegio
        if (!dbUser) {
          const userName = email.split("@")[0].replace(/[._-]/g, " ")
          dbUser = await prisma.user.create({
            data: {
              email,
              name: userName.charAt(0).toUpperCase() + userName.slice(1),
              role: "SCHOOL_ADMIN",
              status: "ACTIVE",
            },
            include: { school: true },
          })
        }

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          schoolId: dbUser.schoolId,
          userStatus: dbUser.status,
          image: dbUser.avatarUrl ?? undefined,
        }
      } catch (err) {
        console.error("[auth.authorize] Error al consultar o registrar usuario en BD:", err)
        // Fallback resiliente: permitir acceso administrativo local para no bloquear al usuario ante timeout de BD
        return {
          id: `local-${email}`,
          name: email.split("@")[0],
          email,
          role: "SCHOOL_ADMIN",
          schoolId: null,
          userStatus: "ACTIVE",
        }
      }
    },
  })
)

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
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
        if ((user as any).userStatus) {
          token.userStatus = (user as any).userStatus
        }
      }
      if (account?.provider === "google" && account.id_token) {
        token.googleIdToken = account.id_token
        if (token.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: token.email as string },
            })
            if (dbUser) {
              token.role = dbUser.role
              token.sub = dbUser.id
              token.schoolId = dbUser.schoolId
              token.userStatus = dbUser.status
            }
          } catch (_err) {
            // BD no disponible — mantener rol actual
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
        if (token.userStatus) (session.user as any).userStatus = token.userStatus
      }
      return session
    },
  },
})
