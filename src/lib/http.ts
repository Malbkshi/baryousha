const MAX_BODY_BYTES = 10_000;

/** Parses a small JSON body. Null when it is missing, too large or not JSON. */
export async function readJson(request: Request, maxBytes = MAX_BODY_BYTES): Promise<unknown | null> {
  try {
    const text = await request.text();
    if (!text || Buffer.byteLength(text) > maxBytes) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const noStore = { "Cache-Control": "no-store" } as const;
