'use client';
import Link from 'next/link';
import { Heart, X, LockKeyhole, Sparkles, LoaderCircle, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import type { Direction, Match, Profile } from '@/lib/types';
import { api } from '@/lib/api';
import { Intro } from './intro';
import { ProfileCard } from './profile-card';
import { MatchCelebration } from './match-celebration';

export function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [matched, setMatched] = useState<Profile | null>(null);
  const [lastDirection, setLastDirection] = useState<Direction>('like');
  const inFlight = useRef(false);
  const current = profiles[0];
  const load = useCallback(() => api<{ profiles: Profile[] }>('/feed')
    .then(async data => {
      // Establish the browser cookie before a second session-dependent request.
      const matches = await api<{ matches: Match[] }>('/matches');
      setProfiles(data.profiles); setMatchCount(matches.matches.length);
    })
    .catch((e: Error) => setError(e.message))
    .finally(() => setLoading(false)), []);
  useEffect(() => { void load(); }, [load]);
  function retry() { setLoading(true); setError(''); void load(); }
  const submit = useCallback(async (direction: Direction): Promise<boolean> => {
    if (inFlight.current || !current || matched) return false;
    inFlight.current = true; setBusy(true); setError(''); setLastDirection(direction);
    try {
      const data = await api<{ success: boolean; isMatch: boolean; profile?: Profile }>('/swipe', { profileId: current.id, direction });
      setProfiles(previous => previous.filter(profile => profile.id !== current.id));
      if (data.isMatch && data.profile) { setMatched(data.profile); setMatchCount(count => count + 1); }
      return true;
    } catch (e) { setError((e as Error).message); return false; }
    finally { inFlight.current = false; setBusy(false); }
  }, [current, matched]);
  useEffect(() => {
    function keydown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || target.closest('button,a,input,textarea,[role="dialog"]') || document.querySelector('[role="dialog"]')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); void submit(e.key === 'ArrowRight' ? 'like' : 'pass'); }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [submit]);
  async function reset() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { await api('/api/demo/reset', {}); setLoading(true); await load(); }
    catch (e) { setError((e as Error).message); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <main id="main-content" className="discover-layout">
    <Intro />
    <section className="discovery-stage" aria-label="Discover profiles"><div className="stage-header"><div><p className="eyebrow mobile-eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</p><h2>Discover<span className="pink-dot">.</span></h2><p>Meet someone new.</p></div><Link className="matches-link" href="/discover/matches"><Heart size={17} />Matches{matchCount > 0 && <span>{matchCount}</span>}</Link></div>
      {error && <div className="error-banner" role="alert"><p>{error}</p>{!current && <button onClick={retry}>Try again</button>}</div>}
      {loading ? <div className="profile-skeleton" role="status" aria-label="Loading profiles"><div /><span /><span /><span /></div> : current ? <>
        <div className="card-stack"><div className="stack-back" aria-hidden /><AnimatePresence mode="wait"><ProfileCard key={current.id} profile={current} busy={busy} onSwipe={submit} exitDirection={lastDirection} /></AnimatePresence></div>
        <div className="swipe-actions"><button className="swipe-button pass-button" onClick={() => void submit('pass')} disabled={busy} aria-label="Pass"><X size={29} strokeWidth={2} /><span>Pass</span></button>
          <span className="swipe-hint">Trust your little hunch.</span><button className="swipe-button like-button" onClick={() => void submit('like')} disabled={busy} aria-label="Like">{busy ? <LoaderCircle className="spin" size={27} /> : <Heart size={27} fill="currentColor" />}<span>Like</span></button></div>
        <p className="keyboard-hint">Swipe a little. Or use <kbd>←</kbd> <kbd>→</kbd></p>
      </> : !error ? <div className="empty-card"><div className="empty-symbol"><Sparkles size={38} /></div><h2>You’ve seen everyone for now.</h2><p>Good things take a little time. Your connections are waiting in Matches.</p><Link href="/discover/matches" className="button primary full">View Matches</Link><button className="button secondary full" onClick={reset} disabled={busy}><RotateCcw size={17} />Replay the demo</button></div> : null}
      <p className="under-card-privacy"><LockKeyhole size={13} />Your likes stay private. Until it’s mutual.</p>
      <span className="sr-only" role="status" aria-live="polite">{!loading && current ? `Now showing ${current.name}, ${current.age}, ${current.city}` : ''}</span>
    </section>
    <MatchCelebration profile={matched} onClose={() => setMatched(null)} />
  </main>;
}
