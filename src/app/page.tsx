import Link from "next/link"
import Image from "next/image"
import styles from "./page.module.css"

export default function HomePage() {
  return (
    <div className={styles.container}>
      {/* ── NAVBAR ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="PickMe Home">
            <svg
              className={styles.brandIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span>
              Pick<span className={styles.brandDot}>Me</span>
            </span>
          </Link>

          <nav className={styles.navActions}>
            <Link href="/board/SAN-1024" className={styles.navLink}>
              Board TV
            </Link>
            <Link href="/staff" className={styles.navLink}>
              Portón Staff
            </Link>
            <Link href="/auth/login" className={styles.loginButton}>
              <span>Acceso Colegio</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ── HERO CON COMPOSICIÓN 2/3 Y FUNDIDO GRADUAL COSMIC DARK ── */}
        <section className={styles.hero}>
          <div className={styles.heroBannerWrapper}>
            <Image
              src="/banner.png"
              alt="PickMe Banner Ecosistema Escolar"
              fill
              priority
              sizes="100vw"
              className={styles.heroImage}
            />
          </div>

          {/* Gradiente direccional orquestado: protege el Navbar arriba, abre la ilustración al medio y funde a Cosmic Dark abajo */}
          <div className={styles.heroGradientOverlay} />

          <div className={styles.heroContent}>
            <div className={styles.heroPill}>
              <span className={styles.pillDot} />
              <span>Caso de Estudio UX & MVP Productivo</span>
            </div>

            <h1 className={styles.title}>
              Salida escolar digital con{" "}
              <span className={styles.titleGradient}>anonimato público</span> y
              custodia verificada.
            </h1>

            <p className={styles.subtitle}>
              Elimina megáfonos, reduce aglomeraciones en portería y protege la
              identidad física de los menores mediante arquitectura de privacidad
              en 3 capas y código de traspaso seguro.
            </p>

            <div className={styles.heroCtas}>
              <Link href="/admin/simulador" className={styles.ctaPrimary}>
                <span>Iniciar Simulador Interactivo</span>
                <svg
                  className={styles.ctaIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── PUNTOS DE CONTACTO (TOUCHPOINTS) ── */}
        <section className={styles.touchpointsSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionPretitle}>
              Arquitectura de Servicio Multi-Dispositivo
            </span>
            <h2 className={styles.sectionTitle}>
              Puntos de Contacto del Ecosistema
            </h2>
            <p className={styles.sectionDescription}>
              En diseño de servicios y UX, los puntos de contacto son las interfaces
              tangibles donde cada actor interactúa con el sistema. PickMe
              desacopla la información en 3 niveles de exposición de datos según
              la distancia física y el rol del usuario.
            </p>
          </div>

          <div className={styles.grid}>
            {/* 1. Board / TV Patio (Capa 0) */}
            <article className={styles.card}>
              <div
                className={`${styles.cardVisual} ${styles.visualLayer0}`}
                aria-hidden="true"
              >
                <svg
                  className={styles.cardVisualIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <circle cx="8" cy="10" r="2" />
                  <circle cx="16" cy="10" r="2" />
                </svg>
              </div>

              <div className={styles.cardBody}>
                <span
                  className={`${styles.cardLayerBadge} ${styles.badgeLayer0}`}
                >
                  Capa 0 · Público Pasivo
                </span>
                <h3 className={styles.cardTitle}>Smart TV Patio</h3>
                <p className={styles.cardDescription}>
                  Diario mural pasivo de 1080p con anonimato total. Proyecta
                  únicamente el animal y color del alumno cuando el apoderado se
                  anuncia en portería.
                </p>
                <Link
                  href="/board/SAN-1024"
                  className={styles.cardButton}
                >
                  <span>Explorar Board TV</span>
                  <svg
                    className={styles.cardButtonArrow}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>

            {/* 2. Mobile / Picker (Capa 1) */}
            <article className={styles.card}>
              <div
                className={`${styles.cardVisual} ${styles.visualLayer1Picker}`}
                aria-hidden="true"
              >
                <svg
                  className={styles.cardVisualIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                  <path d="M9 7h6M9 11h6" />
                </svg>
              </div>

              <div className={styles.cardBody}>
                <span
                  className={`${styles.cardLayerBadge} ${styles.badgeLayer1Picker}`}
                >
                  Capa 1 · Picker en Portón
                </span>
                <h3 className={styles.cardTitle}>Picker Web Móvil</h3>
                <p className={styles.cardDescription}>
                  Flujo web instantáneo sin descarga de aplicaciones. El
                  retirador escanea el QR en portón, confirma el alumno y recibe
                  el Handover Code de 6 dígitos.
                </p>
                <Link
                  href="/retirar?session=SAN-1024"
                  className={styles.cardButton}
                >
                  <span>Simular Picker Móvil</span>
                  <svg
                    className={styles.cardButtonArrow}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>

            {/* 3. Staff / Portón (Capa 1) */}
            <article className={styles.card}>
              <div
                className={`${styles.cardVisual} ${styles.visualLayer1Staff}`}
                aria-hidden="true"
              >
                <svg
                  className={styles.cardVisualIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <line x1="8" y1="7" x2="16" y2="7" />
                  <line x1="8" y1="11" x2="16" y2="11" />
                  <line x1="8" y1="15" x2="12" y2="15" />
                  <path d="M14 15l2 2 4-4" />
                </svg>
              </div>

              <div className={styles.cardBody}>
                <span
                  className={`${styles.cardLayerBadge} ${styles.badgeLayer1Staff}`}
                >
                  Capa 1 · Personal Escolar
                </span>
                <h3 className={styles.cardTitle}>Tablet Portón (Staff)</h3>
                <p className={styles.cardDescription}>
                  Consola de alta respuesta para el auxiliar en portón. Monitorea
                  la cola en tiempo real y valida el traspaso físico con un
                  teclado numérico táctil de 64px.
                </p>
                <Link
                  href="/staff"
                  className={styles.cardButton}
                >
                  <span>Abrir Portal Staff</span>
                  <svg
                    className={styles.cardButtonArrow}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>

            {/* 4. Dashboard / Admin (Capa 2) */}
            <article className={styles.card}>
              <div
                className={`${styles.cardVisual} ${styles.visualLayer2Admin}`}
                aria-hidden="true"
              >
                <svg
                  className={styles.cardVisualIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                  <path d="M13 14h4" />
                </svg>
              </div>

              <div className={styles.cardBody}>
                <span
                  className={`${styles.cardLayerBadge} ${styles.badgeLayer2Admin}`}
                >
                  Capa 2 · Administración
                </span>
                <h3 className={styles.cardTitle}>Panel de Control</h3>
                <p className={styles.cardDescription}>
                  Vista ejecutiva para la dirección del colegio. Métricas en vivo,
                  gestión de autorizaciones permanentes y auditoría forense con
                  registro inmutable de custodia.
                </p>
                <Link
                  href="/admin"
                  className={styles.cardButton}
                >
                  <span>Ver Panel Admin</span>
                  <svg
                    className={styles.cardButtonArrow}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>
            PickMe · Sistema Digital de Salida Escolar con Cadena de Custodia
          </p>
          <p>
            Caso de Estudio UX & Portafolio de Certificación Frontend / UX · Next.js
            App Router, React 19 & PostgreSQL
          </p>
        </div>
      </footer>
    </div>
  )
}
