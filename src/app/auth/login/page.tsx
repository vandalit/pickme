import { signIn } from "@/auth"
import styles from "./page.module.css"
import Link from "next/link"

export default function LoginPage() {
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logoBadge}>
            <span>🛡️</span> PickMe Admin
          </div>
          <h1 className={styles.title}>Acceso Administrativo</h1>
          <p className={styles.subtitle}>
            Portal seguro para directores y coordinadores del establecimiento escolar.
          </p>
        </div>

        <div className={styles.authOptions}>
          {/* Opción 1: Google OAuth Oficial */}
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/admin" })
            }}
          >
            <button type="submit" className={styles.googleBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24">
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

          <div className={styles.divider}>
            <span>o para evaluación</span>
          </div>

          {/* Opción 2: Cuenta Demo Instantánea para Portfolio/Revisor */}
          <div className={styles.demoBox}>
            <div className={styles.demoHeading}>
              <span>⚡</span> Modo Evaluación de Portafolio
            </div>
            <form
              action={async () => {
                "use server"
                await signIn("credentials", {
                  email: "sofia@sanmartin.edu",
                  password: "demo",
                  redirectTo: "/admin",
                })
              }}
            >
              <button type="submit" className={styles.demoBtn}>
                Ingresar como Sofía (Directora Demo)
              </button>
            </form>
          </div>
        </div>

        <div className={styles.footerNotes}>
          <p>
            ¿Buscas el flujo de retiro de alumnos?{" "}
            <Link href="/retirar">Ir a Retiro Móvil</Link> o{" "}
            <Link href="/admin/simulador">Ver Simulador Sandbox</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

