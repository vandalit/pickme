'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

type TabType = 'overview' | 'how_it_works' | 'schools';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  return (
    <div className={styles.page}>
      {/* Ambient background glows */}
      <div className={styles.ambient} aria-hidden="true">
        <div className={styles.blob} />
        <div className={styles.blob} />
        <div className={styles.blob} />
      </div>

      {/* Top Navbar */}
      <header className={styles.navbar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true">🎯</span>
          <span className={styles.brandName}>Pick<span className={styles.brandAccent}>Me</span></span>
          <span className={styles.clientTag}>Para Escuelas y Colegios</span>
        </div>

        {/* Navigation Tabs */}
        <nav className={styles.navTabs} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`${styles.navTab} ${activeTab === 'overview' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Inicio
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'how_it_works'}
            className={`${styles.navTab} ${activeTab === 'how_it_works' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('how_it_works')}
          >
            ¿Cómo Funciona?
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'schools'}
            className={`${styles.navTab} ${activeTab === 'schools' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('schools')}
          >
            Beneficios para el Colegio
          </button>
        </nav>

        <div className={styles.navAction}>
          <Link href="/board/session-demo-001" className={styles.btnLaunchBoard}>
            <span>📺</span> Ver Smart TV Board
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContainer}>
        {/* TAB 1: VISIÓN GENERAL */}
        {activeTab === 'overview' && (
          <section className={styles.sectionFade}>
            <div className={styles.heroText}>
              <span className={styles.badgePill}>Solución B2B para Instituciones Educativas</span>
              <h1 className={styles.heroTitle}>
                Retiro escolar seguro, trazable y <span className={styles.textHighlight}>100% anónimo</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Elimina las autorizaciones en papel y el caos en el portón escolar.
                Una experiencia donde los padres <strong>no instalan ninguna app</strong>: todo funciona a través de WhatsApp y enlaces web livianos.
              </p>
            </div>

            <div className={styles.heroActions}>
              <Link href="/board/session-demo-001" className={styles.btnPrimary}>
                <span>📺</span> Probar Tablero de Salida (Smart TV)
              </Link>
              <button 
                onClick={() => setActiveTab('how_it_works')} 
                className={styles.btnSecondary}
              >
                Ver cómo funciona el flujo ➔
              </button>
            </div>

            {/* Metric cards */}
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <span className={styles.kpiValue}>0 apps</span>
                <span className={styles.kpiLabel}>Cero descargas para apoderados o choferes</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiValue}>100%</span>
                <span className={styles.kpiLabel}>Anonimato público (avatares animal + color)</span>
              </div>
              <div className={styles.kpiCard}>
                <span className={styles.kpiValue}>4 etapas</span>
                <span className={styles.kpiLabel}>Cadena de custodia: Escuela ➔ Tránsito ➔ Hogar</span>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: CÓMO FUNCIONA (EL FLUJO DE SALIDA) */}
        {activeTab === 'how_it_works' && (
          <section className={styles.sectionFade}>
            <div className={styles.tabHeader}>
              <span className={styles.badgePill}>Arquitectura de Custodia en 4 Pasos</span>
              <h2 className={styles.tabTitle}>Así opera una salida escolar con PickMe</h2>
              <p className={styles.tabDescription}>
                Diseñado para coordinadores y maestras: sin fricción técnica, con respaldo legal y protección total de datos.
              </p>
            </div>

            <div className={styles.stepsTimeline}>
              {/* Paso 1 */}
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepHead}>
                    <span className={styles.stepBadge}>En el Portón</span>
                    <h3 className={styles.stepTitle}>Tablero Anónimo en Smart TV (Capa 0)</h3>
                  </div>
                  <p className={styles.stepText}>
                    En horario de salida, la escuela despliega el tablero en una Smart TV. 
                    Cada alumno aparece con un avatar lúdico (ej. <em>Cocodrilo Amarillo</em>) y su curso. 
                    <strong> Jamás se proyectan fotos ni nombres de menores en la vía pública.</strong>
                  </p>
                </div>
              </div>

              {/* Paso 2 */}
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepHead}>
                    <span className={styles.stepBadge}>Llegada del Picker</span>
                    <h3 className={styles.stepTitle}>Escaneo de QR dinámico y validación</h3>
                  </div>
                  <p className={styles.stepText}>
                    El picker (padre, abuelo, nana o chofer) escanea el código QR que se actualiza cada 5 minutos. 
                    El sistema valida en milisegundos si la persona cuenta con autorización legal vigente otorgada por el apoderado.
                  </p>
                </div>
              </div>

              {/* Paso 3 */}
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepHead}>
                    <span className={styles.stepBadge}>En la Puerta</span>
                    <h3 className={styles.stepTitle}>Handover Code de 6 dígitos</h3>
                  </div>
                  <p className={styles.stepText}>
                    El picker recibe un código de seguridad único en su pantalla (ej: <code>K7-938</code>). 
                    La docente en la puerta ingresa el código en su tablet para confirmar la entrega física del menor.
                    En el Smart TV el alumno pasa automáticamente a estado <strong>Retirado</strong>.
                  </p>
                </div>
              </div>

              {/* Paso 4 */}
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>4</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepHead}>
                    <span className={styles.stepBadge}>En Tránsito al Hogar</span>
                    <h3 className={styles.stepTitle}>Enlace Mágico GPS y Confirmación vía WhatsApp</h3>
                  </div>
                  <p className={styles.stepText}>
                    El chofer o picker recibe un enlace web que activa la ubicación nativa del navegador (sin instalar apps). 
                    Al llegar a destino, el apoderado recibe un WhatsApp automático con un botón de 1 clic: 
                    <strong> &quot;Llegó bien ✓&quot;</strong>, cerrando de forma definitiva la responsabilidad legal de la escuela.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.centerCta}>
              <Link href="/board/session-demo-001" className={styles.btnPrimary}>
                <span>👉</span> Ver simulación en vivo del Tablero
              </Link>
            </div>
          </section>
        )}

        {/* TAB 3: BENEFICIOS PARA COLEGIOS */}
        {activeTab === 'schools' && (
          <section className={styles.sectionFade}>
            <div className={styles.tabHeader}>
              <span className={styles.badgePill}>Para Directores y Equipos Directivos</span>
              <h2 className={styles.tabTitle}>¿Por qué las escuelas eligen PickMe?</h2>
              <p className={styles.tabDescription}>
                Resolvemos el problema más estresante del día a día escolar sin añadir carga operativa al personal.
              </p>
            </div>

            <div className={styles.benefitsGrid}>
              <div className={styles.benefitCard}>
                <span className={styles.benefitIcon}>🛡️</span>
                <h3 className={styles.benefitTitle}>Blindaje Legal y Trazabilidad</h3>
                <p className={styles.benefitDesc}>
                  Cada entrega genera una bitácora inmutable con timestamp, nombre del docente que entregó, datos del picker y confirmación del apoderado.
                </p>
              </div>

              <div className={styles.benefitCard}>
                <span className={styles.benefitIcon}>📱</span>
                <h3 className={styles.benefitTitle}>Adopción Inmediata (Sin Rechazo)</h3>
                <p className={styles.benefitDesc}>
                  Los colegios fracasan implementando apps porque los padres no las bajan. PickMe funciona en el WhatsApp que los padres ya usan todos los días.
                </p>
              </div>

              <div className={styles.benefitCard}>
                <span className={styles.benefitIcon}>⏱️</span>
                <h3 className={styles.benefitTitle}>Salidas 50% Más Rápidas</h3>
                <p className={styles.benefitDesc}>
                  Se eliminan los llamados a viva voz con megáfono. Los alumnos ven en el patio cuándo los vienen a buscar y el flujo se vuelve ordenado y silencioso.
                </p>
              </div>

              <div className={styles.benefitCard}>
                <span className={styles.benefitIcon}>🚨</span>
                <h3 className={styles.benefitTitle}>Gestión de Incidentes al Instante</h3>
                <p className={styles.benefitDesc}>
                  Si llega alguien no autorizado, el sistema frena la entrega y alerta a la dirección en tiempo real, evitando situaciones de riesgo en la puerta.
                </p>
              </div>
            </div>

            <div className={styles.centerCta}>
              <Link href="/board/session-demo-001" className={styles.btnPrimary}>
                <span>📺</span> Explorar el Tablero en Vivo
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>PickMe MVP v0.1 · Plataforma de gestión y custodia de salida escolar para colegios y familias.</p>
      </footer>
    </div>
  );
}
