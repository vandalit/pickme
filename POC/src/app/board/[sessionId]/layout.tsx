import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PickMe — Tablero de Retiro',
  description: 'Tablero en tiempo real para el retiro seguro de alumnos. Solo muestra avatares anónimos.',
  robots: { index: false, follow: false },
};

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'fixed',
      inset: 0,
    }}>
      {children}
    </div>
  );
}
