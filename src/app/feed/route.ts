import { feed } from '@/lib/matching/service';
import { getSession } from '@/lib/session/session';
import { json, handleError } from '@/lib/http';
export const runtime = 'nodejs';
export async function GET() {
  try { return json({ profiles: await feed(await getSession()) }); } catch (e) { return handleError(e); }
}
