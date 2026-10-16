import type { NextFunction, Request, Response } from 'express';

type RouteMetric = {
  count: number;
  errors: number;
  totalMs: number;
  maxMs: number;
};

const startedAt = Date.now();
const routes = new Map<string, RouteMetric>();
let lastAlertAt = 0;

async function sendAlert(payload: Record<string, unknown>) {
  const url = process.env.OBSERVABILITY_WEBHOOK_URL;
  if (!url || Date.now() - lastAlertAt < 60_000) return;
  lastAlertAt = Date.now();
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(5_000) });
  } catch {
    // Alerting must never break the request path.
  }
}

function routeKey(req: Request) {
  return `${req.method} ${req.route?.path || req.path}`;
}

export function observabilityMiddleware(req: Request, res: Response, next: NextFunction) {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    const key = routeKey(req);
    const current = routes.get(key) || { count: 0, errors: 0, totalMs: 0, maxMs: 0 };
    current.count += 1;
    current.errors += res.statusCode >= 500 ? 1 : 0;
    current.totalMs += durationMs;
    current.maxMs = Math.max(current.maxMs, durationMs);
    routes.set(key, current);

    if (res.statusCode >= 500) {
      void sendAlert({ event: 'server_error', requestId: res.getHeader('X-Request-Id') || undefined, method: req.method, route: key, status: res.statusCode, durationMs: Math.round(durationMs * 100) / 100, occurredAt: new Date().toISOString() });
    }

    if (process.env.LOG_REQUESTS === 'true' || res.statusCode >= 500) {
      console.info(JSON.stringify({
        event: 'http_request',
        method: req.method,
        route: key,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        requestId: res.getHeader('X-Request-Id') || undefined,
      }));
    }
  });
  next();
}

export function getObservabilitySnapshot() {
  const entries = [...routes.entries()].map(([route, metric]) => ({
    route,
    requests: metric.count,
    errors: metric.errors,
    errorRate: metric.count ? Number((metric.errors / metric.count).toFixed(4)) : 0,
    avgMs: metric.count ? Number((metric.totalMs / metric.count).toFixed(2)) : 0,
    maxMs: Number(metric.maxMs.toFixed(2)),
  }));
  entries.sort((a, b) => b.requests - a.requests);
  const totalRequests = entries.reduce((sum, item) => sum + item.requests, 0);
  const totalErrors = entries.reduce((sum, item) => sum + item.errors, 0);
  return {
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    memory: process.memoryUsage(),
    requests: totalRequests,
    errors: totalErrors,
    errorRate: totalRequests ? Number((totalErrors / totalRequests).toFixed(4)) : 0,
    routes: entries.slice(0, 100),
    generatedAt: new Date().toISOString(),
  };
}
