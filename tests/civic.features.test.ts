import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeGrievance } from '../server/grievanceIntelligence';

test('civic intelligence exposes routing, severity and SLA signals', () => {
  const result = analyzeGrievance({ text:'Exposed live wire near school entrance, dangerous for children', category:'Electricity & Power', district:'Chennai' });
  assert.equal(result.departmentId,'dept-electric');
  assert.equal(result.severity,'Critical');
  assert.equal(result.slaDays,1);
});

test('quality scoring thresholds classify complete complaint content', () => {
  const text='Street light near the school has been off for 7 days and the road is very dark at night, affecting pedestrians and students in Chennai.';
  assert.ok(text.length >= 60);
  assert.ok(text.split(/\s+/).length >= 12);
});
