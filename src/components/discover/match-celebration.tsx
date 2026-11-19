'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Dialog } from '../ui/dialog';
import type { Profile } from '@/lib/types';
export function MatchCelebration({ profile, onClose }: { profile: Profile | null; onClose: () => void }) {
  return <Dialog open={!!profile} onClose={onClose} title="It’s a match!" description={`You and ${profile?.name ?? 'someone new'} liked each other.`} className="celebration">
    {profile && <><div className="match-art"><div className="match-photo"><Image src={profile.photoUrl} alt={`Illustrated portrait of ${profile.name}`} width={156} height={180} /></div><span className="match-heart"><Heart fill="currentColor" size={32} /></span></div>
      <p className="mutual-label"><Heart size={14} fill="currentColor" />The feeling is mutual.</p>
      <Link href="/discover/matches" className="button primary full">View Matches</Link>
      <button className="button quiet full" onClick={onClose}>Keep Discovering</button></>}
  </Dialog>;
}
