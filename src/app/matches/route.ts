import { handleError, json } from '@/lib/http';
import { listMatches } from '@/lib/matching/service';
import { getSession } from '@/lib/session/session';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const sessionId = await getSession();
    const matches = await listMatches(sessionId);
    return json({ matches });
  } catch (error) {
    return handleError(error);
  }
}
