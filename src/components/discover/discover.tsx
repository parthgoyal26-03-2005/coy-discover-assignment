'use client';

import Link from 'next/link';
import {
  Heart,
  X,
  LockKeyhole,
  Sparkles,
  LoaderCircle,
  RotateCcw,
} from 'lucide-react';
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
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [lastDirection, setLastDirection] = useState<Direction>('like');
  // A ref blocks a second input immediately, before React renders the busy state.
  const inFlight = useRef(false);
  const currentProfile = profiles[0];
  const loadProfiles = useCallback(
    () =>
      api<{ profiles: Profile[] }>('/feed')
        .then(async (feedResponse) => {
          // The first response establishes the cookie before another session-dependent request.
          const matchesResponse = await api<{ matches: Match[] }>('/matches');
          setProfiles(feedResponse.profiles);
          setMatchCount(matchesResponse.matches.length);
        })
        .catch((error: Error) => setError(error.message))
        .finally(() => setLoading(false)),
    [],
  );
  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);
  function retryLoading() {
    setLoading(true);
    setError('');
    void loadProfiles();
  }
  const submitSwipe = useCallback(
    async (direction: Direction): Promise<boolean> => {
      if (inFlight.current || !currentProfile || matchedProfile) return false;
      inFlight.current = true;
      setBusy(true);
      setError('');
      setLastDirection(direction);
      try {
        const data = await api<{
          success: boolean;
          isMatch: boolean;
          profile?: Profile;
        }>('/swipe', { profileId: currentProfile.id, direction });
        setProfiles((previous) =>
          previous.filter((profile) => profile.id !== currentProfile.id),
        );
        if (data.isMatch && data.profile) {
          setMatchedProfile(data.profile);
          setMatchCount((count) => count + 1);
        }
        return true;
      } catch (error) {
        setError((error as Error).message);
        return false;
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [currentProfile, matchedProfile],
  );
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        target.closest('button,a,input,textarea,[role="dialog"]') ||
        document.querySelector('[role="dialog"]')
      )
        return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        void submitSwipe(event.key === 'ArrowRight' ? 'like' : 'pass');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitSwipe]);
  async function resetDemo() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await api('/api/demo/reset', {});
      setLoading(true);
      await loadProfiles();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <main id="main-content" className="discover-layout">
      <Intro />
      <section className="discovery-stage" aria-label="Discover profiles">
        <div className="stage-header">
          <div>
            <h1>
              Discover<span className="pink-dot">.</span>
            </h1>
            <p>Meet someone new.</p>
          </div>
          <Link className="matches-link" href="/discover/matches">
            <Heart size={17} />
            Matches{matchCount > 0 && <span>{matchCount}</span>}
          </Link>
        </div>
        {error && (
          <div className="error-banner" role="alert">
            <p>{error}</p>
            {!currentProfile && (
              <button onClick={retryLoading}>Try again</button>
            )}
          </div>
        )}
        {loading ? (
          <div
            className="profile-skeleton"
            role="status"
            aria-label="Loading profiles"
          >
            <div />
            <span />
            <span />
            <span />
          </div>
        ) : currentProfile ? (
          <>
            <div className="card-stack">
              <div className="stack-back" aria-hidden />
              <AnimatePresence mode="wait">
                <ProfileCard
                  key={currentProfile.id}
                  profile={currentProfile}
                  busy={busy}
                  onSwipe={submitSwipe}
                  exitDirection={lastDirection}
                />
              </AnimatePresence>
            </div>
            <div className="swipe-actions">
              <button
                className="swipe-button pass-button"
                onClick={() => void submitSwipe('pass')}
                disabled={busy}
                aria-label="Pass"
              >
                <X size={29} strokeWidth={2} />
                <span>Pass</span>
              </button>
              <span className="swipe-hint">Drag to choose</span>
              <button
                className="swipe-button like-button"
                onClick={() => void submitSwipe('like')}
                disabled={busy}
                aria-label="Like"
              >
                {busy ? (
                  <LoaderCircle className="spin" size={27} />
                ) : (
                  <Heart size={27} fill="currentColor" />
                )}
                <span>Like</span>
              </button>
            </div>
            <p className="keyboard-hint">
              Or use your keyboard <kbd>←</kbd> <kbd>→</kbd>
            </p>
          </>
        ) : !error ? (
          <div className="empty-card">
            <div className="empty-symbol">
              <Sparkles size={38} />
            </div>
            <h2>You’ve seen everyone for now.</h2>
            <p>
              View your mutual matches, or reset the demo to browse all 36
              profiles again.
            </p>
            <Link href="/discover/matches" className="button primary full">
              View Matches
            </Link>
            <button
              className="button secondary full"
              onClick={resetDemo}
              disabled={busy}
            >
              <RotateCcw size={17} />
              Replay the demo
            </button>
          </div>
        ) : null}
        <p className="under-card-privacy">
          <LockKeyhole size={13} />
          Your likes stay private. Until it’s mutual.
        </p>
        <span className="sr-only" role="status" aria-live="polite">
          {!loading && currentProfile
            ? `Now showing ${currentProfile.name}, ${currentProfile.age}, ${currentProfile.city}`
            : ''}
        </span>
      </section>
      <MatchCelebration
        profile={matchedProfile}
        onClose={() => setMatchedProfile(null)}
      />
    </main>
  );
}
