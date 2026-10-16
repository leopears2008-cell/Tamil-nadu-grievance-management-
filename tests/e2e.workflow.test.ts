import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, officerCanTransition } from '../server/workflow';

test('citizen grievance lifecycle supports authority handoff and reopening', () => {
  assert.equal(canTransition('Submitted', 'Assigned'), true);
  assert.equal(canTransition('Assigned', 'In Progress'), true);
  assert.equal(canTransition('In Progress', 'Resolved'), true);
  assert.equal(canTransition('Resolved', 'Reopened'), true);
  assert.equal(canTransition('Submitted', 'Resolved'), false);
});

test('officers cannot arbitrarily set statuses or reject grievances', () => {
  assert.equal(officerCanTransition('Assigned', 'Under Review'), true);
  assert.equal(officerCanTransition('Under Review', 'In Progress'), true);
  assert.equal(officerCanTransition('In Progress', 'Resolved'), true);
  assert.equal(officerCanTransition('Assigned', 'Rejected'), false);
  assert.equal(officerCanTransition('Submitted', 'Resolved'), false);
});
