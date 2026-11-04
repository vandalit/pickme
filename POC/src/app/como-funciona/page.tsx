import Link from 'next/link';
import styles from '../page.module.css';

export default function ComoFuncionaPage() {
  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <div className={styles.brand}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className={styles.brandIcon} aria-hidden="true">🎯</span>
            <span className={styles.brandName}>Pick<span className={styles.brandAccent}>Me</span></span>
          </Link>
          <span className={styles.clientTag}>Para Escuelas y Colegios</span>
        </div>

        <nav className={styles.navTabs}>
          <Link href="/" className={styles.navTab} style={{ textDecoration: 'none' }}>
            Inicio
          </Link>
          <span className={`${styles.navTab} ${styles.navTabActive}`}>
            ¿Cómo Funciona?
          </span>
        </nav>

        <div className={styles.navAction}>
          <Link href="/board/session-demo-001" className={styles.btnLaunchBoard}>
            <span>📺</span> Ver Smart TV Board
          </Link>
        </div>
      </header>

      <main className={styles.mainContainer}>
        <section className={styles.sectionFade}>
          <div className={styles.tabHeader}>
            <span className={styles.badgePill}>Arquitectura de Custodia en 4 Pasos</span>
            <h1 className={styles.tabTitle}>Así opera una salida escolar con PickMe</h1>
            <p className={styles.tabDescription}>
              Diseñado para coordinadores y maestras: sin fricción técnica, con respaldo legal y protección total de datos de menores.
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
      </main>

      <footer className={styles.footer}>
        <p>PickMe MVP v0.1 · Plataforma de gestión y custodia de salida escolar para colegios y familias.</p>
      </footer>
    </div>
  );
}

