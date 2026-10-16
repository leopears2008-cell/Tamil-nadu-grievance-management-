type LocalBucket = { count: number; resetAt: number };

const localBuckets = new Map<string, LocalBucket>();

function localLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = localBuckets.get(key);
  if (!current || current.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    localBuckets.set(key, bucket);
    return { allowed: true, remaining: Math.max(limit - 1, 0), resetAt: bucket.resetAt };
  }
  current.count += 1;
  return { allowed: current.count <= limit, remaining: Math.max(limit - current.count, 0), resetAt: current.resetAt };
}

function encodePart(value: string) {
  return encodeURIComponent(value);
}

export async function checkRateLimit(key: string, limit: number, windowSeconds = 60) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT === 'true') {
      throw new Error('Distributed rate limiting is required but UPSTASH_REDIS_REST_URL/TOKEN is not configured.');
    }
    const local = localLimit(key, limit, windowSeconds * 1000);
    return { ...local, distributed: false };
  }

  const redisKey = `nivaranai:rl:${encodePart(key)}`;
  const response = await fetch(`${url}/incr/${redisKey}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Rate-limit store returned HTTP ${response.status}`);
  const body = await response.json() as { result?: number | string };
  const count = Number(body.result);
  if (!Number.isFinite(count)) throw new Error('Invalid rate-limit store response.');

  if (count === 1) {
    const expiry = await fetch(`${url}/expire/${redisKey}/${windowSeconds}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!expiry.ok) throw new Error(`Rate-limit expiry returned HTTP ${expiry.status}`);
  }

  const resetAt = Date.now() + windowSeconds * 1000;
  return { allowed: count <= limit, remaining: Math.max(limit - count, 0), resetAt, distributed: true };
}

export function clearLocalRateLimitBucketsForTests() {
  localBuckets.clear();
}
