import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  Volume2,
  CheckCircle,
  X,
  Languages,
  Info,
  HelpCircle,
} from 'lucide-react';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptConfirmed: (transcript: string, languageHint: string) => void;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  onTranscriptConfirmed,
}) => {
  const { language, t, showToast } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedSpeechLang, setSelectedSpeechLang] = useState<'ta-IN' | 'en-IN'>('ta-IN');
  const [isSupported, setIsSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState<number[]>([20, 45, 70, 30, 85, 40, 60, 25]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Animate audio waveform when recording
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setAudioLevel([
          Math.floor(Math.random() * 80) + 20,
          Math.floor(Math.random() * 95) + 15,
          Math.floor(Math.random() * 90) + 30,
          Math.floor(Math.random() * 85) + 25,
          Math.floor(Math.random() * 100) + 10,
          Math.floor(Math.random() * 75) + 20,
          Math.floor(Math.random() * 90) + 15,
          Math.floor(Math.random() * 60) + 20,
        ]);
      }, 120);
    } else {
      setAudioLevel([15, 25, 20, 30, 25, 20, 15, 10]);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast(
        language === 'ta'
          ? 'உங்கள் உலாவியில் குரல் அறிதல் ஆதரிக்கப்படவில்லை. கீழே உள்ள மாதிரி உரையை கிளிக் செய்யலாம் அல்லது தட்டச்சு செய்யலாம்.'
          : 'Speech recognition is not natively supported in this browser. Please use quick sample buttons or text input.',
        'info'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = selectedSpeechLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          showToast(
            language === 'ta'
              ? 'மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது. கீழே உள்ள மாதிரிகளைத் தேர்ந்தெடுக்கலாம்.'
              : 'Microphone permission denied. You can select one of the test scenarios below.',
            'warning'
          );
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleApplyPreset = (sampleText: string, lang: 'ta-IN' | 'en-IN') => {
    setSelectedSpeechLang(lang);
    setTranscript(sampleText);
    showToast(
      language === 'ta' ? 'மாதிரி குரல் உரை தேர்ந்தெடுக்கப்பட்டது' : 'Civic test preset loaded',
      'info'
    );
  };

  const handleProceed = () => {
    if (!transcript.trim()) {
      showToast(
        language === 'ta'
          ? 'தயவுசெய்து குரல் மூலம் பேசவும் அல்லது உரையை உள்ளிடவும்'
          : 'Please speak or enter complaint text first',
        'warning'
      );
      return;
    }
    stopListening();
    onTranscriptConfirmed(
      transcript.trim(),
      selectedSpeechLang === 'ta-IN' ? 'Tamil' : 'English'
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-amber-300">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t.voiceModalTitle}</h3>
              <p className="text-xs text-indigo-200">{t.voiceModalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Speech Language Switcher */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2">
              <Languages className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">
                {language === 'ta' ? 'குரல் உள்ளீட்டு மொழி:' : 'Spoken Voice Language:'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              <button
                type="button"
                onClick={() => setSelectedSpeechLang('ta-IN')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                  selectedSpeechLang === 'ta-IN'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                தமிழ் (Tamil India)
              </button>
              <button
                type="button"
                onClick={() => setSelectedSpeechLang('en-IN')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                  selectedSpeechLang === 'en-IN'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                English (India)
              </button>
            </div>
          </div>

          {/* Central Microphone Recording Action */}
          <div className="flex flex-col items-center justify-center py-5 bg-linear-to-b from-indigo-50/50 to-transparent rounded-2xl border border-dashed border-indigo-200">
            {/* Waveform Bars */}
            <div className="flex items-center justify-center space-x-1.5 h-12 mb-4">
              {audioLevel.map((height, idx) => (
                <div
                  key={idx}
                  style={{ height: `${height}%` }}
                  className={`w-1.5 rounded-full transition-all duration-100 ${
                    isRecording ? 'bg-red-500 shadow-sm' : 'bg-indigo-200'
                  }`}
                />
              ))}
            </div>

            {/* Mic Pulse Button */}
            <button
              type="button"
              onClick={isRecording ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl relative ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white ring-8 ring-red-100 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white ring-4 ring-indigo-100 hover:scale-105'
              }`}
            >
              {isRecording ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
            </button>

            <p className="mt-3 text-sm font-semibold text-slate-800">
              {isRecording ? t.voiceListening : t.voiceClickToStart}
            </p>
            <p className="text-xs text-slate-500">
              {isRecording ? t.voiceClickToStop : (language === 'ta' ? 'தெளிவாக பேசவும்' : 'Speak naturally in Tamil or English')}
            </p>
          </div>

          {/* Real-time / Editable Transcript Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
                <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.voiceRecognizedText}</span>
              </label>
              {transcript && (
                <button
                  type="button"
                  onClick={() => setTranscript('')}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  {language === 'ta' ? 'அழிக்க' : 'Clear Text'}
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'குரல் உரை இங்கே தோன்றும்... தேவைப்பட்டால் திருத்தலாம்.'
                  : 'Your recognized speech transcript will appear here. You can also edit or type manually...'
              }
              className="w-full p-3.5 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-sans leading-relaxed bg-slate-50/50"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
              <Info className="w-3 h-3 text-indigo-600 shrink-0" />
              <span>{t.voiceEditNote}</span>
            </p>
          </div>

          {/* Quick Demo Voice Scenarios (Essential for instant evaluation & demo testing) */}
          <div className="border-t border-slate-200 pt-3">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.voiceTrySample}</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(
                    'எங்கள் பகுதியில் கடந்த ஒரு வாரமாக தெருவிளக்கு வேலை செய்யவில்லை.',
                    'ta-IN'
                  )
                }
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 hover:border-indigo-300 text-left transition-all text-xs group"
              >
                <div className="flex items-center justify-between text-indigo-900 font-semibold mb-1">
                  <span>💡 {language === 'ta' ? 'தெருவிளக்கு பிரச்சனை' : 'Street Light Malfunction'}</span>
                  <span className="text-[10px] bg-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded font-mono">
                    Tamil
                  </span>
                </div>
                <p className="text-slate-600 line-clamp-2 text-[11px]">
                  “எங்கள் பகுதியில் கடந்த ஒரு வாரமாக தெருவிளக்கு வேலை செய்யவில்லை.”
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(
                    'அண்ணா நகர் 4வது தெருவில் குடிநீர் குழாய் உடைந்து சாலை முழுவதும் தண்ணீர் தேங்கியுள்ளது.',
                    'ta-IN'
                  )
                }
                className="p-2.5 rounded-xl border border-cyan-200 bg-cyan-50/60 hover:bg-cyan-100 hover:border-cyan-300 text-left transition-all text-xs"
              >
                <div className="flex items-center justify-between text-cyan-900 font-semibold mb-1">
                  <span>🚰 {language === 'ta' ? 'குடிநீர் குழாய் உடைப்பு' : 'Water Main Leakage'}</span>
                  <span className="text-[10px] bg-cyan-200 text-cyan-900 px-1.5 py-0.5 rounded font-mono">
                    Tamil
                  </span>
                </div>
                <p className="text-slate-600 line-clamp-2 text-[11px]">
                  “அண்ணா நகர் 4வது தெருவில் குடிநீர் குழாய் உடைந்து சாலை முழுவதும் தண்ணீர் தேங்கியுள்ளது.”
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(
                    'Garbage collection has stopped for the last 5 days near the community hall. Foul smell is spreading and street dogs are scattering waste.',
                    'en-IN'
                  )
                }
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 hover:border-emerald-300 text-left transition-all text-xs"
              >
                <div className="flex items-center justify-between text-emerald-900 font-semibold mb-1">
                  <span>🗑️ {language === 'ta' ? 'துப்புரவு / குப்பை' : 'Sanitation & Garbage Overflow'}</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono">
                    English
                  </span>
                </div>
                <p className="text-slate-600 line-clamp-2 text-[11px]">
                  “Garbage collection has stopped for 5 days near community hall...”
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(
                    'மின்மாற்றி அருகே தீப்பொறி பறக்கிறது. ஆபத்தான நிலைமையில் உள்ளது. உடனடியாக மின்சார வாரியம் பார்க்க வேண்டும்.',
                    'ta-IN'
                  )
                }
                className="p-2.5 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 hover:border-red-300 text-left transition-all text-xs"
              >
                <div className="flex items-center justify-between text-red-900 font-semibold mb-1">
                  <span>⚡ {language === 'ta' ? 'அவசர மின்சார அபாயம்' : 'Critical Electrical Hazard'}</span>
                  <span className="text-[10px] bg-red-200 text-red-900 px-1.5 py-0.5 rounded font-mono">
                    Critical
                  </span>
                </div>
                <p className="text-slate-600 line-clamp-2 text-[11px]">
                  “மின்மாற்றி அருகே தீப்பொறி பறக்கிறது. ஆபத்தான நிலைமையில் உள்ளது...”
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {language === 'ta' ? 'ரத்து செய்க' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleProceed}
            disabled={!transcript.trim()}
            className={`px-5 py-2 text-sm font-bold rounded-xl flex items-center space-x-2 transition-all ${
              transcript.trim()
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-900/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{t.btnAnalyzeAI}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
