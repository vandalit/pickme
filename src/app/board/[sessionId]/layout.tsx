import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PickMe — Smart Board TV (Layer 0)',
  description: 'Pantalla pública pasiva de entrega escolar con identificadores anónimos',
  robots: {
    index: false,
    follow: false,
  },
};

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

