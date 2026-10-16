import test from 'node:test';
import assert from 'node:assert/strict';
import { googleNewsUrl, newsApiUrl, fetchLiveNews } from '../src/services/news';
import { clearNewsCacheForTests, fetchNews } from '../server/newsProvider';

test('Google News URL preserves the search query and India locale', () => {
  const url = new URL(googleNewsUrl('Tamil Nadu & civic issues'));
  assert.equal(url.hostname, 'news.google.com');
  assert.equal(url.searchParams.get('q'), 'Tamil Nadu & civic issues');
  assert.equal(url.searchParams.get('hl'), 'en-IN');
  assert.equal(url.searchParams.get('gl'), 'IN');
});

test('news API URL caps the requested result count', () => {
  const url = new URL(newsApiUrl('Chennai', 99), 'http://localhost');
  assert.equal(url.pathname, '/api/news/tamil-nadu');
  assert.equal(url.searchParams.get('q'), 'Chennai');
  assert.equal(url.searchParams.get('limit'), '20');
});

test('live news maps backend JSON into article cards', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({
    articles: [{
      title: 'Tamil Nadu civic update',
      url: 'https://example.com/news',
      extract: 'A current news article.',
      source: 'Example News',
      publishedAt: '2026-10-03T12:00:00Z',
    }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })) as unknown as typeof fetch;

  try {
    const articles = await fetchLiveNews(`test-news-${Date.now()}`, 5);
    assert.equal(articles.length, 1);
    assert.equal(articles[0].title, 'Tamil Nadu civic update');
    assert.equal(articles[0].source, 'Example News');
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test('production news provider sanitizes, validates, deduplicates and uses server-side API authentication', async () => {
  const originalFetch = globalThis.fetch;
  const originalProvider = process.env.NEWS_PROVIDER;
  const originalKey = process.env.NEWS_API_KEY;
  process.env.NEWS_PROVIDER = 'newsapi';
  process.env.NEWS_API_KEY = 'test-key';
  clearNewsCacheForTests();

  let requested = '';
  globalThis.fetch = (async (input, init) => {
    requested = String(input);
    assert.equal((init?.headers as Record<string, string>)['X-Api-Key'], 'test-key');
    return new Response(JSON.stringify({
      status: 'ok',
      articles: [
        { title: '<b>Safe title</b>', url: 'https://example.com/a', description: '<script>alert(1)</script>hello', source: { name: 'Example' } },
        { title: 'Duplicate', url: 'https://example.com/a', description: 'duplicate', source: { name: 'Example' } },
        { title: 'Bad URL', url: 'javascript:alert(1)', description: 'bad', source: { name: 'Bad' } },
      ],
    }), { status: 200 });
  }) as unknown as typeof fetch;

  try {
    const result = await fetchNews('Tamil Nadu', 10);
    assert.match(requested, /newsapi\.org\/v2\/everything/);
    assert.equal(result.articles.length, 1);
    assert.equal(result.articles[0].title, 'Safe title');
    assert.equal(result.articles[0].extract, 'alert(1) hello');
  } finally {
    globalThis.fetch = originalFetch;
    process.env.NEWS_PROVIDER = originalProvider;
    process.env.NEWS_API_KEY = originalKey;
    clearNewsCacheForTests();
  }
});

test('production news provider retries transient 429 and succeeds', async () => {
  const originalFetch = globalThis.fetch;
  const originalProvider = process.env.NEWS_PROVIDER;
  const originalKey = process.env.NEWS_API_KEY;
  process.env.NEWS_PROVIDER = 'newsapi';
  process.env.NEWS_API_KEY = 'test-key';
  clearNewsCacheForTests();

  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    if (calls < 2) return new Response('rate limited', { status: 429 });
    return new Response(JSON.stringify({ status: 'ok', articles: [] }), { status: 200 });
  }) as unknown as typeof fetch;

  try {
    await fetchNews('retry-test', 5);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.NEWS_PROVIDER = originalProvider;
    process.env.NEWS_API_KEY = originalKey;
    clearNewsCacheForTests();
  }
});
