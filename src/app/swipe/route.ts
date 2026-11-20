import { checkOrigin, handleError, json } from '@/lib/http';
import { ApiError, swipe } from '@/lib/matching/service';
import { getSession } from '@/lib/session/session';
import { swipeInput } from '@/lib/validation/swipe';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    checkOrigin(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, 'Send a valid JSON request body.');
    }

    const validatedInput = swipeInput.safeParse(body);
    if (!validatedInput.success) {
      throw new ApiError(
        400,
        'Use a valid profileId and direction: like or pass.',
      );
    }

    const sessionId = await getSession();
    const { profileId, direction } = validatedInput.data;
    const result = await swipe(sessionId, profileId, direction);
    return json(result);
  } catch (error) {
    return handleError(error);
  }
}
