import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Clock3, FileText, Languages, MapPin, Mic, MicOff, Search, ShieldCheck, Sparkles, Waves } from 'lucide-react';

type Props = {
  onQuickFile?: (draftText: string, detectedCategory: string) => void;
  onTrackPetition?: (petitionId: string) => void;
  language?: 'en' | 'ta';
  onToggleLanguage?: () => void;
};

const districts = [
  'Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Erode','Tiruppur',
  'Vellore','Thoothukudi','Dindigul','Thanjavur','Ranipet','Kancheepuram','Chengalpattu','Tiruvallur',
  'Cuddalore','Villupuram','Kallakurichi','Tiruvannamalai','Krishnagiri','Dharmapuri','Namakkal','Karur',
  'Perambalur','Ariyalur','Mayiladuthurai','Nagapattinam','Tiruvarur','Sivaganga','Ramanathapuram',
  'Virudhunagar','Theni','Tenkasi','Kanniyakumari','Nilgiris','Tirupathur','Pudukkottai'
];

function classify(text: string) {
  const t = text.toLocaleLowerCase();
  if (/water|drinking water|pipeline|தண்ணீர்|குடிநீர்|குழாய்|குடிநீர் குழாய்/.test(t)) return { dept: 'TWAD / Municipal Water Supply', priority: 'High', sla: 'Target: 24 hours', category: 'Water Supply' };
  if (/sewage|drain|drainage|கழிவுநீர்|வடிகால்/.test(t)) return { dept: 'Municipal Corporation / CMWSSB', priority: 'High', sla: 'Target: 24 hours', category: 'Drainage' };
  if (/road|pothole|சாலை|குண்டு/.test(t)) return { dept: 'Highways / Local Body', priority: 'Medium', sla: 'Target: 72 hours', category: 'Roads' };
  if (/power|electricity|street.?light|மின்சாரம்|விளக்கு/.test(t)) return { dept: 'TANGEDCO / Local Body', priority: 'High', sla: 'Target: 12 hours', category: 'Electricity' };
  if (/hospital|health|மருத்துவமனை|சுகாதாரம்/.test(t)) return { dept: 'Health & Family Welfare', priority: 'High', sla: 'Target: 6 hours', category: 'Health' };
  return { dept: 'AI-assisted department routing', priority: 'Standard', sla: 'Target: 48 hours', category: 'General' };
}

