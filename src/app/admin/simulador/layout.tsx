import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PickMe — Sandbox Simulator (CA-5)',
  description: 'Simulador interactivo en pantalla dividida para validación de arquitectura y custodia escolar',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SimulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

