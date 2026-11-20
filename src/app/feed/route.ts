import { handleError, json } from '@/lib/http';
import { feed } from '@/lib/matching/service';
import { getSession } from '@/lib/session/session';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const sessionId = await getSession();
    const profiles = await feed(sessionId);
    return json({ profiles });
  } catch (error) {
    return handleError(error);
  }
}
