/**
 * Tiny in-memory sliding-window rate limiter. Per-instance only — fine for a
 * single container; swap for Redis (e.g. Upstash) if you scale to many
 * instances. Returns true if the action is allowed, false if the limit is hit.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      const live = times.filter((t) => now - t < windowMs);
      if (live.length) hits.set(k, live);
      else hits.delete(k);
    }
  }
  return true;
}

/** Best-effort client IP from proxy headers (Render/Railway set these). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
