import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { VoiceInputModal } from './components/VoiceInputModal';
import { GrievanceForm } from './components/GrievanceForm';
import { CitizenTracker } from './components/CitizenTracker';
import { CitizenHistory } from './components/CitizenHistory';
import { AdminDashboard } from './components/AdminDashboard';
import { OfficerPortal } from './components/OfficerPortal';
import { AnalyticsView } from './components/AnalyticsView';
import { MLADirectory } from './components/MLADirectory';
import { InteractiveMap } from './components/InteractiveMap';
import {
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  HelpCircle,
  Globe,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { language, t, activeTab, setActiveTab, toasts, removeToast } = useApp();

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [initialVoiceTranscript, setInitialVoiceTranscript] = useState('');
  const [initialVoiceLang, setInitialVoiceLang] = useState('Tamil');

  const handleVoiceTranscriptConfirmed = (transcript: string, langHint: string) => {
    setInitialVoiceTranscript(transcript);
    setInitialVoiceLang(langHint);
    setActiveTab('file');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 flex flex-col justify-between selection:bg-indigo-600 selection:text-white overflow-hidden">
      {/* Toast Notification Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start space-x-3 animate-in fade-in slide-in-from-top-4 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-900 text-red-50 border-red-700'
                : toast.type === 'warning'
                ? 'bg-amber-900 text-amber-50 border-amber-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <p className="text-xs font-medium leading-snug flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Voice Recognition Modal */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscriptConfirmed={handleVoiceTranscriptConfirmed}
      />

      {/* Global State Header */}
      <Header />

      {/* Main Dynamic View Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col space-y-8 overflow-y-auto">
        {activeTab === 'home' && (
          <div className="space-y-12 animate-in fade-in duration-300">
            <HeroSection
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onSelectCategory={(cat) => {
                setInitialVoiceTranscript('');
                setActiveTab('file');
              }}
            />
            <InteractiveMap />
          </div>
        )}

        {activeTab === 'file' && (
          <div className="animate-in fade-in duration-300">
            <GrievanceForm
              initialTranscript={initialVoiceTranscript}
              initialLanguage={initialVoiceLang}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'track' && (
          <div className="animate-in fade-in duration-300">
            <CitizenTracker />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-300">
            <CitizenHistory />
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="animate-in fade-in duration-300">
            <AdminDashboard />
          </div>
        )}

        {activeTab === 'officer' && (
          <div className="animate-in fade-in duration-300">
            <OfficerPortal />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-300">
            <AnalyticsView />
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="animate-in fade-in duration-300">
            <MLADirectory />
          </div>
        )}
      </main>

      {/* Government Standard Footer */}
      <footer className="bg-white text-slate-400 text-xs border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
                <span className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-serif">
                  நி
                </span>
                <span>NivaranAI Grievance Portal</span>
              </div>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                {language === 'ta'
                  ? 'தமிழ்நாடு அரசு மின்னாளுமை முகமை மற்றும் பொதுமக்கள் குறைதீர்ப்பு இயக்ககத்தின் AI சார்ந்த குறைதீர்ப்பு தளம்.'
                  : 'Tamil Nadu e-Governance Agency (TNeGA) & Public Grievance Redressal Directorate AI Redressal Platform.'}
              </p>
              <p className="text-[11px] text-slate-500">
                Powered by Google Gemini 3.7 Multilingual Models.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
                {language === 'ta' ? 'அவசர உதவி எண்கள்' : 'Emergency Hotlines'}
              </h4>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-green-500" />
                  <span>CM Helpline: <strong>1100</strong> (Toll Free)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Chennai GCC Helpline: <strong>1913</strong></span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-orange-500" />
                  <span>TNEB Electricity Minnagam: <strong>94987 94987</strong></span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
                {language === 'ta' ? 'அணுகல்தன்மை & பாதுகாப்பு' : 'Accessibility & Privacy'}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Designed under the Guidelines for Indian Government Websites (GIGW) & ISO/IEC 27001 Security Standards.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-medium uppercase tracking-widest gap-2">
            <p>© 2026 Government of Tamil Nadu. All Rights Reserved.</p>
            <p>NivaranAI Grievance Management System v2.4 (Production)</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
