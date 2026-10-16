import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Grievance, GrievanceStatus, GrievancePriority } from '../types';
import { getMLAForDistrict, getMLAForConstituency, MLAProfile } from '../data/mlaProfiles';
import {
  Search,
  CheckCircle2,
  Clock,
  HardHat,
  Phone,
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Star,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FileText,
  UserCheck,
  Check,
  Landmark,
  Megaphone,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CitizenTracker: React.FC = () => {
  const { language, t, trackId, setTrackId, showToast, triggerRefresh, refreshKey } = useApp();
  const [searchInput, setSearchInput] = useState(trackId || 'GRV-2026-00124');
  const [grievance, setGrievance] = useState<Grievance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Feedback State
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSatisfied, setIsSatisfied] = useState(true);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const fetchGrievance = async (id: string, silent = false) => {
    if (!id.trim()) return;
    if (!silent) setIsLoading(true);
    if (!silent) setErrorMsg('');
    try {
      const data = await api.getComplaintById(id.trim());
      setGrievance(data);
      if (data.feedback) {
        setRating(data.feedback.rating);
        setFeedbackText(data.feedback.comment);
        setIsSatisfied(data.feedback.isResolvedSatisfied);
        setFeedbackSubmitted(true);
      } else {
        setFeedbackSubmitted(false);
      }
    } catch (err: any) {
      setGrievance(null);
      setErrorMsg(
        language === 'ta'
          ? 'இந்த எண்ணில் புகார் எதுவும் கிடைக்கவில்லை. தயவுசெய்து எண்ணைச் சரிபார்க்கவும்.'
          : 'No grievance found with this Tracking ID. Please verify and try again.'
      );
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (trackId) {
      setSearchInput(trackId);
      fetchGrievance(trackId);
    }
  }, [trackId, refreshKey]);

  // Real-time polling simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (grievance && grievance.status !== 'Resolved' && grievance.status !== 'Rejected') {
      interval = setInterval(() => {
        fetchGrievance(grievance.id, true);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [grievance?.id, grievance?.status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setTrackId(searchInput.trim().toUpperCase());
    fetchGrievance(searchInput.trim().toUpperCase());
  };

  const [isEscalating, setIsEscalating] = useState(false);

  const handleMLAEscalation = async () => {
    if (!grievance) return;
    setIsEscalating(true);
    
    const mla = grievance.location.constituency 
      ? getMLAForConstituency(grievance.location.district, grievance.location.constituency) 
      : getMLAForDistrict(grievance.location.district);
    
    try {
      // Mock escalation: we patch the status history and status if needed.
      // But we can just use the status update API to add a remark or change state to escalate.
      // Here we'll append to status history via API update
      const updated = await api.updateComplaintStatus(grievance.id, {
        status: 'Under Review', // Or 'Assigned', or keep current status but add history
        remarks: `ESCALATED: Direct notification sent to Constitutional MLA ${mla.name} for urgent intervention.`,
        updatedBy: 'Citizen Escalation',
        role: 'CITIZEN'
      });
      
      setGrievance(updated);
      showToast(
        language === 'ta' 
          ? `புகார் சட்டமன்ற உறுப்பினர் ${mla.name} அவர்களின் கவனத்திற்கு கொண்டு செல்லப்பட்டது.`
          : `Grievance successfully escalated to Constitutional MLA ${mla.name}.`,
        'success'
      );
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to escalate to MLA', 'error');
    } finally {
      setIsEscalating(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grievance) return;
    setIsSubmittingFeedback(true);
    try {
      const updated = await api.submitFeedback(grievance.id, {
        rating,
        comment: feedbackText,
        isResolvedSatisfied: isSatisfied,
      });
      setGrievance(updated);
      setFeedbackSubmitted(true);
      setIsSubmittingFeedback(false);
      triggerRefresh();

      if (isSatisfied) {
        try {
          confetti({ particleCount: 50, spread: 60 });
        } catch {}
        showToast(
          language === 'ta' ? 'உங்கள் கருத்துக்கு நன்றி!' : 'Thank you for your feedback!',
          'success'
        );
      } else {
        showToast(
          language === 'ta'
            ? 'புகார் மீண்டும் திறக்கப்பட்டு துறை கண்காணிப்பாளருக்கு அனுப்பப்பட்டது.'
            : 'Grievance reopened and escalated to senior administrator.',
          'warning'
        );
      }
    } catch (err: any) {
      setIsSubmittingFeedback(false);
      showToast(err.message || 'Failed to submit feedback', 'error');
    }
  };

  // Stepper calculations
  const steps: { key: GrievanceStatus; labelEn: string; labelTa: string }[] = [
    { key: 'Submitted', labelEn: 'Complaint Submitted', labelTa: 'புகார் பெறப்பட்டது' },
    { key: 'AI Classified', labelEn: 'AI Classified', labelTa: 'AI வகைப்படுத்தியது' },
    { key: 'Assigned', labelEn: 'Assigned to Officer', labelTa: 'அதிகாரிக்கு ஒதுக்கப்பட்டது' },
    { key: 'Under Review', labelEn: 'Site Inspection', labelTa: 'கள ஆய்வு' },
    { key: 'In Progress', labelEn: 'Work in Progress', labelTa: 'சரிசெய்யும் பணி' },
    { key: 'Resolved', labelEn: 'Resolved & Verified', labelTa: 'தீர்வு காணப்பட்டது' },
  ];

  const getStepStatus = (stepKey: GrievanceStatus) => {
    if (!grievance) return 'pending';
    if (grievance.status === 'Reopened') return 'reopened';

    const order: GrievanceStatus[] = [
      'Submitted',
      'AI Classified',
      'Assigned',
      'Under Review',
      'In Progress',
      'Resolved',
    ];

    const currentIndex = order.indexOf(grievance.status);
    const targetIndex = order.indexOf(stepKey);

    if (currentIndex > targetIndex || grievance.status === 'Resolved') return 'completed';
    if (currentIndex === targetIndex) return 'current';
    return 'pending';
  };

  const getPriorityBadgeClass = (priority: GrievancePriority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">{t.trackTitle}</h2>
          <p className="text-xs text-slate-500">{t.trackSub}</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t.trackInputPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm shrink-0"
          >
            {isLoading ? (language === 'ta' ? 'தேடுகிறது...' : 'Searching...') : t.btnSearchTrack}
          </button>
        </form>

        {/* Quick Sample IDs */}
        <div className="flex items-center space-x-2 pt-1 text-xs text-slate-500">
          <span>{language === 'ta' ? 'மாதிரி புகார் எண்கள்:' : 'Try sample IDs:'}</span>
          <button
            type="button"
            onClick={() => {
              setSearchInput('GRV-2026-00124');
              setTrackId('GRV-2026-00124');
              fetchGrievance('GRV-2026-00124');
            }}
            className="font-mono text-indigo-600 font-bold hover:underline"
          >
            GRV-2026-00124
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setSearchInput('GRV-2026-00125');
              setTrackId('GRV-2026-00125');
              fetchGrievance('GRV-2026-00125');
            }}
            className="font-mono text-indigo-600 font-bold hover:underline"
          >
            GRV-2026-00125
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setSearchInput('GRV-2026-00126');
              setTrackId('GRV-2026-00126');
              fetchGrievance('GRV-2026-00126');
            }}
            className="font-mono text-indigo-600 font-bold hover:underline"
          >
            GRV-2026-00126
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grievance Details Card */}
      {grievance && (
        <div className="space-y-6">
          {/* Top Grievance Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Header Badge Row */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-indigo-950">
                    {grievance.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadgeClass(grievance.priority)}`}>
                    ● {grievance.priority} Priority
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'ta' ? 'பதிவு செய்யப்பட்ட தேதி:' : 'Submitted on:'}{' '}
                  {new Date(grievance.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-lg text-slate-700 border border-slate-200">
                  {grievance.category}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                    grievance.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : grievance.status === 'In Progress'
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {grievance.status}
                </span>
              </div>
            </div>

            {/* Department & Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  {t.departmentLabel}
                </span>
                <div className="flex items-start space-x-2">
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{grievance.departmentName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Target Resolution:{' '}
                      {new Date(grievance.targetResolutionDate).toLocaleDateString('en-IN', {
                        dateStyle: 'medium',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  {t.locationLabel}
                </span>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {grievance.location.address}, {grievance.location.district}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {grievance.location.landmark ? `Landmark: ${grievance.location.landmark}` : `Ward: ${grievance.location.wardNumber || 'Zone 5'}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grievance Summary & AI Insights */}
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/60 space-y-2">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                {t.summaryLabel}
              </span>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                {language === 'ta' && grievance.summaryTa ? grievance.summaryTa : grievance.summaryEn}
              </p>
              {grievance.originalTranscript && (
                <div className="pt-2 border-t border-indigo-200/40">
                  <span className="text-[10px] text-slate-500 font-semibold block">
                    {language === 'ta' ? 'மூல குரல் பதிவு உரை:' : 'Original Spoken Transcript:'}
                  </span>
                  <p className="text-xs text-slate-600 italic mt-0.5">
                    "{grievance.originalTranscript}"
                  </p>
                </div>
              )}
            </div>

            {/* Assigned Officer Card (if assigned) */}
            {grievance.assignedOfficerName && (
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-800 rounded-xl text-amber-300">
                    <HardHat className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {t.officerDetailsTitle}
                    </span>
                    <p className="text-sm font-bold text-white">{grievance.assignedOfficerName}</p>
                    <p className="text-xs text-indigo-200">{grievance.assignedOfficerPhone}</p>
                  </div>
                </div>

                {grievance.assignedOfficerPhone && (
                  <a
                    href={`tel:${grievance.assignedOfficerPhone}`}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 self-start sm:self-auto transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{language === 'ta' ? 'அழைக்க' : 'Call Officer'}</span>
                  </a>
                )}
              </div>
            )}

            {/* Constituency MLA Escalation Profile */}
            {grievance.location.district && grievance.status !== 'Resolved' && grievance.status !== 'Rejected' && (
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                  <img 
                    src={grievance.location.constituency ? getMLAForConstituency(grievance.location.district, grievance.location.constituency).avatar : getMLAForDistrict(grievance.location.district).avatar} 
                    alt="MLA" 
                    className="w-10 h-10 rounded-full border-2 border-indigo-300 shadow-sm"
                  />
                  <div>
                    <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block">
                      {language === 'ta' ? 'சட்டமன்ற உறுப்பினர் (MLA)' : 'Constituency MLA'}
                    </span>
                    <p className="text-sm font-bold text-indigo-950">
                      {grievance.location.constituency ? getMLAForConstituency(grievance.location.district, grievance.location.constituency).name : getMLAForDistrict(grievance.location.district).name}
                    </p>
                    <p className="text-xs text-indigo-600 font-medium">
                      {grievance.location.constituency ? getMLAForConstituency(grievance.location.district, grievance.location.constituency).constituency : getMLAForDistrict(grievance.location.district).constituency} - {grievance.location.constituency ? getMLAForConstituency(grievance.location.district, grievance.location.constituency).party : getMLAForDistrict(grievance.location.district).party}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleMLAEscalation}
                  disabled={isEscalating || grievance.statusHistory.some(h => h.remarks.includes('ESCALATED'))}
                  className={`px-3.5 py-1.5 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all w-full sm:w-auto ${
                    grievance.statusHistory.some(h => h.remarks.includes('ESCALATED'))
                      ? 'bg-indigo-200 text-indigo-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>
                    {grievance.statusHistory.some(h => h.remarks.includes('ESCALATED'))
                      ? (language === 'ta' ? 'கவனத்திற்கு சென்றது' : 'Escalated')
                      : (language === 'ta' ? 'எம்.எல்.ஏ விற்கு தெரிவி' : 'Escalate to MLA')}
                  </span>
                </button>
              </div>
            )}

            {/* Attached Photo Evidence */}
            {grievance.attachments.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  {language === 'ta' ? 'குடிமக்கள் பதிவேற்றிய புகைப்படம்' : 'Citizen Attached Evidence'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {grievance.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-28 h-20 rounded-xl overflow-hidden border border-slate-300 shadow-2xs hover:opacity-90 transition-opacity"
                    >
                      <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ================= LIVE TRACKING PROGRESS ================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
            <h3 className="text-base font-bold text-slate-900 font-sans flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{language === 'ta' ? 'நிகழ்நேர கண்காணிப்பு' : 'Live Tracking Progress'}</span>
            </h3>

            {/* High-Fidelity Horizontal Stepper */}
            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
              <div className="flex items-center justify-between min-w-[700px] relative mt-2 px-6">
                {/* Connecting Line Background */}
                <div className="absolute top-5 left-6 right-6 h-1 bg-slate-100 -z-10 rounded-full" />
                
                {/* Connecting Line Active (Animated) */}
                <div 
                  className="absolute top-5 left-6 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `calc(${
                      Math.max(0, steps.findIndex(s => getStepStatus(s.key) === 'current') !== -1 
                        ? steps.findIndex(s => getStepStatus(s.key) === 'current') 
                        : (grievance.status === 'Resolved' ? steps.length - 1 : 0)
                      ) / (steps.length - 1) * 100
                    }% - 3rem)` 
                  }}
                />

                {steps.map((step, idx) => {
                  const status = getStepStatus(step.key);
                  const isCurrent = status === 'current';
                  const isCompleted = status === 'completed';
                  
                  let Icon = FileText;
                  if (step.key === 'AI Classified') Icon = Sparkles;
                  if (step.key === 'Assigned') Icon = UserCheck;
                  if (step.key === 'Under Review') Icon = Search;
                  if (step.key === 'In Progress') Icon = HardHat;
                  if (step.key === 'Resolved') Icon = CheckCircle2;

                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10 w-24">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 shadow-sm ${
                        isCompleted 
                          ? 'bg-indigo-600 border-indigo-100 text-white scale-100'
                          : isCurrent
                            ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-100 animate-pulse scale-110'
                            : 'bg-white border-slate-100 text-slate-300 scale-100'
                      }`}>
                        <Icon className={`w-4 h-4 ${isCurrent ? 'animate-bounce' : ''}`} />
                      </div>
                      <p className={`mt-3 text-[10px] sm:text-[11px] font-bold text-center leading-tight transition-colors duration-500 ${
                        isCurrent ? 'text-indigo-900' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        {language === 'ta' ? step.labelTa : step.labelEn}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Stepper Node List */}
            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 font-sans flex items-center space-x-2 mb-6">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{t.timelineTitle}</span>
              </h4>
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 before:z-0">
              {grievance.statusHistory.map((hist, idx) => {
                const isLast = idx === grievance.statusHistory.length - 1;
                const isResolved = hist.status === 'Resolved';
                
                return (
                <div key={idx} className="relative z-10 flex items-start space-x-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ring-4 ring-white shadow-xs ${
                    isResolved ? 'bg-emerald-600 text-white' : (isLast ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-600' : 'bg-indigo-600 text-white')
                  }`}>
                    {isResolved ? <Check className="w-4 h-4" /> : (isLast ? <Clock className="w-3.5 h-3.5" /> : <Check className="w-4 h-4" />)}
                  </div>

                  <div className={`flex-1 p-4 rounded-2xl border ${
                    isLast ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-200'
                  } space-y-1`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold ${isLast ? 'text-indigo-900' : 'text-slate-900'}`}>
                          {hist.status}
                        </span>
                        {isLast && !isResolved && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full">
                            {language === 'ta' ? 'தற்போதைய நிலை' : 'Current Status'}
                          </span>
                        )}
                        {isLast && isResolved && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                            {language === 'ta' ? 'நிறைவு' : 'Completed'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(hist.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed font-medium ${isLast ? 'text-indigo-800' : 'text-slate-600'}`}>
                      {hist.remarks}
                    </p>
                    <p className={`text-[10px] font-semibold mt-1 ${isLast ? 'text-indigo-600' : 'text-slate-500'}`}>
                      Updated by: {hist.updatedBy} ({hist.role})
                    </p>

                    {hist.evidenceUrl && (
                      <div className="pt-3 border-t border-slate-200/50 mt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                          {language === 'ta' ? 'தீர்வு புகைப்பட ஆதாரம்' : 'Resolution Proof Photo'}
                        </span>
                        <a
                          href={hist.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block w-24 h-16 rounded-lg overflow-hidden border border-slate-300 shadow-sm hover:opacity-80 transition-opacity"
                        >
                          <img src={hist.evidenceUrl} alt="proof" className="w-full h-full object-cover" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )})}
            </div>
            </div>
          </div>

          {/* ================= RESOLUTION FEEDBACK & REOPEN SECTION ================= */}
          {grievance.status === 'Resolved' && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-2 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base">{t.feedbackTitle}</h3>
              </div>

              <p className="text-xs text-slate-700">{t.feedbackPrompt}</p>

              {feedbackSubmitted ? (
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-emerald-800">
                      {isSatisfied ? '✓ Satisfied' : '✕ Reopened by Citizen'}
                    </span>
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {feedbackText && <p className="text-xs text-slate-600 italic">"{feedbackText}"</p>}
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  {/* Satisfaction Toggle */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSatisfied(true)}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                        isSatisfied
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.feedbackSatisfiedYes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSatisfied(false)}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                        !isSatisfied
                          ? 'bg-red-700 text-white border-red-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{t.feedbackSatisfiedNo}</span>
                    </button>
                  </div>

                  {/* Star Rating */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1.5">{t.rateExperience}</label>
                    <div className="flex items-center space-x-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Comment Box */}
                  <div>
                    <textarea
                      rows={2}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder={
                        language === 'ta'
                          ? 'உங்கள் கருத்துக்கள் அல்லது பிரச்சனையின் தற்போதைய நிலை...'
                          : 'Share your feedback or explain why further action is required...'
                      }
                      className="w-full p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    {isSubmittingFeedback
                      ? (language === 'ta' ? 'பதிவாகிறது...' : 'Submitting...')
                      : t.btnSubmitFeedback}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
