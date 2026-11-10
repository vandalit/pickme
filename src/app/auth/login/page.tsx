import { signIn } from "@/auth"
import styles from "./page.module.css"
import Link from "next/link"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"

interface LoginPageProps {
  searchParams?: Promise<{
    error?: string
    callbackUrl?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const errorParam = resolvedParams.error
  const targetRedirect = resolvedParams.callbackUrl || "/admin"
  const googleLoginAvailable = Boolean(
    (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) &&
      (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET)
  )

  let errorMessage: string | null = null
  if (errorParam === "OAuthSignin" || errorParam === "OAuthCallbackError") {
    errorMessage = "No fue posible completar la autenticación con Google. Inténtalo nuevamente."
  } else if (errorParam === "Configuration") {
    errorMessage = "Aviso de configuración en el proveedor de autenticación. Verifica las credenciales de Google Cloud."
  } else if (errorParam === "NoSchool") {
    errorMessage = "Tu cuenta aún no tiene un establecimiento asignado. Si eres administrador, inicia el Onboarding."
  } else if (errorParam === "Suspended") {
    errorMessage = "Tu acceso a este espacio de trabajo está suspendido. Contacta al administrador del colegio."
  } else if (errorParam) {
    errorMessage = `Nota de acceso (${errorParam}).`
  }
  if (!googleLoginAvailable && !errorMessage) {
    errorMessage = "El acceso con Google no está configurado. Contacta al administrador del sistema."
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brandHeader}>
          <div className={styles.logoBadge}>
            <svg
              className={styles.brandIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span>PickMe Institucional</span>
          </div>
          <h1 className={styles.title}>Acceso Colegio</h1>
          <p className={styles.subtitle}>
            Portal seguro para la dirección y equipo administrativo escolar.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: "0.85rem 1rem",
              marginBottom: "1.25rem",
              borderRadius: "8px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#fca5a5",
              fontSize: "0.875rem",
              lineHeight: 1.45,
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* ── GOOGLE OAUTH PRINCIPAL ── */}
        {googleLoginAvailable && (
          <form
            action={async () => {
              "use server"
              try {
                await signIn("google", { redirectTo: targetRedirect })
              } catch (error) {
                if (isRedirectError(error)) {
                  throw error
                }
                if (error instanceof AuthError) {
                  return redirect(`/auth/login?error=${error.type}`)
                }
                if (error instanceof TypeError && error.message === "fetch failed") {
                  console.error("[login.google] No se pudo contactar al proveedor OAuth:", error)
                  return redirect("/auth/login?error=OAuthSignin")
                }
                throw error
              }
            }}
          >
            <button type="submit" className={styles.googleBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27a7.18 7.18 0 0 1 0-4.54V6.58H1.26a11.97 11.97 0 0 0 0 10.84l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>
          </form>
        )}

        <div className={styles.footerNotes}>
          <p>
            ¿Eres apoderado o retirador?{" "}
            <Link href="/retirar">Ir a Retiro Móvil</Link>
          </p>
          <p className={styles.footerNotice}>
            Acceso protegido con cifrado TLS 1.3 y sesiones autenticadas JWT.
          </p>
        </div>
      </div>
    </main>
  )
}
