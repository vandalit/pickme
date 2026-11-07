import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
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
    authorized({ auth, request: { nextUrl } }) {
      // 1. Simulador sandbox público: JAMÁS bloquear
      if (nextUrl.pathname.startsWith("/admin/simulador")) {
        return true
      }

      const isLoggedIn = !!auth?.user
      const userRole = (auth?.user as any)?.role as string | undefined
      const userStatus = (auth?.user as any)?.userStatus as string | undefined

      const isAdminPath = nextUrl.pathname.startsWith("/admin")
      const isStaffPath = nextUrl.pathname.startsWith("/staff")

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

      return true
    },
  },
}

