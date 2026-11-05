import Link from "next/link"
import Image from "next/image"
import styles from "./page.module.css"

export default function HomePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <span>🛡️</span>
            <span>
              Pick<span className={styles.brandDot}>Me</span>
            </span>
          </Link>
          <nav className={styles.headerNav}>
            <Link href="/admin/simulador" className={styles.loginLink}>
              ⚡ Abrir Simulador Sandbox
            </Link>
            <Link href="/auth/login" className={styles.loginLink}>
              Acceso Colegio
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.badge}>
            <span>✦</span> Caso de Estudio UX & MVP Productivo
          </div>
          <h1 className={styles.title}>
            Salida escolar digital con{" "}
            <span className={styles.titleAccent}>anonimato público</span> y
            custodia verificada.
          </h1>
          <p className={styles.description}>
            Elimina megáfonos, desordena aglomeraciones en portería y protege la
            identidad física de los menores con arquitectura de privacidad en 3
            capas y código de traspaso seguro.
          </p>

          <div className={styles.ctaGroup}>
            <Link href="/admin/simulador" className={styles.primaryCta}>
              <span>🎮</span>
              <span>Probar Simulador Interactivo (CA-5)</span>
            </Link>
            <Link href="/retirar?session=SAN-1024" className={styles.secondaryCta}>
              <span>📱</span>
              <span>Flujo Picker Móvil (Sin app)</span>
            </Link>
          </div>

          <div className={styles.bannerWrapper}>
            <Image
              src="/banner.png"
              alt="PickMe - Sistema de Salida Escolar Inteligente"
              width={1672}
              height={941}
              priority
              className={styles.bannerImg}
            />
          </div>
        </section>

        <section className={styles.layersSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Puntos de Contacto del Ecosistema
            </h2>
            <p className={styles.sectionSubtitle}>
              Prueba individualmente cada interfaz diseñada para los 3 niveles
              de exposición de datos.
            </p>
          </div>

          <div className={styles.grid}>
            {/* Layer 0: Smart TV */}
            <div className={styles.card}>
              <div className={styles.cardTop}>
                <span className={`${styles.cardBadge} ${styles.badgeLayer0}`}>
                  Capa 0 · Público Pasivo
                </span>
                <h3 className={styles.cardTitle}>Smart TV Patio</h3>
                <p className={styles.cardDesc}>
                  Pantalla 1080p sin datos personales. Combina animal + color para
                  llamar a los alumnos cuando su apoderado llega al portón.
                </p>
              </div>
              <Link href="/board/SAN-1024" className={styles.cardAction}>
                Abrir Board TV (SAN-1024) →
              </Link>
            </div>

            {/* Layer 1: Picker Móvil */}
            <div className={styles.card}>
              <div className={styles.cardTop}>
                <span className={`${styles.cardBadge} ${styles.badgeLayer1}`}>
                  Capa 1 · Picker Móvil
                </span>
                <h3 className={styles.cardTitle}>Retiro Web Móvil</h3>
                <p className={styles.cardDesc}>
                  Acceso directo mediante escaneo de QR en portón o link de
                  WhatsApp. Cero descargas en App Store.
                </p>
              </div>
              <Link
                href="/retirar?session=SAN-1024"
                className={styles.cardAction}
              >
                Simular Picker en Portón →
              </Link>
            </div>

            {/* Layer 1: Staff Portón */}
            <div className={styles.card}>
              <div className={styles.cardTop}>
                <span className={`${styles.cardBadge} ${styles.badgeLayer1}`}>
                  Capa 1 · Staff Colegio
                </span>
                <h3 className={styles.cardTitle}>Portal Portón (Staff)</h3>
                <p className={styles.cardDesc}>
                  Cola viva con teclado numérico touch optimizado de 64px para
                  validar el Handover Code de 6 dígitos al entregar al menor.
                </p>
              </div>
              <Link href="/staff" className={styles.cardAction}>
                Abrir Panel Staff →
              </Link>
            </div>

            {/* Layer 2: Admin Dashboard */}
            <div className={styles.card}>
              <div className={styles.cardTop}>
                <span className={`${styles.cardBadge} ${styles.badgeLayer2}`}>
                  Capa 2 · Administrativo
                </span>
                <h3 className={styles.cardTitle}>Panel de Control</h3>
                <p className={styles.cardDesc}>
                  Métricas en tiempo real, auditoría forense con hashes SHA-256 e
                  inicio de sesión Google OAuth protegido.
                </p>
              </div>
              <Link href="/admin" className={styles.cardAction}>
                Ver Dashboard Admin →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>
          PickMe · Caso de Estudio UX para Certificación Frontend/UX · Next.js
          App Router & PostgreSQL
        </p>
      </footer>
    </div>
  )
}
