import { z } from 'zod';
export const swipeInput = z.object({ profileId: z.uuid(), direction: z.enum(['like', 'pass']) }).strict();
