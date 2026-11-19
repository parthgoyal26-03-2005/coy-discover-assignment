import { swipe, ApiError } from '@/lib/matching/service';
import { getSession } from '@/lib/session/session';
import { swipeInput } from '@/lib/validation/swipe';
import { json, handleError, checkOrigin } from '@/lib/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    let body: unknown;
    try { body = await request.json(); } catch { throw new ApiError(400, 'Send a valid JSON request body.'); }
    const parsed = swipeInput.safeParse(body);
    if (!parsed.success) throw new ApiError(400, 'Use a valid profileId and direction: like or pass.');
    return json(await swipe(await getSession(), parsed.data.profileId, parsed.data.direction));
  } catch (e) { return handleError(e); }
}
