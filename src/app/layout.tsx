import type { Metadata } from 'next';
import '@fontsource/bricolage-grotesque/latin-700.css';
import '@fontsource/bricolage-grotesque/latin-600.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import './globals.css';
import { Shell } from '@/components/shell';
export const metadata: Metadata = { title: 'Coy Discover — a little curiosity goes a long way', description: 'Meet someone new. A privacy-first discovery demo: your likes stay private until the feeling is mutual.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Shell>{children}</Shell></body></html>;
}
