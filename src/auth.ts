import NextAuth, { AuthError } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { prisma } from "@/lib/db"

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || ""
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || ""

const providers = []

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
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
        let dbUser = await prisma.user.findUnique({
          where: { email },
          include: { school: true },
        })

        // Si es una cuenta nueva, registrarla como SCHOOL_ADMIN pendiente de onboarding
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
        console.error("[auth.authorize] Error al verificar o registrar usuario en BD:", err)
        return null
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

      // Sincronización transparente de cuenta Google en PostgreSQL
      if (account?.provider === "google" && token.email) {
        token.googleIdToken = account.id_token
        try {
          const normalizedEmail = (token.email as string).trim().toLowerCase()
          let dbUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          })

          // Si es primer ingreso con Google: crear usuario en BD como SCHOOL_ADMIN
          if (!dbUser) {
            const userName = (token.name as string) || normalizedEmail.split("@")[0]
            dbUser = await prisma.user.create({
              data: {
                email: normalizedEmail,
                name: userName,
                role: "SCHOOL_ADMIN",
                status: "ACTIVE",
                avatarUrl: (token.picture as string) || null,
              },
            })
          }

          token.role = dbUser.role
          token.sub = dbUser.id
          token.schoolId = dbUser.schoolId
          token.userStatus = dbUser.status
        } catch (err) {
          console.error("[auth.jwt] Error sincronizando usuario Google en BD:", err)
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
