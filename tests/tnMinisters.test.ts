import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllTNMinisters, getMinisterParties } from '../src/data/tnMinisters.ts';

test('TN ministers directory contains the supplied 2026 roster', () => {
  const ministers = getAllTNMinisters();
  assert.equal(ministers.length, 33);
  assert.equal(ministers[0]?.designation, 'Chief Minister');
  assert.equal(ministers[0]?.appointmentDate, '2026-05-10');
  assert.equal(new Set(ministers.map((m) => m.id)).size, 33);
});

test('minister records preserve unknown biography fields instead of fabricating them', () => {
  const ministers = getAllTNMinisters();
  assert.ok(ministers.some((m) => m.education === null));
  assert.ok(ministers.some((m) => m.dateOfBirth === null));
  assert.deepEqual(getMinisterParties(), ['All Parties', 'INC', 'TVK']);
});

test('every minister has a source and verification note', () => {
  for (const minister of getAllTNMinisters()) {
    assert.ok(minister.sourceUrl.startsWith('https://'));
    assert.ok(minister.verificationNote.length > 0);
  }
});
