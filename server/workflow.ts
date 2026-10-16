import type { GrievanceStatus } from '../src/types';

const transitions: Record<GrievanceStatus, readonly GrievanceStatus[]> = {
  Submitted: ['AI Classified', 'Under Review', 'Assigned', 'Rejected'],
  'AI Classified': ['Under Review', 'Assigned', 'Rejected'],
  Assigned: ['Under Review', 'In Progress', 'Rejected'],
  'Under Review': ['Assigned', 'In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Under Review'],
  Resolved: ['Reopened'],
  Reopened: ['Under Review', 'Assigned', 'In Progress'],
  Rejected: ['Reopened'],
};

export function canTransition(from: GrievanceStatus, to: GrievanceStatus) {
  return from === to || transitions[from].includes(to);
}

export function officerCanTransition(from: GrievanceStatus, to: GrievanceStatus) {
  return ['Under Review', 'In Progress', 'Resolved'].includes(to) && canTransition(from, to);
}
