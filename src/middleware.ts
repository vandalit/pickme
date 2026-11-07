import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  // Protege las rutas administrativas (excluyendo el simulador interactivo público) y de staff
  matcher: [
    "/admin/((?!simulador).*)",
    "/staff/:path*",
  ],
}
