import { signIn } from "@/auth"
import styles from "./page.module.css"
import Link from "next/link"
import { isRedirectError } from "next/dist/client/components/redirect-error"

interface LoginPageProps {
  searchParams?: Promise<{
    error?: string
    callbackUrl?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const errorParam = resolvedParams.error

  let errorMessage: string | null = null
  if (errorParam === "CredentialsSignin") {
    errorMessage = "Credenciales incorrectas. Verifica tu correo y contraseña."
  } else if (errorParam === "Configuration") {
    errorMessage =
      "El inicio con Google no está disponible en este entorno. Puedes ingresar directamente con cualquier correo institucional y contraseña (tu cuenta de Administrador se activará de inmediato)."
  } else if (errorParam) {
    errorMessage = `Nota de acceso (${errorParam}). Si es tu primera vez, ingresa con tu correo para inicializar tu colegio.`
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

        {/* ── FORMULARIO PRINCIPAL: CREDENCIALES INSTITUCIONALES ── */}
        <form
          action={async (formData: FormData) => {
            "use server"
            const email = (formData.get("email") as string)?.trim().toLowerCase()
            const password = formData.get("password") as string
            try {
              await signIn("credentials", {
                email,
                password,
                redirectTo: "/admin",
              })
            } catch (error) {
              if (isRedirectError(error)) {
                throw error
              }
              console.error("[Login Action] Error en signIn:", error)
              throw error
            }
          }}
          className={styles.form}
        >
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Correo Electrónico Institucional
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ej: director@colegio.cl"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            <span>Ingresar a Consola Escolar</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>

        <div className={styles.divider}>
          <span>o acceso libre</span>
        </div>

        <Link
          href="/admin/simulador"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            color: "#e2e8f0",
            fontSize: "0.875rem",
            fontWeight: 500,
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>Probar Simulador Interactivo (Sin login)</span>
        </Link>

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
