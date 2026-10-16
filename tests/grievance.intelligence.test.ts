import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeGrievance, jaccardSimilarity, scoreDuplicate } from '../server/grievanceIntelligence';

test('routes electrical safety complaints to electrical services', () => {
  const result = analyzeGrievance({ text: 'Exposed live wire sparking near school' });
  assert.equal(result.departmentId, 'dept-electric');
  assert.equal(result.severity, 'Critical');
  assert.equal(result.slaDays, 1);
});

test('duplicate similarity increases for matching civic issue text', () => {
  const score = scoreDuplicate('large pothole near bus stop', 'large pothole near bus stop');
  assert.equal(score, 1);
  assert.ok(jaccardSimilarity('garbage collection missed', 'large road pothole') < 0.2);
});