export default function FortStGeorgeHero({ onQuickFile, onTrackPetition, language: controlledLanguage, onToggleLanguage }: Props) {
  const [localLanguage, setLocalLanguage] = useState<'en'|'ta'>('en');
  const language = controlledLanguage ?? localLanguage;
  const toggleLanguage = onToggleLanguage ?? (() => setLocalLanguage(v => v === 'en' ? 'ta' : 'en'));
  const [mode, setMode] = useState<'file'|'track'>('file');
  const [inputText, setInputText] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [imageSource, setImageSource] = useState<'primary'|'fallback'>('primary');
  const [listening, setListening] = useState(false);
  const triage = useMemo(() => classify(inputText), [inputText]);
  const isTamil = language === 'ta';

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    return () => window.speechSynthesis.cancel();
  }, []);

  const startVoice = () => {
    const SpeechRecognitionCtor = (window as Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      window.alert(isTamil ? 'இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. Chrome-ல் முயற்சிக்கவும்.' : 'Voice input is not supported by this browser. Try the latest Chrome browser.');
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = isTamil ? 'ta-IN' : 'en-IN';
    recognition.interimResults = true;
    recognition.onresult = event => {
      const transcript = Array.from(event.results).map(result => result[0]?.transcript ?? '').join(' ');
      setInputText(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'file' && inputText.trim()) onQuickFile?.(inputText.trim(), triage.category);
    if (mode === 'track' && trackingId.trim()) onTrackPetition?.(trackingId.trim());
  };

  const heroText = isTamil
    ? { eyebrow: 'தமிழ்நாடு அரசு • மக்கள் குறைதீர்ப்பு மையம்', title: 'ஒவ்வொரு குடிமகனின் குரலும்', accent: 'கேட்கப்பட வேண்டும்.', intro: 'தமிழ் அல்லது ஆங்கிலத்தில் உங்கள் குறையை விவரிக்கவும். பரிந்துரைக்கப்பட்ட துறை மற்றும் முன்னுரிமை உடனடியாகக் காட்டப்படும்.' }
    : { eyebrow: 'GOVERNMENT SERVICES • CITIZEN GRIEVANCE PORTAL', title: 'Your voice matters.', accent: 'Let’s resolve it.', intro: 'Describe your civic issue in Tamil or English. Get an instant department and priority preview before continuing.' };

  return (
    <main className="min-h-screen bg-[#0B192C] text-white">
      <section className="relative isolate flex min-h-[88vh] flex-col overflow-hidden">
        <div className="absolute inset-0 -z-20 bg-[#0B192C]" />
        <img
          src={imageSource === 'primary' ? 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Fort_St._George%2C_Chennai_2.jpg' : '/fort-st-george-silhouette.svg'}
          onLoad={() => {}}
          onError={() => setImageSource('fallback')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B192C] via-[#0B192C]/90 to-[#0B192C]/55" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0B192C] via-transparent to-[#0B192C]/65" />
        <header className="border-b border-white/10 bg-[#0B192C]/65 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]"><Building2 size={21}/></div>
              <div><p className="font-bold tracking-wide">NivaranAI</p><p className="text-xs text-slate-300">{isTamil ? 'தமிழ்நாடு மக்கள் குறைதீர்ப்பு' : 'Tamil Nadu Citizen Grievance'}</p></div>
            </div>
            <div className="flex items-center gap-3 text-xs text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"/>{isTamil ? '38 மாவட்டங்கள்' : 'Designed for all 38 districts'}<button onClick={toggleLanguage} className="ml-2 inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"><Languages size={16}/>{isTamil ? 'English' : 'தமிழ்'}</button></div>
          </div>
        </header>

        <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-16">
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-200"><Sparkles size={15}/>{isTamil ? 'AI உதவியுடன் குறை வகைப்படுத்தல்' : 'AI-assisted grievance triage'}</div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37] sm:text-sm">{heroText.eyebrow}</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">{heroText.title}<span className="block bg-gradient-to-r from-[#F4D675] to-[#D4AF37] bg-clip-text text-transparent">{heroText.accent}</span></h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">{heroText.intro}</p>

            <div className="rounded-2xl border border-white/15 bg-[#0B192C]/80 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
              <div className="mb-4 flex flex-wrap gap-2 border-b border-white/10 pb-3">
                <button type="button" onClick={() => setMode('file')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'file' ? 'bg-[#D4AF37] text-[#0B192C]' : 'text-slate-300 hover:bg-white/10'}`}><FileText size={16}/>{isTamil ? 'புதிய புகார்' : 'Describe an issue'}</button>
                <button type="button" onClick={() => setMode('track')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'track' ? 'bg-[#D4AF37] text-[#0B192C]' : 'text-slate-300 hover:bg-white/10'}`}><Search size={16}/>{isTamil ? 'மனுவைக் கண்காணி' : 'Track a petition'}</button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                {mode === 'file' ? <>
                  <label htmlFor="grievance" className="sr-only">{isTamil ? 'உங்கள் புகார்' : 'Describe your grievance'}</label>
                  <div className="relative">
                    <textarea id="grievance" rows={3} value={inputText} onChange={e => setInputText(e.target.value)} placeholder={isTamil ? 'உதாரணம்: எங்கள் தெருவில் குடிநீர் குழாய் உடைந்துள்ளது...' : 'Example: A drinking water pipeline is broken on our street...'} className="w-full resize-y rounded-xl border border-white/15 bg-slate-950/75 px-4 py-3 pr-14 text-sm leading-6 text-white placeholder:text-slate-400 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25" />
                    <button type="button" onClick={startVoice} aria-label={listening ? 'Stop voice input' : 'Start voice input'} title={listening ? 'Listening…' : 'Speak in Tamil or English'} className={`absolute right-3 top-3 rounded-lg p-2 transition ${listening ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-200 hover:bg-[#D4AF37] hover:text-[#0B192C]'}`}>{listening ? <MicOff size={18}/> : <Mic size={18}/>}</button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2"><Sparkles size={14} className="text-[#D4AF37]"/><span className="text-slate-300">Department:</span><strong>{triage.dept}</strong></span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-emerald-200"><Clock3 size={14}/><strong>{triage.priority}</strong> · {triage.sla}</span>
                  </div>
                  <p className="text-xs text-slate-400">Routing is a preliminary keyword-based preview. Actual department, SLA and ward must be confirmed by the backend or responsible authority.</p>
                  <button type="submit" disabled={!inputText.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1D36D] px-5 py-3 font-bold text-[#0B192C] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{isTamil ? 'தொடரவும்' : 'Continue with triage'}<ArrowRight size={17}/></button>
                </> : <div className="flex flex-col gap-3 sm:flex-row"><label htmlFor="petition-id" className="sr-only">Petition ID</label><input id="petition-id" value={trackingId} onChange={e => setTrackingId(e.target.value)} placeholder="Enter petition ID" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-slate-950/75 px-4 py-3 text-sm focus:border-[#D4AF37] focus:outline-none"/><button type="submit" disabled={!trackingId.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 font-bold text-[#0B192C] disabled:opacity-50"><Search size={16}/>{isTamil ? 'தேடுக' : 'Track petition'}</button></div>}
              </form>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">{['Water Supply','Roads','Electricity','Drainage','Public Health'].map(item => <button key={item} type="button" onClick={() => {setMode('file');setInputText(item + ': ');}} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-slate-300 transition hover:border-[#D4AF37]/60 hover:text-white">{item}</button>)}</div>
          </div>

          <aside className="space-y-4 lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-[#0B192C]/75 shadow-2xl backdrop-blur-xl">
              <div className="relative flex h-64 items-end overflow-hidden sm:h-72">
                <img src={imageSource === 'primary' ? 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Fort_St._George%2C_Chennai_2.jpg' : '/fort-st-george-silhouette.svg'} onError={() => setImageSource('fallback')} alt="Fort St. George, Chennai" className="absolute inset-0 h-full w-full object-cover opacity-65"/>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C] via-[#0B192C]/20 to-transparent"/>
                <div className="relative p-5"><span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#0B192C]/80 px-3 py-1 text-xs text-[#F1D36D]"><MapPin size={13}/> Rajaji Salai, Chennai</span><h2 className="text-xl font-bold">Fort St. George</h2><p className="mt-1 text-sm text-slate-300">Tamil Nadu Secretariat & Legislative Assembly</p></div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 text-center">
                <div className="p-4"><ShieldCheck className="mx-auto mb-2 text-emerald-300" size={20}/><p className="text-xs text-slate-400">Secure design</p><p className="mt-1 text-sm font-bold">Citizen-first</p></div>
                <div className="p-4"><Clock3 className="mx-auto mb-2 text-[#D4AF37]" size={20}/><p className="text-xs text-slate-400">Triage preview</p><p className="mt-1 text-sm font-bold">Instant</p></div>
                <div className="p-4"><CheckCircle2 className="mx-auto mb-2 text-emerald-300" size={20}/><p className="text-xs text-slate-400">Language</p><p className="mt-1 text-sm font-bold">தமிழ் / EN</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-lg">
              <div className="mb-3 flex items-center gap-2 font-bold"><Waves className="text-emerald-300" size={19}/>District service coverage</div>
              <p className="mb-4 text-sm leading-6 text-slate-300">Designed to support all 38 districts of Tamil Nadu. Verified resolution rates will appear here when connected to the live grievance analytics API.</p>
              <div className="flex flex-wrap gap-2">{districts.map(district => <span key={district} className="rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-1 text-xs text-slate-300">{district}</span>)}</div>
              <p className="mt-4 text-xs text-slate-400">No live resolution-rate figures are displayed until verified data is available.</p>
            </div>
          </aside>
        </div>
        <footer className="border-t border-white/10 bg-[#0B192C]/80 py-3 text-center text-xs text-slate-400"><span className="text-[#D4AF37]">●</span> {isTamil ? 'தமிழ்நாடு முழுவதும் குடிமக்கள் சேவைகளுக்காக உருவாக்கப்பட்டது' : 'Civic service interface for Tamil Nadu'} · AI suggestions require official verification</footer>
      </section>
    </main>
  );
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
};
