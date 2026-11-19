import { resetSession } from '@/lib/matching/service';
import { getSession } from '@/lib/session/session';
import { json, handleError, checkOrigin } from '@/lib/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try { checkOrigin(request); await resetSession(await getSession()); return json({ success: true }); } catch (e) { return handleError(e); }
}
