import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Grievance, GrievanceStatus } from '../types';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  MapPin,
  Calendar,
  Building2,
} from 'lucide-react';

export const CitizenHistory: React.FC = () => {
  const { language, t, navigateToTrack, refreshKey } = useApp();
  const [complaints, setComplaints] = useState<Grievance[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const data = await api.getComplaints();
      setComplaints(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [refreshKey]);

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.summaryEn.toLowerCase().includes(q) ||
        c.summaryTa.toLowerCase().includes(q) ||
        c.location.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-sans">
              {language === 'ta' ? 'எனது புகார் வரலாறு' : 'My Grievance History'}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'ta'
                ? 'நீங்கள் சமர்ப்பித்த அனைத்து குறைகளின் தற்போதைய நிலை'
                : 'Track, view status updates, and submit feedback for your filed complaints'}
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Submitted', 'In Progress', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs rounded-xl font-semibold transition-all shrink-0 ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'All'
                  ? language === 'ta'
                    ? 'அனைத்தும்'
                    : 'All'
                  : st === 'Submitted'
                  ? language === 'ta'
                    ? 'பெறப்பட்டவை'
                    : 'Submitted'
                  : st === 'In Progress'
                  ? language === 'ta'
                    ? 'நடவடிக்கையில்'
                    : 'In Progress'
                  : language === 'ta'
                  ? 'முடிந்தவை'
                  : 'Resolved'}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'ta'
                ? 'புகார் எண் அல்லது பகுதி பெயர் மூலம் தேடுக...'
                : 'Search grievances by ID, category, or location...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
          />
        </div>
      </div>

      {/* List of Grievance Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">
              {language === 'ta' ? 'புகார்கள் எதுவும் கிடைக்கவில்லை' : 'No grievances found'}
            </p>
          </div>
        ) : (
          filtered.map((g) => (
            <div
              key={g.id}
              onClick={() => navigateToTrack(g.id)}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-sm text-indigo-900 group-hover:underline">
                    {g.id}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {g.category}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      g.priority === 'Critical'
                        ? 'bg-red-100 text-red-800'
                        : g.priority === 'High'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    ● {g.priority}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-medium text-slate-800 line-clamp-2">
                  {language === 'ta' && g.summaryTa ? g.summaryTa : g.summaryEn}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{g.location.address}, {g.location.district}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(g.createdAt).toLocaleDateString('en-IN', {
                        dateStyle: 'medium',
                      })}
                    </span>
                  </span>
                </div>
              </div>

              {/* Right Status Badge & Action */}
              <div className="flex sm:flex-col justify-between sm:justify-center items-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                    g.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : g.status === 'In Progress'
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {g.status}
                </span>

                <span className="text-xs text-indigo-600 font-bold flex items-center space-x-1 group-hover:translate-x-1 transition-transform mt-2">
                  <span>{language === 'ta' ? 'விவரம்' : 'View'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
