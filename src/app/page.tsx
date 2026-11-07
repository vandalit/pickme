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
            <Link href="/board" className={styles.navLink}>
              Patio TV
            </Link>
            <Link href="/staff" className={styles.navLink}>
              Portón Staff
            </Link>
            <Link href="/retirar" className={styles.navLink}>
              Retiro Móvil
            </Link>
            <Link href="/admin/simulador" className={styles.navLink}>
              Simulador
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
              Sin llamadas de nombre, sin filas en la puerta. Cada alumno tiene un{" "}
              <strong>avatar anónimo</strong> propio que solo su familia reconoce
              — el sistema coordina la entrega de forma segura y silenciosa.
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

        {/* ── PROPUESTA CONCEPTUAL (CÓMO FUNCIONA PARA EL APODERADO) ── */}
        <section className={styles.conceptSection}>
          <div className={styles.conceptInner}>
            <div className={styles.conceptHeader}>
              <span className={styles.conceptPretitle}>Para el apoderado</span>
              <h2 className={styles.conceptTitle}>
                Sin descargar nada.{" "}
                <span className={styles.conceptTitleAccent}>
                  Llega, escanea, listo.
                </span>
              </h2>
              <p className={styles.conceptLead}>
                PickMe funciona desde la cámara de cualquier celular. Cuando llegas
                al colegio, apuntas al QR en el portón, el sistema reconoce tu
                autorización, genera un código de 6 dígitos y tú se lo muestras
                al auxiliar. En segundos, la entrega queda registrada y recibes
                confirmación. Sin fila, sin llamadas, sin instalar ninguna aplicación.
              </p>
            </div>

            <ul className={styles.conceptList}>
              <li className={styles.conceptItem}>
                <span className={styles.conceptItemIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a7 7 0 0 1 7 7c0 4.5-7 13-7 13S5 13.5 5 9a7 7 0 0 1 7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </span>
                <span>
                  <strong>Sin descargar ninguna aplicación</strong> — funciona
                  directo desde el navegador del celular.
                </span>
              </li>
              <li className={styles.conceptItem}>
                <span className={styles.conceptItemIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h1M17 14v3h-3v-1" />
                  </svg>
                </span>
                <span>
                  <strong>Un QR en el portón</strong> — escaneas con la cámara
                  del celular, como leer un menú de restaurante.
                </span>
              </li>
              <li className={styles.conceptItem}>
                <span className={styles.conceptItemIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    <path d="M15 13l2 2 4-4" />
                  </svg>
                </span>
                <span>
                  <strong>Tu hijo aparece con su avatar anónimo</strong> — solo
                  tú lo reconoces, el patio no ve nombres ni fotos.
                </span>
              </li>
              <li className={styles.conceptItem}>
                <span className={styles.conceptItemIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <path d="M9 10h6M9 14h3" />
                  </svg>
                </span>
                <span>
                  <strong>Código de 6 dígitos</strong> — lo dices al auxiliar
                  en portón, quien confirma la identidad en su tablet.
                </span>
              </li>
              <li className={styles.conceptItem}>
                <span className={styles.conceptItemIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <span>
                  <strong>Confirmación automática por WhatsApp</strong> — el
                  apoderado principal recibe aviso instantáneo de la entrega.
                </span>
              </li>
              <li className={styles.conceptItem}>
                <span className={styles.conceptItemIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </span>
                <span>
                  <strong>Registro inmutable de cada retiro</strong> — la
                  dirección accede al historial completo con hora y persona autorizada.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── PUNTOS DE CONTACTO (TOUCHPOINTS) ── */}
        <section className={styles.touchpointsSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionPretitle}>
              Cómo funciona el sistema
            </span>
            <h2 className={styles.sectionTitle}>
              Cuatro pantallas, un flujo coordinado
            </h2>
            <p className={styles.sectionDescription}>
              Cada momento de la salida escolar ocurre en un dispositivo diferente.
              Pantalla en el patio, celular del retirador, tablet del auxiliar y
              consola de la dirección trabajan juntos — sin que nadie vea más
              información de la necesaria.
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
                  Pantalla Pública · Patio
                </span>
                <h3 className={styles.cardTitle}>Smart TV Patio</h3>
                <p className={styles.cardDescription}>
                  Gran pantalla en el patio que muestra el <strong>avatar anónimo</strong> de
                  cada alumno cuyo retirador ya está en camino. Sin nombres, sin fotos
                  — solo el personaje que la familia reconoce.
                </p>
                <Link
                  href="/board"
                  className={styles.cardButton}
                >
                  <span>Sintonizar TV Patio</span>
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
                  Retirador · Sin App
                </span>
                <h3 className={styles.cardTitle}>Celular del Retirador</h3>
                <p className={styles.cardDescription}>
                  Sin instalar nada. El apoderado o transportista escanea el QR
                  en la puerta con su cámara, confirma el alumno y recibe un{" "}
                  <strong>código de verificación</strong> de 6 dígitos que entrega
                  al auxiliar.
                </p>
                <Link
                  href="/retirar"
                  className={styles.cardButton}
                >
                  <span>Ir a Retiro Móvil</span>
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
                  Auxiliar · Portón
                </span>
                <h3 className={styles.cardTitle}>Consola del Auxiliar</h3>
                <p className={styles.cardDescription}>
                  El auxiliar de portería ve en su tablet quién viene a buscar a
                  quién, recibe el código del retirador y lo ingresa para confirmar
                  la entrega. Todo queda registrado.
                </p>
                <Link
                  href="/staff"
                  className={styles.cardButton}
                >
                  <span>Abrir Tablet Portón</span>
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
                  Dirección · Visión Total
                </span>
                <h3 className={styles.cardTitle}>Panel de la Dirección</h3>
                <p className={styles.cardDescription}>
                  La directora ve en tiempo real quién ha sido retirado, por quién
                  y cuándo. Puede consultar el historial completo de cada salida y
                  gestionar quién está autorizado para retirar a cada alumno.
                </p>
                <Link
                  href="/auth/login"
                  className={styles.cardButton}
                >
                  <span>Acceso Dirección</span>
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
