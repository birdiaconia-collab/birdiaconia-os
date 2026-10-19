/** CSRF and size checks for authenticated operator mutations. */
export function sameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  let expected: string;
  try {
    expected = new URL(request.url).origin;
  } catch {
    return false;
  }
  return origin === expected && (!fetchSite || fetchSite === "same-origin");
}

export async function readSmallJson(request: Request, maxBytes = 4096): Promise<unknown> {
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    throw new Error("invalid_content_type");
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error("request_too_large");
  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > maxBytes) throw new Error("request_too_large");
  return JSON.parse(body) as unknown;
}
