import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Ambient blobs */}
      <div className={styles.ambient} aria-hidden="true">
        <div className={styles.blob} />
        <div className={styles.blob} />
        <div className={styles.blob} />
      </div>

      <main className={styles.main}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoIcon} aria-hidden="true">🎯</span>
          <h1 className={styles.logoText}>
            Pick<span className={styles.logoAccent}>Me</span>
          </h1>
        </div>

        <p className={styles.tagline}>
          Retiro escolar seguro y anónimo
        </p>

        <p className={styles.description}>
          Sistema de gestión de retiro para escuelas.<br />
          Los alumnos se identifican con avatares — nunca con nombres ni fotos.
        </p>

        {/* CTA principal: ver el board de demo */}
        <div className={styles.actions}>
          <Link href="/board/session-demo-001" className={styles.btnPrimary}>
            <span aria-hidden="true">📺</span>
            Ver tablero de demostración
          </Link>
        </div>

        {/* Roles */}
        <div className={styles.roles}>
          <div className={styles.roleCard}>
            <span className={styles.roleIcon}>👨‍👩‍👧</span>
            <span className={styles.roleLabel}>Apoderado</span>
            <span className={styles.roleDesc}>Autoriza y recibe confirmación</span>
          </div>
          <div className={styles.roleCard}>
            <span className={styles.roleIcon}>🚗</span>
            <span className={styles.roleLabel}>Picker</span>
            <span className={styles.roleDesc}>Escanea QR y retira al alumno</span>
          </div>
          <div className={styles.roleCard}>
            <span className={styles.roleIcon}>🏫</span>
            <span className={styles.roleLabel}>Staff escolar</span>
            <span className={styles.roleDesc}>Supervisa el proceso en tiempo real</span>
          </div>
        </div>

        <p className={styles.version}>MVP v0.1 · En desarrollo</p>
      </main>
    </div>
  );
}
