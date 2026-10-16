import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const hero = read('src/components/HeroSection.tsx');
const css = read('src/index.css');

test('hero does not show Gemini branding', () => {
  assert.doesNotMatch(hero, /gemini/i);
});

test('hero keeps real grievance workflow wiring', () => {
  assert.match(hero, /setActiveTab\('file'\)/);
  assert.match(hero, /onOpenVoiceModal/);
  assert.match(hero, /Grievance Assistant/);
});

test('hero uses a credited non-AI civic photograph', () => {
  assert.match(hero, /upload\.wikimedia\.org/);
  assert.match(hero, /public domain/i);
  assert.doesNotMatch(hero, /makeMotes|hero-kenburns|useHeroParallax/);
});

test('hero CSS contains no continuous motion, parallax or gradient effects', () => {
  assert.doesNotMatch(css, /hero-kenburns|hero-mote|hero-float|hero-photo-depth|radial-gradient|linear-gradient/);
  assert.doesNotMatch(css, /--px|--py|translate:\s*calc/);
});

test('hero buttons use standard rectangular controls instead of pill-shaped buttons', () => {
  const buttonBlock = css.slice(css.indexOf('.hero-complaint-button'));
  assert.doesNotMatch(buttonBlock, /border-radius:\s*9999?px/);
  assert.match(buttonBlock, /border-radius:\s*0\.65rem/);
});
