import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Grievance, GrievanceStatus } from '../types';
import {
  HardHat,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  Camera,
  UploadCloud,
  Send,
  Building2,
  Calendar,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  User,
  X,
} from 'lucide-react';

export const OfficerPortal: React.FC = () => {
  const { language, t, showToast, triggerRefresh, refreshKey } = useApp();

  const [complaints, setComplaints] = useState<Grievance[]>([]);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  // Form states inside Resolve Modal
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [resolutionRemarksTa, setResolutionRemarksTa] = useState('');
  const [proofPhotoUrl, setProofPhotoUrl] = useState('');
  const [isGeneratingAiDraft, setIsGeneratingAiDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const officerName = 'Er. K. Vasanthakumar';
  const officerDesignation = 'Assistant Executive Engineer (TANGEDCO / GCC)';

  const loadOfficerComplaints = async () => {
    try {
      const data = await api.getComplaints();
      setComplaints(data);
      if (data.length > 0 && !selectedGrievance) {
        setSelectedGrievance(data[0]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadOfficerComplaints();
  }, [refreshKey]);

  // AI Auto-Resolution Drafter
  const handleGenerateAiDraft = async () => {
    if (!selectedGrievance) return;
    setIsGeneratingAiDraft(true);
    try {
      const draft = await api.draftResolution(
        selectedGrievance.category,
        selectedGrievance.summaryEn,
        'Field technician replaced damaged cables and restored power/utility. Tested and verified on-site.'
      );
      setResolutionRemarks(draft.resolutionEn);
      setResolutionRemarksTa(draft.resolutionTa);
      showToast(
        language === 'ta'
          ? 'AI தீர்வு அறிக்கை உருவாக்கப்பட்டது'
          : 'AI Resolution draft generated successfully in Tamil and English',
        'info'
      );
    } catch {
      setResolutionRemarks(
        'Fault rectified on site by the zonal maintenance squad. Power/facility restored and tested.'
      );
      setResolutionRemarksTa('கள பொறியாளரால் ஆய்வு செய்யப்பட்டு பிரச்சனை முழுமையாக சரிசெய்யப்பட்டது.');
    } finally {
      setIsGeneratingAiDraft(false);
    }
  };

  const handleUpdateStatus = async (status: GrievanceStatus) => {
    if (!selectedGrievance) return;
    try {
      const updated = await api.updateComplaintStatus(selectedGrievance.id, {
        status,
        remarks:
          status === 'Resolved'
            ? resolutionRemarks || 'Field team resolved the complaint and verified operations.'
            : `Status progressed to ${status} by Field Engineer`,
        updatedBy: officerName,
        role: 'OFFICER',
        evidenceUrl: proofPhotoUrl || undefined,
      });

      setSelectedGrievance(updated);
      setIsResolveModalOpen(false);
      triggerRefresh();
      showToast(`Status updated to ${status}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Officer ID Profile Bar */}
      <div className="bg-linear-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black">{officerName}</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Active On Duty
              </span>
            </div>
            <p className="text-xs text-slate-400">{officerDesignation}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Zone / Ward</span>
            <span className="font-bold text-white">Chennai Central - Zone 5</span>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div>
            <span className="text-slate-400 block text-[10px]">Assigned Queue</span>
            <span className="font-mono font-bold text-amber-300">
              {complaints.filter((c) => c.status !== 'Resolved').length} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Queue on Left, Active Case Workspace on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Complaint Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Field Work Orders
            </h3>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              {complaints.length} Cases
            </span>
          </div>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {complaints.map((c) => {
              const isSelected = selectedGrievance?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedGrievance(c)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-mono font-bold text-xs text-indigo-900">{c.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.priority === 'Critical'
                          ? 'bg-red-100 text-red-800'
                          : c.priority === 'High'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      ● {c.priority}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 line-clamp-1">{c.summaryEn}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{c.location.address}</p>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-600">{c.citizenName}</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded ${
                        c.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Case Details & Resolution Action Pad (7 cols) */}
        <div className="lg:col-span-7">
          {selectedGrievance ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black font-mono text-slate-900">
                      {selectedGrievance.id}
                    </h3>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                      {selectedGrievance.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target Resolution: {new Date(selectedGrievance.targetResolutionDate).toLocaleDateString()}
                  </p>
                </div>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                    selectedGrievance.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {selectedGrievance.status}
                </span>
              </div>

              {/* Citizen Contact & Location Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Complainant Contact
                  </span>
                  <p className="font-bold text-slate-900">{selectedGrievance.citizenName}</p>
                  <a
                    href={`tel:${selectedGrievance.citizenPhone}`}
                    className="text-indigo-600 font-mono font-semibold flex items-center space-x-1 mt-0.5 hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{selectedGrievance.citizenPhone}</span>
                  </a>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Site Location
                  </span>
                  <p className="font-bold text-slate-900">{selectedGrievance.location.address}</p>
                  <p className="text-slate-500 text-[11px]">
                    Landmark: {selectedGrievance.location.landmark || 'Main Road'}
                  </p>
                </div>
              </div>

              {/* Issue Description */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Original Complaint
                </span>
                <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-200/50 text-xs text-slate-800 space-y-1 leading-relaxed">
                  <p className="font-medium">{selectedGrievance.summaryEn}</p>
                  {selectedGrievance.summaryTa && (
                    <p className="text-slate-600 italic">"{selectedGrievance.summaryTa}"</p>
                  )}
                </div>
              </div>

              {/* Workflow Progression Action Bar */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Field Workflow Actions
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('Under Review')}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors text-center"
                  >
                    1. Site Inspection
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('In Progress')}
                    className="p-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-xs font-bold rounded-xl transition-colors text-center"
                  >
                    2. Work In Progress
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResolutionRemarks('');
                      setResolutionRemarksTa('');
                      setProofPhotoUrl(
                        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
                      );
                      setIsResolveModalOpen(true);
                    }}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors text-center flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>3. Mark Resolved</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
              Select a work order from the left to view details and execute actions.
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: RESOLUTION PROOF & AI DRAFTER ================= */}
      {isResolveModalOpen && selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-slate-900">Close & Resolve Grievance</h3>
                <p className="text-xs text-slate-500 font-mono">For {selectedGrievance.id}</p>
              </div>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* AI Auto-Resolution Button */}
              <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                <div>
                  <span className="font-bold text-indigo-900">AI Resolution Auto-Drafter</span>
                  <p className="text-[11px] text-slate-500">
                    Generate bilingual official closure remarks with Gemini
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAiDraft}
                  disabled={isGeneratingAiDraft}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center space-x-1.5 transition-all text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isGeneratingAiDraft ? 'Drafting...' : 'Auto-Draft Remarks'}</span>
                </button>
              </div>

              {/* English Remarks */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Resolution Remarks (English) *
                </label>
                <textarea
                  rows={2}
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                  placeholder="Details of repair work completed on site..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Tamil Remarks */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  தீர்வு அறிக்கை (தமிழ்)
                </label>
                <textarea
                  rows={2}
                  value={resolutionRemarksTa}
                  onChange={(e) => setResolutionRemarksTa(e.target.value)}
                  placeholder="களத்தில் சரிசெய்யப்பட்ட விவரம் தமிழில்..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Proof Photo */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Resolution Proof Photo URL
                </label>
                <input
                  type="text"
                  value={proofPhotoUrl}
                  onChange={(e) => setProofPhotoUrl(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('Resolved')}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Submit Resolution & Notify Citizen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
