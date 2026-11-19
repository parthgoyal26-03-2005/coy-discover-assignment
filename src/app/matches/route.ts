import { listMatches } from '@/lib/matching/service';
import { getSession } from '@/lib/session/session';
import { json, handleError } from '@/lib/http';
export const runtime = 'nodejs';
export async function GET() {
  try { return json({ matches: await listMatches(await getSession()) }); } catch (e) { return handleError(e); }
}
