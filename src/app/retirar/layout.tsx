import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'PickMe — Retiro Escolar Móvil',
  description: 'Anuncio de llegada y código de traspaso físico para retiro de alumnos',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RetirarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
