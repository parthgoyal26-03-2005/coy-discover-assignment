'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Heart, MapPin, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Match, Profile } from '@/lib/types';
import { Dialog } from '../ui/dialog';
export function MatchesView() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  function load() {
    return api<{ matches: Match[] }>('/matches')
      .then(data => setMatches(data.matches))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { void load(); }, []);
  function retry() { setLoading(true); setError(''); void load(); }
  return <main id="main-content" className="matches-page"><Link href="/discover" className="back-link"><ChevronLeft size={18} />Back to Discover</Link>
    <div className="matches-heading"><span className="eyebrow"><Heart size={15} /> Mutual connections</span><h1>Your matches<span className="pink-dot">.</span></h1><p>You liked each other. Find your connections here.</p></div>
    {error && <div className="error-banner" role="alert"><p>{error}</p><button onClick={retry}>Try again</button></div>}
    {loading ? <div className="matches-grid" role="status" aria-label="Loading matches"><div className="match-skeleton" /><div className="match-skeleton" /></div> : matches.length ? <div className="matches-grid">{matches.map((match, index) => <button key={match.id} className="match-card" onClick={() => setSelected(match.profile)} aria-label={`View ${match.profile.name}'s profile`}><div className="match-card-photo"><Image src={match.profile.photoUrl} alt={`Illustrated portrait of ${match.profile.name}`} fill loading={index < 3 ? 'eager' : 'lazy'} sizes="(max-width: 600px) 44vw, 280px" /><span><Heart size={14} fill="currentColor" /></span></div><div className="match-card-info"><h2>{match.profile.name}, {match.profile.age}</h2><p><MapPin size={13} />{match.profile.city}</p><small>Matched {new Date(match.matchedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small></div></button>)}</div> : !error ? <div className="empty-card matches-empty"><div className="empty-symbol"><Heart size={36} /></div><h2>No matches yet.<br />Keep discovering!</h2><p>A match appears here when you both like each other.</p><Link href="/discover" className="button primary">Explore Discover</Link></div> : null}
    <p className="under-card-privacy"><LockKeyhole size={14} />Only mutual matches. Always.</p>
    <Dialog open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.name}, ${selected.age}` : 'Profile'} description={selected?.city ?? ''} className="profile-dialog">{selected && <><Image src={selected.photoUrl} alt={`Illustrated portrait of ${selected.name}`} width={340} height={300} className="detail-photo" /><p>{selected.bio}</p><div className="interests">{selected.interests.map(interest => <span key={interest}>{interest}</span>)}</div><p className="mutual-label"><Heart size={14} fill="currentColor" />You both liked each other.</p></>}</Dialog>
  </main>;
}
