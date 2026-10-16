/**
 * Wikipedia-backed civic information helpers.
 * Live news is intentionally handled by the backend Google News adapter.
 */

export interface WikipediaProfile {
  title: string;
  url: string;
  description: string;
  extract: string;
  imageUrl?: string;
}

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const PROFILE_TTL_MS = 15 * 60 * 1000;
const profileCache = new Map<string, { expiresAt: number; value: WikipediaProfile | null }>();

export const normalizeWikiTitle = (value: string): string =>
  value.normalize('NFKD').replace(/[^\p{Letter}\p{Number}]+/gu, ' ').trim().toLowerCase();

export const isLikelyWikiProfileMatch = (requestedName: string, pageTitle: string): boolean => {
  const requested = normalizeWikiTitle(requestedName);
  const title = normalizeWikiTitle(pageTitle);
  if (!requested || !title) return false;
  return requested === title || title === `${requested} politician` || title === `${requested} tamil nadu`;
};

export const buildWikipediaSearchUrl = (name: string): string => {
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: name, gsrnamespace: '0', gsrlimit: '8',
    prop: 'pageimages|extracts|info', piprop: 'thumbnail', pithumbsize: '640',
    exintro: '1', explaintext: '1', inprop: 'url', format: 'json', origin: '*',
  });
  return `${WIKIPEDIA_API}?${params.toString()}`;
};

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Wikipedia request failed with HTTP ${response.status}`);
    return await response.json() as T;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

interface WikiSearchPage {
  title?: string;
  fullurl?: string;
  extract?: string;
  description?: string;
  thumbnail?: { source?: string };
}
interface WikiApiResponse { query?: { pages?: Record<string, WikiSearchPage> } }

export async function findWikipediaProfile(name: string): Promise<WikipediaProfile | null> {
  const normalized = name.trim();
  if (!normalized || normalized.length > 120) return null;
  const key = normalized.toLowerCase();
  const cached = profileCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const data = await fetchJson<WikiApiResponse>(buildWikipediaSearchUrl(normalized));
    const page = Object.values(data.query?.pages ?? {}).find(
      (candidate) => typeof candidate.title === 'string' && isLikelyWikiProfileMatch(normalized, candidate.title),
    );
    const value = page?.title ? {
      title: page.title,
      url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      description: page.description || 'Wikipedia profile',
      extract: page.extract || '',
      imageUrl: page.thumbnail?.source,
    } : null;
    profileCache.set(key, { expiresAt: Date.now() + PROFILE_TTL_MS, value });
    return value;
  } catch {
    profileCache.set(key, { expiresAt: Date.now() + 30_000, value: null });
    return null;
  }
}
