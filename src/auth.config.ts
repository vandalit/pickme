import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "pickme_super_secret_session_token_32_chars_dev",
  providers: [],
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
    session({ session, token }) {
      if (!session.user) return session

      if (token.sub) session.user.id = token.sub
      if (
        token.role === "SUPERADMIN" ||
        token.role === "SCHOOL_ADMIN" ||
        token.role === "STAFF"
      ) {
        session.user.role = token.role
      }
      if (typeof token.schoolId === "string") {
        session.user.schoolId = token.schoolId
      }
      if (
        token.userStatus === "ACTIVE" ||
        token.userStatus === "PENDING" ||
        token.userStatus === "SUSPENDED"
      ) {
        session.user.userStatus = token.userStatus
      }
      session.user.workspaceSelectionRequired =
        token.workspaceSelectionRequired === true

      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      // 1. Simulador sandbox público: JAMÁS bloquear
      if (nextUrl.pathname.startsWith("/admin/simulador")) {
        return true
      }

      const isLoggedIn = !!auth?.user
      const userRole = auth?.user?.role
      const userStatus = auth?.user?.userStatus
      const schoolId = auth?.user?.schoolId
      const workspaceSelectionRequired = auth?.user?.workspaceSelectionRequired === true

      const isAdminPath = nextUrl.pathname.startsWith("/admin")
      const isStaffPath = nextUrl.pathname.startsWith("/staff")
      const isWorkspacePath = nextUrl.pathname.startsWith("/workspaces")
      const isOnboardingPath = nextUrl.pathname.startsWith("/onboarding")
      const isSchoolSetupPath = nextUrl.pathname === "/admin/onboarding"

      if (workspaceSelectionRequired && !isWorkspacePath && !isOnboardingPath) {
        return Response.redirect(new URL("/workspaces", nextUrl))
      }

      if (
        isLoggedIn &&
        userStatus === "SUSPENDED" &&
        (isAdminPath || isStaffPath || isWorkspacePath || isOnboardingPath)
      ) {
        return Response.redirect(new URL("/auth/login?error=Suspended", nextUrl))
      }

      // Staff autenticado que intenta entrar a /admin → redirigir a /staff
      if (isAdminPath && isLoggedIn && userRole === "STAFF") {
        return Response.redirect(new URL("/staff", nextUrl))
      }

      // Staff PENDING que intenta entrar a /staff → redirigir a espera de invitación
      if (isStaffPath && isLoggedIn && userStatus === "PENDING") {
        if (!nextUrl.pathname.startsWith("/staff/join")) {
          return Response.redirect(new URL("/staff/join?pending=1", nextUrl))
        }
      }

      // Rutas /admin y /staff requieren sesión
      if ((isAdminPath || isStaffPath) && !isLoggedIn) {
        const loginUrl = new URL("/auth/login", nextUrl)
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
        return Response.redirect(loginUrl)
      }

      if (
        (isAdminPath || isStaffPath) &&
        isLoggedIn &&
        !schoolId &&
        !(isStaffPath && nextUrl.pathname.startsWith("/staff/join")) &&
        !(
          isSchoolSetupPath &&
          (userRole === "SCHOOL_ADMIN" || userRole === "SUPERADMIN")
        )
      ) {
        const destination = userRole === "STAFF" ? "/staff/join" : "/onboarding"
        return Response.redirect(new URL(destination, nextUrl))
      }

      return true
    },
  },
}
