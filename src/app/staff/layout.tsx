import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'PickMe — Portal Operativo de Portón (Staff)',
  description: 'Control de entrega física y validación de custodia en portón escolar',
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

