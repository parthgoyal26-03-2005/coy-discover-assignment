import 'server-only';
import { NextResponse } from 'next/server';
import { ApiError } from './matching/service';

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site')
    throw new ApiError(403, 'Cross-site requests are not allowed.');
}
export function handleError(error: unknown) {
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  console.error('Coy API request failed:', error instanceof Error ? error.message : 'Unknown error');
  return json({ error: 'We could not connect to the database. Please check the server setup and try again.' }, 503);
}
