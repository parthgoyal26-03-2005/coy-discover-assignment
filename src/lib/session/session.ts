import 'server-only';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/client';
import { sessions } from '../db/schema';
import { createSession } from '../matching/service';
import { z } from 'zod';

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('coy_session')?.value;
  if (sessionId && z.uuid().safeParse(sessionId).success) {
    const [session] = await getDb()
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.id, sessionId));
    if (session) return sessionId;
  }
  // Missing, malformed, and unknown cookies get a new server-owned session.
  const newSessionId = await createSession();
  cookieStore.set('coy_session', newSessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return newSessionId;
}
