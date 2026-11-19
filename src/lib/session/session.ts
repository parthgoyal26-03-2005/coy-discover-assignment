import 'server-only';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/client';
import { sessions } from '../db/schema';
import { createSession } from '../matching/service';

export async function getSession() {
  const jar = await cookies();
  const id = jar.get('coy_session')?.value;
  if (id && /^[0-9a-f-]{36}$/i.test(id)) {
    const [session] = await getDb().select({ id: sessions.id }).from(sessions).where(eq(sessions.id, id));
    if (session) return id;
  }
  const newId = await createSession();
  jar.set('coy_session', newId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 });
  return newId;
}
