import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { AIAnalysisResponse, GrievanceCategory, GrievancePriority, DuplicateMatch } from '../types';
import { getConstituenciesForDistrict, getMLAForConstituency } from '../data/mlaProfiles';
import {
  Mic,
  FileText,
  Sparkles,
  MapPin,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Edit3,
  ShieldCheck,
  Building2,
  Clock,
  Send,
  User,
  Phone,
  Mail,
  X,
  FileCheck,
  ChevronRight,
  Eye,
  Landmark,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GrievanceFormProps {
  initialTranscript?: string;
  initialLanguage?: string;
  onOpenVoiceModal: () => void;
}

export const GrievanceForm: React.FC<GrievanceFormProps> = ({
  initialTranscript = '',
  initialLanguage = 'Tamil',
  onOpenVoiceModal,
}) => {
  const { language, t, navigateToTrack, showToast, triggerRefresh, user } = useApp();

  // Wizard Step: 1 = Input & Evidence, 2 = AI Scanning Loader, 3 = Citizen Confirmation, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [complaintText, setComplaintText] = useState(initialTranscript);
  const [selectedLanguage, setSelectedLanguage] = useState<'Tamil' | 'English'>(
    initialLanguage === 'English' ? 'English' : 'Tamil'
  );

  // Citizen details
  const [citizenName, setCitizenName] = useState('Sundararajan M.');
  const [citizenPhone, setCitizenPhone] = useState('+91 98401 55920');
  const [citizenEmail, setCitizenEmail] = useState('sundar.m@tncitizen.in');

  // Location details
  const [district, setDistrict] = useState('Chennai');
  const [constituency, setConstituency] = useState('Chepauk-Thiruvallikeni');
  const [address, setAddress] = useState('No. 42, Kamarajar Salai, Triplicane');
  const [landmark, setLandmark] = useState('Opposite Marina Beach Light House');
  const [wardNumber, setWardNumber] = useState('Ward 114');
  const [pincode, setPincode] = useState('600005');
  const [isLocating, setIsLocating] = useState(false);

  const availableConstituencies = useMemo(() => getConstituenciesForDistrict(district), [district]);
  
  useEffect(() => {
    if (!availableConstituencies.includes(constituency)) {
      setConstituency(availableConstituencies[0]);
    }
  }, [district, availableConstituencies, constituency]);

  // Attachments
  const [attachments, setAttachments] = useState<
    Array<{ id: string; url: string; name: string; type: 'image' | 'audio' | 'document'; uploadedAt: string }>
  >([]);

  // AI Analysis Results
  const [aiResult, setAiResult] = useState<AIAnalysisResponse | null>(null);
  const [analyzingStepIndex, setAnalyzingStepIndex] = useState(0);

  // Editable overrides on Confirmation screen
  const [editedCategory, setEditedCategory] = useState<GrievanceCategory>('Street Light');
  const [editedPriority, setEditedPriority] = useState<GrievancePriority>('Medium');
  const [editedDepartment, setEditedDepartment] = useState<string>('Civic Services');
  const [editedSummary, setEditedSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registered Grievance output
  const [registeredId, setRegisteredId] = useState('');

  // Duplicate warning modal
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // When initialTranscript changes from Voice Modal
  React.useEffect(() => {
    if (initialTranscript) {
      setComplaintText(initialTranscript);
    }
  }, [initialTranscript]);

  // GPS Location Locator
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showToast(
        language === 'ta'
          ? 'உங்கள் உலாவியில் GPS ஆதரிக்கப்படவில்லை'
          : 'Geolocation is not supported by your browser',
        'warning'
      );
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setDistrict('Chennai');
        setAddress(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}, Anna Nagar Sector 2`);
        setLandmark('GPS Pinpoint Location');
        showToast(
          language === 'ta' ? 'GPS இருப்பிடம் வெற்றிகரமாக பெறப்பட்டது' : 'GPS location pinned successfully',
          'success'
        );
      },
      (err) => {
        setIsLocating(false);
        showToast(
          language === 'ta'
            ? 'இருப்பிட அணுகல் மறுக்கப்பட்டது. முகவரியை கைமுறையாக உள்ளிடலாம்.'
            : 'GPS location access denied. You can enter the street address manually.',
          'info'
        );
      },
      { timeout: 8000 }
    );
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const newAttachment = {
          id: `att-${Date.now()}`,
          url: event.target.result as string,
          name: file.name,
          type: 'image' as const,
          uploadedAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, newAttachment]);
        showToast(
          language === 'ta' ? 'புகைப்பட ஆதாரம் இணைக்கப்பட்டது' : 'Photo evidence uploaded',
          'success'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 1 -> Step 2: Trigger AI Analysis
  const handleStartAnalysis = async () => {
    if (!complaintText.trim()) {
      showToast(
        language === 'ta'
          ? 'தயவுசெய்து புகாரின் விவரத்தை குரல் அல்லது எழுத்து மூலம் பதிவு செய்யவும்'
          : 'Please enter or speak your complaint description first',
        'warning'
      );
      return;
    }

    setStep(2); // Show AI scanner
    setAnalyzingStepIndex(0);

    const stepInterval = setInterval(() => {
      setAnalyzingStepIndex((prev) => (prev < 4 ? prev + 1 : prev));
    }, 450);

    try {
      // 1. Call Gemini AI API
      const result = await api.analyzeComplaint(complaintText, selectedLanguage);
      clearInterval(stepInterval);
      setAiResult(result);
      setEditedCategory(result.category);
      setEditedPriority(result.priority);
      setEditedDepartment(result.department);
      setEditedSummary(language === 'ta' && result.summaryTamil ? result.summaryTamil : result.summary);

      // 2. Check for duplicate complaints in background
      const dupes = await api.checkDuplicates(complaintText, result.category, district);
      if (dupes.length > 0) {
        setDuplicateMatches(dupes);
        setShowDuplicateModal(true);
      }

      setStep(3); // Show Citizen Confirmation
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('AI Analysis failed:', err);
      showToast('AI analysis failed. Please check network and try again.', 'error');
      setStep(1);
    }
  };

  // Step 3 -> Step 4: Final Submission to Database
  const handleConfirmAndRegister = async () => {
    if (!aiResult) return;
    setIsSubmitting(true);

    try {
      const payload = {
        citizenId: user?.uid || 'anonymous',
        citizenName,
        citizenPhone,
        citizenEmail,
        language: aiResult.language,
        originalTranscript: complaintText,
        summaryEn: aiResult.summary,
        summaryTa: aiResult.summaryTamil || editedSummary,
        category: editedCategory,
        departmentId: editedDepartment.toLowerCase().replace(/\s+/g, '-'),
        departmentName: editedDepartment,
        priority: editedPriority,
        priorityReason: aiResult.priorityReason,
        confidenceScore: aiResult.confidence,
        location: {
          address: address || 'Main City Area',
          landmark: landmark || '',
          district: district || 'Chennai',
          constituency: constituency || '',
          wardNumber: wardNumber || '',
          pincode: pincode || '',
          lat: 13.0827,
          lng: 80.2707,
        },
        attachments,
        entities: aiResult.entities || {},
        estimatedDays: aiResult.estimatedDays || 3,
      };

      const created = await api.createComplaint(payload);
      setRegisteredId(created.id);
      setIsSubmitting(false);
      setStep(4);
      triggerRefresh();

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // confetti fallback
      }

      showToast(
        language === 'ta'
          ? `புகார் ${created.id} வெற்றிகரமாகப் பதிவு செய்யப்பட்டது!`
          : `Grievance ${created.id} registered successfully!`,
        'success'
      );
    } catch (err: any) {
      setIsSubmitting(false);
      showToast(err.message || 'Failed to submit grievance', 'error');
    }
  };

  const getPriorityBadgeClass = (priority: GrievancePriority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300 ring-2 ring-red-400/20';
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
      {/* Wizard Step Progress Tracker */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
          <div
            className={`p-2 rounded-xl transition-all ${
              step === 1 ? 'bg-blue-800 text-white shadow-xs' : step > 1 ? 'bg-emerald-50 text-emerald-800' : 'text-slate-400 bg-slate-50'
            }`}
          >
            {t.stepInput}
          </div>
          <div
            className={`p-2 rounded-xl transition-all ${
              step === 2 ? 'bg-blue-800 text-white shadow-xs' : step > 2 ? 'bg-emerald-50 text-emerald-800' : 'text-slate-400 bg-slate-50'
            }`}
          >
            {t.stepAnalysis}
          </div>
          <div
            className={`p-2 rounded-xl transition-all ${
              step === 3 ? 'bg-blue-800 text-white shadow-xs' : step > 3 ? 'bg-emerald-50 text-emerald-800' : 'text-slate-400 bg-slate-50'
            }`}
          >
            {t.stepConfirmation}
          </div>
          <div
            className={`p-2 rounded-xl transition-all ${
              step === 4 ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-400 bg-slate-50'
            }`}
          >
            {t.stepSuccess}
          </div>
        </div>
      </div>

      {/* Duplicate Warning Modal Overlay */}
      {showDuplicateModal && duplicateMatches.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-amber-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-800">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-base">
                  {language === 'ta' ? 'இதே போன்ற முந்தைய புகார் கண்டறியப்பட்டது' : 'Similar Active Grievance Found'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ta'
                    ? 'உங்கள் பகுதியில் ஏற்கனவே இதே பிரச்சனை பதிவு செய்யப்பட்டுள்ளது'
                    : 'A citizen recently filed a similar issue in this neighborhood'}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 space-y-2 text-xs">
              {duplicateMatches.map((d) => (
                <div key={d.id} className="bg-white p-2.5 rounded-lg border border-amber-200/60 flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-700">{d.id}</span>
                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {d.status}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium mt-1">{d.summary}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{d.location}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDuplicateModal(false);
                      navigateToTrack(d.id);
                    }}
                    className="shrink-0 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-md font-bold text-[11px] transition-colors"
                  >
                    {language === 'ta' ? 'கண்காணிக்க' : 'Track'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors"
              >
                {language === 'ta' ? 'புதிய புகாராக தொடரவும்' : 'Continue as New Grievance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 1: INPUT & CITIZEN DETAILS ================= */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
          {/* Header Action Banner */}
          <div className="flex justify-between items-end pb-5 shrink-0">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 font-sans">
                {language === 'ta' ? 'புதிய பொதுமக்கள் குறைதீர்ப்பு பதிவு' : 'AI Grievance Assistant'}
              </h2>
              <p className="text-slate-500 mt-1">
                {language === 'ta'
                  ? 'குரல் அல்லது எழுத்து மூலம் தமிழில்/ஆங்கிலத்தில் விவரிக்கவும்'
                  : 'File your complaint using voice or text in Tamil or English.'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedLanguage('English')}
                className={`px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium transition-colors ${
                  selectedLanguage === 'English' ? 'bg-indigo-600 text-white border-transparent' : 'bg-white hover:bg-slate-50 text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage('Tamil')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLanguage === 'Tamil' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-900'
                }`}
              >
                தமிழ் (Tamil)
              </button>
            </div>
          </div>

          {/* Grievance Description Field */}
          <div className="flex flex-col h-full">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              {language === 'ta' ? 'புகாரின் முழு விவரம் *' : 'Grievance Input'}
            </label>

            <div className="relative flex-1 bg-slate-50 rounded-xl p-4 border-2 border-dashed border-slate-200 flex flex-col">
              <textarea
                rows={4}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder={
                  language === 'ta'
                    ? 'எ.கா: எங்கள் பகுதியில் கடந்த ஒரு வாரமாக தெருவிளக்கு வேலை செய்யவில்லை...'
                    : 'Type your complaint here or click the mic to speak...'
                }
                className="flex-1 bg-transparent border-none focus:ring-0 text-lg resize-none text-slate-700 placeholder-slate-400 w-full"
              />
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={onOpenVoiceModal}
                  className="w-20 h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 group transition-all transform active:scale-95"
                >
                  <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-3 font-medium uppercase tracking-widest">
                Tap to Speak / பேச தட்டவும்
              </p>
            </div>
          </div>

          {/* Citizen Details Form Section */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <User className="w-4 h-4 text-blue-700" />
              <span>{t.citizenDetailsTitle}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.fullName} *</label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.mobileNumber} *</label>
                <input
                  type="text"
                  value={citizenPhone}
                  onChange={(e) => setCitizenPhone(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.emailAddress}</label>
                <input
                  type="email"
                  value={citizenEmail}
                  onChange={(e) => setCitizenEmail(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Location & Ward Section */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {language === 'ta' ? 'சம்பவ இடம் மற்றும் முகவரி' : 'Incident Location & Ward'}
              </h3>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isLocating}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center space-x-1 transition-all hover:bg-indigo-100"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{isLocating ? (language === 'ta' ? 'GPS தேடுகிறது...' : 'Pinning GPS...') : (language === 'ta' ? 'GPS மூலம் கண்டறிக' : 'Auto-Detect via GPS')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.districtLabel} *</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                >
                  <option value="Ariyalur">Ariyalur (அரியலூர்)</option>
                  <option value="Chengalpattu">Chengalpattu (செங்கல்பட்டு)</option>
                  <option value="Chennai">Chennai (சென்னை)</option>
                  <option value="Coimbatore">Coimbatore (கோயம்புத்தூர்)</option>
                  <option value="Cuddalore">Cuddalore (கடலூர்)</option>
                  <option value="Dharmapuri">Dharmapuri (தருமபுரி)</option>
                  <option value="Dindigul">Dindigul (திண்டுக்கல்)</option>
                  <option value="Erode">Erode (ஈரோடு)</option>
                  <option value="Kallakurichi">Kallakurichi (கள்ளக்குறிச்சி)</option>
                  <option value="Kanchipuram">Kanchipuram (காஞ்சிபுரம்)</option>
                  <option value="Kanyakumari">Kanyakumari (கன்னியாகுமரி)</option>
                  <option value="Karur">Karur (கரூர்)</option>
                  <option value="Krishnagiri">Krishnagiri (கிருஷ்ணகிரி)</option>
                  <option value="Madurai">Madurai (மதுரை)</option>
                  <option value="Mayiladuthurai">Mayiladuthurai (மயிலாடுதுறை)</option>
                  <option value="Nagapattinam">Nagapattinam (நாகப்பட்டினம்)</option>
                  <option value="Namakkal">Namakkal (நாமக்கல்)</option>
                  <option value="Nilgiris">Nilgiris (நீலகிரி)</option>
                  <option value="Perambalur">Perambalur (பெரம்பலூர்)</option>
                  <option value="Pudukkottai">Pudukkottai (புதுக்கோட்டை)</option>
                  <option value="Ramanathapuram">Ramanathapuram (இராமநாதபுரம்)</option>
                  <option value="Ranipet">Ranipet (இராணிப்பேட்டை)</option>
                  <option value="Salem">Salem (சேலம்)</option>
                  <option value="Sivaganga">Sivaganga (சிவகங்கை)</option>
                  <option value="Tenkasi">Tenkasi (தென்காசி)</option>
                  <option value="Thanjavur">Thanjavur (தஞ்சாவூர்)</option>
                  <option value="Theni">Theni (தேனி)</option>
                  <option value="Thoothukudi">Thoothukudi (தூத்துக்குடி)</option>
                  <option value="Tiruchirappalli">Tiruchirappalli (திருச்சிராப்பள்ளி)</option>
                  <option value="Tirunelveli">Tirunelveli (திருநெல்வேலி)</option>
                  <option value="Tirupathur">Tirupathur (திருப்பத்தூர்)</option>
                  <option value="Tiruppur">Tiruppur (திருப்பூர்)</option>
                  <option value="Tiruvallur">Tiruvallur (திருவள்ளூர்)</option>
                  <option value="Tiruvannamalai">Tiruvannamalai (திருவண்ணாமலை)</option>
                  <option value="Tiruvarur">Tiruvarur (திருவாரூர்)</option>
                  <option value="Vellore">Vellore (வேலூர்)</option>
                  <option value="Viluppuram">Viluppuram (விழுப்புரம்)</option>
                  <option value="Virudhunagar">Virudhunagar (விருதுநகர்)</option>
                </select>
              </div>

              <div className="relative">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {language === 'ta' ? 'சட்டமன்ற தொகுதி' : 'Constituency (Search)'} *
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    list="constituencies-list"
                    value={constituency}
                    onChange={(e) => setConstituency(e.target.value)}
                    placeholder={language === 'ta' ? 'தொகுதியை தேடுங்கள்...' : 'Search constituency...'}
                    className="w-full pl-9 p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                  />
                  <datalist id="constituencies-list">
                    {availableConstituencies.map((c) => {
                      const mla = getMLAForConstituency(district, c);
                      const extraSearchTerms = [
                        ...(mla.pincodes || []),
                        ...(mla.locations || [])
                      ].join(', ');
                      
                      return (
                        <option key={c} value={c}>
                          {mla.name} ({mla.party}) {extraSearchTerms ? `- ${extraSearchTerms}` : ''}
                        </option>
                      );
                    })}
                  </datalist>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={getMLAForConstituency(district, constituency).avatar} 
                  alt="MLA Avatar" 
                  className="w-10 h-10 rounded-full border border-indigo-200 shadow-sm"
                />
                <div>
                  <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">
                    {language === 'ta' ? 'உங்கள் தொகுதி சட்டமன்ற உறுப்பினர்' : 'Your Constituency MLA'}
                  </span>
                  <p className="text-sm font-bold text-indigo-950">
                    {getMLAForConstituency(district, constituency).name} <span className="text-xs text-indigo-700 font-medium">({getMLAForConstituency(district, constituency).party})</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                    {getMLAForConstituency(district, constituency).officeAddress}
                  </p>
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 sm:gap-1 shrink-0">
                <a href={`tel:${getMLAForConstituency(district, constituency).phone}`} className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-white px-2 py-1 rounded-md border border-indigo-100 shadow-sm">
                  <Phone className="w-3 h-3" />
                  <span>{getMLAForConstituency(district, constituency).phone}</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.wardLabel}</label>
                <input
                  type="text"
                  value={wardNumber}
                  onChange={(e) => setWardNumber(e.target.value)}
                  placeholder="e.g. Ward 104 / Zone 8"
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 600040"
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.locationLabel} *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, door number, area"
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">{t.landmarkLabel}</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Near temple, school, ration shop, park..."
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Photo Evidence Upload */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Camera className="w-4 h-4 text-blue-700" />
              <span>{t.evidenceTitle}</span>
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 p-4 rounded-2xl flex items-center space-x-3 transition-all text-slate-600">
                <UploadCloud className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {language === 'ta' ? 'புகைப்படம் பதிவேற்ற' : 'Upload Evidence Photo'}
                  </p>
                  <p className="text-[10px] text-slate-500">{t.evidenceHelper}</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {/* Uploaded Thumbnails */}
              {attachments.map((att) => (
                <div key={att.id} className="relative w-16 h-16 rounded-xl border border-slate-300 overflow-hidden group">
                  <img src={att.url} alt="evidence" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                    className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleStartAnalysis}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-950/20 flex items-center space-x-2 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{language === 'ta' ? 'AI பகுப்பாய்வு செய்க' : 'Analyze Grievance with AI'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: AI SCANNING RADAR LOADER ================= */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center space-y-6 animate-in fade-in">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-linear-to-tr from-blue-900 via-indigo-800 to-blue-600 flex items-center justify-center text-amber-300 shadow-xl shadow-blue-900/30 animate-pulse">
            <Sparkles className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-900 font-sans">{t.analyzingTitle}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Gemini 3.7 Flash Engine (NLP Multilingual Parser)
            </p>
          </div>

          <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2.5 text-xs">
            <div className={`flex items-center space-x-2 ${analyzingStepIndex >= 0 ? 'text-blue-800 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className={`w-4 h-4 ${analyzingStepIndex >= 0 ? 'text-blue-600' : 'text-slate-300'}`} />
              <span>{t.analyzingStep1}</span>
            </div>
            <div className={`flex items-center space-x-2 ${analyzingStepIndex >= 1 ? 'text-blue-800 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className={`w-4 h-4 ${analyzingStepIndex >= 1 ? 'text-blue-600' : 'text-slate-300'}`} />
              <span>{t.analyzingStep2}</span>
            </div>
            <div className={`flex items-center space-x-2 ${analyzingStepIndex >= 2 ? 'text-blue-800 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className={`w-4 h-4 ${analyzingStepIndex >= 2 ? 'text-blue-600' : 'text-slate-300'}`} />
              <span>{t.analyzingStep3}</span>
            </div>
            <div className={`flex items-center space-x-2 ${analyzingStepIndex >= 3 ? 'text-blue-800 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className={`w-4 h-4 ${analyzingStepIndex >= 3 ? 'text-blue-600' : 'text-slate-300'}`} />
              <span>{t.analyzingStep4}</span>
            </div>
            <div className={`flex items-center space-x-2 ${analyzingStepIndex >= 4 ? 'text-blue-800 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className={`w-4 h-4 ${analyzingStepIndex >= 4 ? 'text-blue-600' : 'text-slate-300'}`} />
              <span>{t.analyzingStep5}</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 3: CITIZEN CONFIRMATION REVIEW ================= */}
      {step === 3 && aiResult && (
        <div className="flex flex-col md:flex-row gap-6 animate-in fade-in h-full">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                AI Intelligence Analysis
              </label>
              <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                Confidence: {Math.round((aiResult.confidence || 0.96) * 100)}%
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-50 pb-3 items-center">
                <span className="text-sm text-slate-500">Detected Category</span>
                <select
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value as GrievanceCategory)}
                  className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-0 text-right pr-0"
                >
                  <option value="Street Light">Street Light</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Roads & Potholes">Roads & Potholes</option>
                  <option value="Sanitation & Drainage">Sanitation & Drainage</option>
                  <option value="Electricity & Power">Electricity & Power</option>
                  <option value="Public Health & Fogging">Public Health & Fogging</option>
                  <option value="Transport & Traffic">Transport & Traffic</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-between border-b border-slate-50 pb-3 items-center">
                <span className="text-sm text-slate-500">Department</span>
                <select
                  value={editedDepartment}
                  onChange={(e) => setEditedDepartment(e.target.value)}
                  className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-0 pr-0 text-right max-w-[200px]"
                >
                  <option value={aiResult.department}>{aiResult.department}</option>
                  <option value="Civic Services">Civic Services</option>
                  <option value="Urban Lighting & Street Infrastructure Wing">Urban Lighting & Street Infrastructure Wing</option>
                  <option value="Municipal Water Supply & Drainage Board">Municipal Water Supply & Drainage Board</option>
                  <option value="Tamil Nadu Generation & Distribution Corp">Tamil Nadu Generation & Distribution Corp</option>
                  <option value="Solid Waste Management & Public Sanitation">Solid Waste Management & Public Sanitation</option>
                  <option value="Highways & Municipal Works Department">Highways & Municipal Works Department</option>
                  <option value="Public Health & Fogging Department">Public Health & Fogging Department</option>
                </select>
              </div>

              <div className="flex justify-between border-b border-slate-50 pb-3 items-center">
                <span className="text-sm text-slate-500">Priority</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${editedPriority === 'Critical' ? 'bg-red-500' : editedPriority === 'High' ? 'bg-orange-400' : editedPriority === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                  <select
                    value={editedPriority}
                    onChange={(e) => setEditedPriority(e.target.value as GrievancePriority)}
                    className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-0 pr-0"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between border-b border-slate-50 pb-3">
                <span className="text-sm text-slate-500">Auto Summary</span>
                <textarea
                  rows={2}
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="text-sm font-semibold text-slate-800 text-right max-w-[240px] bg-transparent border-none focus:ring-0 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 flex-1 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-lg mb-2">Ready to Submit?</h4>
              <p className="text-indigo-200 text-sm">
                AI has successfully classified your grievance. Please confirm the details to receive your tracking ID.
              </p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-indigo-800 hover:bg-indigo-700 rounded-xl font-semibold text-sm transition-colors border border-indigo-700"
              >
                Modify
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmAndRegister}
                className="flex-1 py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-bold text-sm transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <span>Confirm & Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 4: SUCCESS REGISTRATION SCREEN ================= */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-600/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-sans">
              {t.successTitle}
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              {t.successSub}
            </p>
          </div>

          {/* Grievance ID Banner Card */}
          <div className="max-w-md mx-auto bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800 space-y-2">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {t.grievanceIdLabel}
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-300">
              {registeredId}
            </p>
            <p className="text-[11px] text-slate-400">
              {t.keepIdSafe}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigateToTrack(registeredId)}
              className="w-full sm:w-auto px-6 py-3 bg-blue-800 hover:bg-blue-900 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-900/20 flex items-center justify-center space-x-2 transition-all hover:scale-105"
            >
              <Eye className="w-4 h-4" />
              <span>{t.btnTrackNow}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setComplaintText('');
                setAttachments([]);
                setAiResult(null);
                setStep(1);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 transition-colors"
            >
              {t.btnFileAnother}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
