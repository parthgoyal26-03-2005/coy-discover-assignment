import type { Metadata } from 'next';
import '@fontsource/bricolage-grotesque/latin-700.css';
import '@fontsource/bricolage-grotesque/latin-600.css';
import '@fontsource/bricolage-grotesque/latin-400.css';
import '@fontsource/bricolage-grotesque/latin-500.css';
import '@fontsource/bricolage-grotesque/latin-800.css';
import './globals.css';
import { Shell } from '@/components/shell';
export const metadata: Metadata = {
  icons: {
    icon: '/brand/coy-icon.svg',
    apple: '/brand/coy-apple-touch-icon.png',
  },
  title: 'Coy Discover — meet someone new',
  description:
    'Meet someone new. A privacy-first discovery demo: your likes stay private until the feeling is mutual.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
