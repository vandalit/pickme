import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PickMe — Retiro Escolar Seguro',
  description: 'Sistema de gestión de salida escolar con cadena de custodia digital',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
