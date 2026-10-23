import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  ShieldAlert, Clock, MapPin, Camera, ThumbsUp, QrCode,
  Flame, Building2, Award, Volume2
} from 'lucide-react';

type ClusterIssue = {
  id: string;
  title: string;
  titleTa: string;
  district: string;
  ward: string;
  department: string;
  supporters: number;
  slaRemainingHours: number;
  escalationLevel: 1 | 2 | 3;
  beforeImg: string;
  afterImg?: string;
  status: 'In Progress' | 'Awaiting Citizen OTP' | 'Escalated to Secretariat';
};

const INITIAL_CLUSTERS: ClusterIssue[] = [
  {
    id: 'DEMO-TN-001',
    title: 'Drinking water pipeline and road damage (sample)',
    titleTa: 'குடிநீர் குழாய் மற்றும் சாலை சேதம் (மாதிரி)',
    district: 'Chennai',
    ward: 'Sample ward',
    department: 'Municipal Water Supply',
    supporters: 48,
    slaRemainingHours: 6,
    escalationLevel: 2,
    beforeImg: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    afterImg: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80',
    status: 'Awaiting Citizen OTP'
  },
  {
    id: 'DEMO-TN-002',
    title: 'Low-hanging electrical cable near a school (sample)',
    titleTa: 'பள்ளி அருகே தாழ்வாகத் தொங்கும் மின்கம்பி (மாதிரி)',
    district: 'Coimbatore',
    ward: 'Sample ward',
    department: 'Electricity Department',
    supporters: 112,
    slaRemainingHours: 2,
    escalationLevel: 3,
    beforeImg: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80',
    status: 'Escalated to Secretariat'
  }
];

const SAMPLE_LEADERBOARD = [
  { district: 'Chennai', resolvedRate: 96.4, avgHours: 14 },
  { district: 'Coimbatore', resolvedRate: 95.1, avgHours: 16 },
  { district: 'Madurai', resolvedRate: 93.8, avgHours: 19 },
  { district: 'Tiruchirappalli', resolvedRate: 94.5, avgHours: 17 }
];

