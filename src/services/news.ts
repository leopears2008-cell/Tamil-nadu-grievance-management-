/**
 * Google News RSS-backed civic news helpers.
 *
 * Live news is fetched by the backend so the browser does not depend directly
 * on a third-party RSS endpoint. Wikipedia/Wikimedia remains a separate source
 * for MLA profile metadata and is intentionally not used for live news.
 */

export interface LiveNewsArticle {
  title: string;
  url: string;
  extract: string;
  source: string;
  publishedAt?: string;
}

const NEWS_TTL_MS = 60 * 1000;
const API_BASE = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');
const newsCache = new Map<string, { expiresAt: number; value: LiveNewsArticle[] }>();

export const googleNewsUrl = (query: string): string =>
  `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN%3Aen`;

export const newsApiUrl = (query: string, limit = 12): string => {
  const params = new URLSearchParams({ q: query, limit: String(Math.min(Math.max(limit, 1), 20)) });
  return `${API_BASE}/api/news/tamil-nadu?${params.toString()}`;
};

export async function fetchLiveNews(query: string, limit = 12): Promise<LiveNewsArticle[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length > 180) return [];

  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const cacheKey = `${cleanQuery.toLowerCase()}::${safeLimit}`;
  const cached = newsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(newsApiUrl(cleanQuery, safeLimit), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`News API failed with HTTP ${response.status}`);

    const payload = await response.json() as { articles?: LiveNewsArticle[] };
    const articles = Array.isArray(payload.articles) ? payload.articles : [];
    newsCache.set(cacheKey, { expiresAt: Date.now() + NEWS_TTL_MS, value: articles });
    return articles;
  } catch {
    return [];
  } finally {
    globalThis.clearTimeout(timeout);
  }
}
