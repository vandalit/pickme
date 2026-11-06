import { signIn } from "@/auth"
import styles from "./page.module.css"
import Link from "next/link"

export default function LoginPage() {
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

        {/* ── FORMULARIO PRINCIPAL: CREDENCIALES INSTITUCIONALES ── */}
        <form
          action={async (formData: FormData) => {
            "use server"
            const email = formData.get("email") as string
            const password = formData.get("password") as string
            await signIn("credentials", {
              email,
              password,
              redirectTo: "/admin",
            })
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
              placeholder="ej: sofia@sanmartin.edu"
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
          <span>o continuar con</span>
        </div>

        {/* ── GOOGLE WORKSPACE OAUTH ── */}
        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/admin" })
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