export default function CivicPowerFeatures({ language = 'en' }: { language?: 'en' | 'ta' }) {
  const [clusters, setClusters] = useState<ClusterIssue[]>(INITIAL_CLUSTERS);
  const [upvotedIds, setUpvotedIds] = useState<Record<string, boolean>>({});
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  const handleUpvote = (id: string) => {
    if (upvotedIds[id]) return;
    setUpvotedIds(prev => ({ ...prev, [id]: true }));
    setClusters(prev => prev.map(item => item.id === id ? { ...item, supporters: item.supporters + 1 } : item));
  };

  const speakStatus = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const verifyOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOtpMessage('Demo only: connect a server-verified OTP service before allowing petition closure.');
    // Deliberately do not mark the grievance as verified using client-side input alone.
  };

  return (
    <section className="border-t border-white/10 bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="rounded-2xl border border-amber-500/25 bg-slate-900/70 p-5">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3.5">
              <div className={`rounded-xl p-3 ${emergencyMode ? 'animate-pulse bg-red-500 text-white' : 'bg-amber-500/15 text-amber-400'}`}><Flame className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">{emergencyMode ? 'DEMO: EMERGENCY MODE ACTIVE' : 'CIVIC RESILIENCE • DEMO'}</p>
                <h2 className="mt-1 text-lg font-bold">{language === 'ta' ? 'பருவமழை மற்றும் அவசரநிலை முன்னுரிமை' : 'Monsoon, power-line and emergency fast-track'}</h2>
                <p className="mt-1 text-sm text-slate-300">{emergencyMode ? 'This visual demo highlights life-safety categories; it does not contact emergency services or change official routing.' : 'Demo toggle only. For real emergencies, contact the relevant official emergency service directly.'}</p>
              </div>
            </div>
            <button type="button" onClick={() => setEmergencyMode(v => !v)} className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold ${emergencyMode ? 'bg-white text-red-950' : 'border border-red-500/30 bg-red-500/20 text-red-200 hover:bg-red-500 hover:text-white'}`}>{emergencyMode ? 'Disable demo mode' : 'Simulate SOS mode'}</button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Community issue clusters • sample data</p>
            <h2 className="mt-1 text-2xl font-extrabold">{language === 'ta' ? 'மக்கள் மனுக்கள் மற்றும் தீர்வு ஆதாரங்கள்' : 'Clustered petitions & resolution evidence'}</h2>
            <p className="mt-2 text-xs text-slate-400">All records, images, counts, statuses and SLA values below are illustrative. GPS validation, official status, duplicate detection and OTP verification require backend services.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {clusters.map(issue => (
              <article key={issue.id} className="flex flex-col justify-between space-y-5 rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-xl">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-md border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-bold text-amber-400">{issue.id}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => speakStatus(language === 'ta' ? issue.titleTa : issue.title)} aria-label="Read issue aloud" className="rounded-lg bg-white/5 p-1.5 text-slate-300 hover:text-amber-400"><Volume2 className="h-4 w-4" /></button>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${issue.escalationLevel === 3 ? 'border-red-500/30 bg-red-500/20 text-red-300' : 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'}`}><ShieldAlert className="h-3.5 w-3.5" />Tier {issue.escalationLevel}: {issue.status}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold leading-snug">{language === 'ta' ? issue.titleTa : issue.title}</h3>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-amber-400" />{issue.district} • {issue.ward}</span>
                    <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-emerald-400" />{issue.department}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-300"><Clock className="h-3.5 w-3.5" />Sample SLA: {issue.slaRemainingHours}h</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative h-36 overflow-hidden rounded-xl border border-white/10 bg-slate-950">
                    <img src={issue.beforeImg} alt="Illustrative before evidence" className="h-full w-full object-cover opacity-85" loading="lazy" />
                    <span className="absolute left-2 top-2 rounded border border-red-400/30 bg-slate-950/90 px-2 py-0.5 text-[10px] font-bold text-red-300">SAMPLE BEFORE</span>
                  </div>
                  <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-950">
                    {issue.afterImg ? <><img src={issue.afterImg} alt="Illustrative after evidence" className="h-full w-full object-cover opacity-90" loading="lazy" /><span className="absolute left-2 top-2 rounded border border-emerald-400/30 bg-slate-950/90 px-2 py-0.5 text-[10px] font-bold text-emerald-300">SAMPLE AFTER</span></> : <div className="space-y-1 p-3 text-center"><Camera className="mx-auto h-6 w-6 text-slate-500" /><p className="text-[11px] text-slate-400">Awaiting officer evidence (demo)</p></div>}
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-slate-950/90 p-3">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-semibold sm:text-[11px]"><span className="text-emerald-400">1. Ward team</span><span className={issue.escalationLevel >= 2 ? 'text-amber-400' : 'text-slate-500'}>2. District</span><span className={issue.escalationLevel === 3 ? 'font-bold text-red-400' : 'text-slate-500'}>3. Secretariat</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${issue.escalationLevel === 3 ? 'w-full bg-red-500' : issue.escalationLevel === 2 ? 'w-2/3 bg-amber-400' : 'w-1/3 bg-emerald-400'}`} /></div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <button type="button" onClick={() => handleUpvote(issue.id)} className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold ${upvotedIds[issue.id] ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300' : 'border-white/10 bg-white/5 hover:bg-amber-500 hover:text-slate-950'}`}><ThumbsUp className="h-3.5 w-3.5" />{upvotedIds[issue.id] ? 'Demo vote recorded' : 'Affects me too'} • {issue.supporters} sample supporters</button>
                  {issue.afterImg ? <form onSubmit={verifyOtp} className="flex flex-wrap items-center gap-2"><input aria-label="OTP (demo)" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))} placeholder="OTP (demo)" className="w-24 rounded-lg border border-white/15 bg-slate-950 px-2.5 py-1.5 text-xs text-white" /><button type="submit" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400">Request verify</button></form> : <span className="inline-flex items-center gap-1 text-xs text-slate-400"><QrCode className="h-3.5 w-3.5 text-amber-400" />Demo receipt</span>}
                </div>
                {otpMessage && <p role="status" className="text-xs text-amber-300">{otpMessage}</p>}
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <div className="mb-5 flex items-center gap-2.5"><Award className="h-6 w-6 text-amber-400" /><div><h3 className="text-lg font-bold">District Collectorate SLA transparency</h3><p className="text-xs text-slate-400">Illustrative sample figures only — not live government telemetry.</p></div></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SAMPLE_LEADERBOARD.map((item, idx) => <div key={item.district} className="space-y-2 rounded-xl border border-white/10 bg-slate-950/80 p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-amber-400">Sample rank #{idx + 1}</span><span className="text-xs font-semibold text-emerald-400">{item.resolvedRate}% sample</span></div><p className="text-base font-extrabold">{item.district}</p><p className="text-xs text-slate-400">Sample average: <strong className="text-white">{item.avgHours} hours</strong></p></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
