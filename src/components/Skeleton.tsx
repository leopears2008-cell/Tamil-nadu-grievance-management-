import React from 'react';

export const PageSkeleton: React.FC<{ label: string }> = ({ label }) => (
  <div role="status" aria-label={label} className="animate-pulse space-y-4 py-6">
    <div className="h-8 w-1/3 rounded-lg bg-slate-200" />
    <div className="h-4 w-2/3 rounded bg-slate-200" />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
      <div className="h-32 rounded-2xl bg-slate-200" />
      <div className="h-32 rounded-2xl bg-slate-200" />
      <div className="h-32 rounded-2xl bg-slate-200" />
    </div>
    <span className="sr-only">{label}</span>
  </div>
);
