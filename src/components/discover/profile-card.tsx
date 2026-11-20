'use client';

import Image from 'next/image';
import { MapPin, Plus, Minus } from 'lucide-react';
import {
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
  useAnimationControls,
} from 'motion/react';
import { useState } from 'react';
import type { Direction, Profile } from '@/lib/types';

export function ProfileCard({
  profile,
  busy,
  onSwipe,
  exitDirection,
}: {
  profile: Profile;
  busy: boolean;
  onSwipe: (direction: Direction) => Promise<boolean>;
  exitDirection: Direction;
}) {
  const [expanded, setExpanded] = useState(false);
  const x = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();
  const rotate = useTransform(
    x,
    [-240, 240],
    prefersReducedMotion ? [0, 0] : [-14, 14],
  );
  const likeOpacity = useTransform(x, [25, 110], [0, 1]);
  const passOpacity = useTransform(x, [-110, -25], [1, 0]);
  const controls = useAnimationControls();
  async function finishSwipe(direction: Direction) {
    // The card only exits after the server confirms persistence.
    const accepted = await onSwipe(direction);
    if (!accepted) {
      x.set(0);
      await controls.start({ x: 0, rotate: 0 });
    }
  }
  return (
    <motion.article
      className="profile-card"
      data-testid="profile-card"
      aria-label={`${profile.name}'s profile`}
      style={{ x, rotate, touchAction: 'pan-y' }}
      drag={busy || expanded ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      animate={controls}
      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        x: prefersReducedMotion ? 0 : exitDirection === 'like' ? 240 : -240,
        transition: { duration: prefersReducedMotion ? 0 : 0.18 },
      }}
      onDragEnd={(_, info) => {
        if (busy) return;
        if (Math.abs(info.offset.x) > 95)
          void finishSwipe(info.offset.x > 0 ? 'like' : 'pass');
      }}
    >
      <div className="portrait-wrap">
        <Image
          src={profile.photoUrl}
          alt={`Illustrated portrait of ${profile.name}`}
          fill
          loading="eager"
          sizes="(max-width: 600px) 92vw, 400px"
          draggable={false}
        />
        <motion.div
          className="swipe-stamp like-stamp"
          style={{ opacity: likeOpacity }}
          aria-hidden
        >
          LIKE
        </motion.div>
        <motion.div
          className="swipe-stamp pass-stamp"
          style={{ opacity: passOpacity }}
          aria-hidden
        >
          PASS
        </motion.div>
      </div>
      <div className="profile-info">
        <div className="profile-title">
          <h2>
            {profile.name}
            <span>, {profile.age}</span>
          </h2>
        </div>
        <p className="location">
          <MapPin size={14} />
          {profile.city}
        </p>
        <p className="bio">{profile.bio}</p>
        <div className="interests">
          {profile.interests.map((interest) => (
            <span key={interest}>{interest}</span>
          ))}
        </div>
        <button
          className="more-about"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <Minus size={15} /> : <Plus size={15} />}More about{' '}
          {profile.name}
        </button>
        {expanded && (
          <p className="profile-extra">
            {profile.name} is {profile.age} and based in {profile.city}. A good
            place to start a conversation?{' '}
            {profile.interests.join(', ').toLowerCase()}.
          </p>
        )}
      </div>
    </motion.article>
  );
}
