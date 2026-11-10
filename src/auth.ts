import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { cookies } from "next/headers"
import { authConfig } from "./auth.config"
import { prisma } from "@/lib/db"

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || ""
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || ""
const activeSchoolCookie = "pickme_active_school"

const providers = []

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  )
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "pickme_super_secret_session_token_32_chars_dev",
  trustHost: true,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google") {
        const email = (user?.email || token.email || "").trim().toLowerCase()
        const googleId = account.providerAccountId
        if (!email || !googleId || profile?.email_verified !== true) {
          throw new Error("Google did not provide a stable account ID and verified email.")
        }

        let dbUser = await prisma.user.findUnique({ where: { googleId } })
        if (dbUser) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              email,
              name: user?.name || dbUser.name,
              avatarUrl: user?.image || dbUser.avatarUrl,
            },
          })
        } else {
          const emailUser = await prisma.user.findUnique({ where: { email } })
          if (emailUser?.googleId && emailUser.googleId !== googleId) {
            throw new Error("This email is already linked to a different Google identity.")
          }

          dbUser = emailUser
            ? await prisma.user.update({
                where: { id: emailUser.id },
                data: {
                  googleId,
                  name: user?.name || emailUser.name,
                  avatarUrl: user?.image || emailUser.avatarUrl,
                },
              })
            : await prisma.user.create({
                data: {
                  email,
                  name: user?.name || email.split("@")[0],
                  googleId,
                  avatarUrl: user?.image || null,
                  onboardingRole: "SCHOOL_ADMIN",
                },
              })
        }

        token.sub = dbUser.id
        token.email = dbUser.email
        token.name = dbUser.name
      }

      if (token.sub) {
        const [dbUser, memberships, cookieStore] = await Promise.all([
          prisma.user.findUnique({ where: { id: token.sub } }),
          prisma.schoolMembership.findMany({
            where: { userId: token.sub, status: "ACTIVE" },
            select: { id: true, schoolId: true, role: true, status: true },
          }),
          cookies(),
        ])

        if (!dbUser) {
          throw new Error("The authenticated PickMe user no longer exists.")
        }

        const selectedSchoolId =
          cookieStore.get(activeSchoolCookie)?.value || token.schoolId
        const membership =
          memberships.find((item) => item.schoolId === selectedSchoolId) ||
          (memberships.length === 1 ? memberships[0] : null)

        if (membership) {
          token.schoolId = membership.schoolId
          token.role = membership.role
          token.userStatus = membership.status
          token.workspaceSelectionRequired = false
        } else {
          delete token.schoolId
          delete token.role
          delete token.userStatus
          token.workspaceSelectionRequired = memberships.length > 1

          if (memberships.length === 0) {
            const nonActiveMembership = await prisma.schoolMembership.findFirst({
              where: { userId: token.sub, status: { in: ["PENDING", "SUSPENDED"] } },
              orderBy: { updatedAt: "desc" },
              select: { schoolId: true, role: true, status: true },
            })
            const pendingInvitation = await prisma.invitation.findFirst({
              where: {
                email: dbUser.email,
                acceptedAt: null,
                expiresAt: { gte: new Date() },
              },
              orderBy: { createdAt: "desc" },
              select: { schoolId: true, role: true },
            })
            token.role = nonActiveMembership?.role || pendingInvitation?.role || dbUser.onboardingRole
            token.userStatus = nonActiveMembership?.status || (pendingInvitation ? "PENDING" : undefined)
            token.schoolId = nonActiveMembership?.schoolId || pendingInvitation?.schoolId
          }
        }
      }

      return token
    },
  },
})
