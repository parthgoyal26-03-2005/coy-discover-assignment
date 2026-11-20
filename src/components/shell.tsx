'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Compass, Home, RotateCcw, Heart, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { Dialog } from './ui/dialog';
import { api } from '@/lib/api';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function reset() {
    setBusy(true);
    setError('');
    try {
      await api('/api/demo/reset', {});
      if (pathname === '/discover') window.location.reload();
      else {
        router.push('/discover');
        setResetOpen(false);
        setBusy(false);
      }
    } catch (error) {
      setError((error as Error).message);
      setBusy(false);
    }
  }
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <Link href="/discover" className="wordmark" aria-label="Coy Discover">
          <Image
            src="/brand/coy-wordmark.svg"
            width={76}
            height={28}
            alt=""
            loading="eager"
          />
        </Link>
        <span className="header-note">Discover</span>
        <div className="header-tools">
          <span className="demo-label">Demo · 18+</span>
          <button
            className="icon-button"
            aria-label="Reset demo"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw size={19} />
          </button>
        </div>
      </header>
      {children}
      <nav className="tab-bar" aria-label="Main navigation">
        <Link
          href="/home"
          className={pathname === '/home' ? 'active' : ''}
          aria-current={pathname === '/home' ? 'page' : undefined}
        >
          <Home size={20} />
          Home
        </Link>
        <Link
          href="/discover"
          className={pathname.startsWith('/discover') ? 'active' : ''}
          aria-current={pathname === '/discover' ? 'page' : undefined}
        >
          <Compass size={21} />
          Discover
        </Link>
      </nav>
      <Dialog
        open={resetOpen}
        onClose={() => {
          if (!busy) setResetOpen(false);
        }}
        title="A fresh start?"
        description="Clear your swipes and matches to explore all 36 profiles again. This only resets your browser’s demo."
      >
        <div className="dialog-symbol lavender">
          <RotateCcw size={32} />
        </div>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={busy} onClick={reset}>
          {busy ? <LoaderCircle className="spin" size={18} /> : null}Reset my
          demo
        </button>
        <button
          className="button quiet full"
          disabled={busy}
          onClick={() => setResetOpen(false)}
        >
          Keep my progress
        </button>
      </Dialog>
      <footer className="site-footer">
        <Heart size={14} /> Likes stay private. Matches are mutual.{' '}
        <span>Fictional profiles · 18+</span>
      </footer>
    </>
  );
}
