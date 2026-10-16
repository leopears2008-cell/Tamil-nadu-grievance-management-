import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWikipediaSearchUrl,
  normalizeWikiTitle,
  isLikelyWikiProfileMatch,
  findWikipediaProfile,
} from '../src/services/wikimedia';

test('normalizes Wikipedia names and accepts only plausible exact profile matches', () => {
  assert.equal(normalizeWikiTitle('S. P. Velumani'), 's p velumani');
  assert.equal(isLikelyWikiProfileMatch('S. P. Velumani', 'S. P. Velumani'), true);
  assert.equal(isLikelyWikiProfileMatch('S. P. Velumani', 'S. P. Velumani politician'), true);
  assert.equal(isLikelyWikiProfileMatch('S. P. Velumani', 'Someone Else'), false);
});

test('Wikipedia profile URL encodes untrusted search text', () => {
  const wikipedia = buildWikipediaSearchUrl('A & B / Tamil Nadu');
  const params = new URL(wikipedia).searchParams;
  assert.equal(params.get('format'), 'json');
  assert.equal(params.get('origin'), '*');
  assert.equal(params.get('gsrsearch'), 'A & B / Tamil Nadu');
});

test('Wikipedia profile lookup uses exact-title matching before displaying a person image', async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    if (url.includes('en.wikipedia.org') && url.includes('generator=search')) {
      return new Response(JSON.stringify({
        query: {
          pages: {
            '1': {
              title: 'Test MLA',
              fullurl: 'https://en.wikipedia.org/wiki/Test_MLA',
              description: 'Indian politician',
              extract: 'Profile summary',
              thumbnail: { source: 'https://upload.wikimedia.org/test.jpg' },
            },
          },
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(`Unexpected URL: ${url}`);
  }) as typeof fetch;

  try {
    const profile = await findWikipediaProfile('Test MLA');
    assert.equal(profile?.title, 'Test MLA');
    assert.equal(profile?.imageUrl, 'https://upload.wikimedia.org/test.jpg');
    assert.ok(calls.length >= 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
