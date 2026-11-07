import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PickMe — Administración Escolar',
  description: 'Panel de supervisión, nómina de alumnos y auditoría de custodia escolar',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

