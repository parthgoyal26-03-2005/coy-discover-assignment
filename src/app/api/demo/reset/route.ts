import { checkOrigin, handleError, json } from '@/lib/http';
import { resetSession } from '@/lib/matching/service';
import { getSession } from '@/lib/session/session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    // The target comes only from the cookie; a body cannot select another session.
    const sessionId = await getSession();
    await resetSession(sessionId);
    return json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
