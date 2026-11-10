import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  // Protege /admin (incluyendo la raíz /admin y todas sus subrutas excepto el simulador público), /staff y /onboarding
  matcher: [
    "/admin",
    "/admin/((?!simulador).*)",
    "/staff",
    "/staff/:path*",
    "/onboarding",
    "/workspaces",
  ],
}
