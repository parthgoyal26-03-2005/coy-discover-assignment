'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Home, RotateCcw, Heart, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { Dialog } from './ui/dialog';
import { api } from '@/lib/api';
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function reset() {
    setBusy(true); setError('');
    try { await api('/api/demo/reset', {}); window.location.assign('/discover'); }
    catch (e) { setError((e as Error).message); setBusy(false); }
  }
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header"><Link href="/discover" className="wordmark" aria-label="Coy Discover">coy<span>●</span></Link>
      <span className="header-note">A little curiosity. A real connection.</span>
      <div className="header-tools"><span className="demo-label">The Discover demo</span><button className="icon-button" aria-label="Reset demo" onClick={() => setResetOpen(true)}><RotateCcw size={19} /></button></div>
    </header>
    {children}
    <nav className="tab-bar" aria-label="Main navigation">
      <Link href="/home" className={path === '/home' ? 'active' : ''} aria-current={path === '/home' ? 'page' : undefined}><Home size={20} />Home</Link>
      <Link href="/discover" className={path.startsWith('/discover') ? 'active' : ''} aria-current={path === '/discover' ? 'page' : undefined}><Compass size={21} />Discover</Link>
    </nav>
    <Dialog open={resetOpen} onClose={() => { if (!busy) setResetOpen(false); }} title="A fresh start?" description="Clear your swipes and matches to explore all 36 profiles again. This only resets your browser’s demo.">
      <div className="dialog-symbol lavender"><RotateCcw size={32} /></div>
      {error && <p role="alert" className="error-text">{error}</p>}
      <button className="button primary full" disabled={busy} onClick={reset}>{busy ? <LoaderCircle className="spin" size={18} /> : null}Reset my demo</button>
      <button className="button quiet full" disabled={busy} onClick={() => setResetOpen(false)}>Keep my progress</button>
    </Dialog>
    <footer className="site-footer"><Heart size={13} /> Made for mutual feelings. <span>Fictional people. Real privacy.</span></footer>
  </>;
}
