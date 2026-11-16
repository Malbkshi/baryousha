/**
 * Whether `next/image` may optimise this source. It throws, and takes the
 * whole page down with it, for any remote host not listed in next.config.ts,
 * and staff can paste any URL into the dashboard. Anything else is served
 * untouched.
 *
 * Keep in step with `images.remotePatterns` in next.config.ts.
 */
export function canOptimize(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.hostname === "images.unsplash.com") return true;
  return (
    url.hostname.endsWith(".supabase.co") &&
    url.pathname.startsWith("/storage/v1/object/public/")
  );
}
