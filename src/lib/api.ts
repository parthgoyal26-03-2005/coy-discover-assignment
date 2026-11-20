export async function api<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined ? 'GET' : 'POST',
    cache: 'no-store',
    ...(body === undefined
      ? {}
      : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    // Proxies and platform failures can return HTML instead of the API's JSON.
    throw new Error(
      'The server returned an unreadable response. Please try again.',
    );
  }
  if (!response.ok)
    throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}
