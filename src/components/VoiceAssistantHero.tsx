import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, MessageSquare, Play, CheckCircle2, Radio, Terminal } from 'lucide-react';
import { Language } from '../types';
import { UI_TRANSLATIONS, VOICE_PROMPT_PRESETS } from '../data/mockData';
import { playChime } from '../utils/audioPlayer';

interface VoiceAssistantHeroProps {
  language: Language;
  onProcessTranscript: (text: string) => Promise<void>;
  isProcessing: boolean;
  lastTranscript?: string;
}

export const VoiceAssistantHero: React.FC<VoiceAssistantHeroProps> = ({
  language,
  onProcessTranscript,
  isProcessing,
  lastTranscript,
}) => {
  const t = UI_TRANSLATIONS[language];
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [audioWaves, setAudioWaves] = useState<number[]>([12, 24, 40, 20, 16, 32, 28, 14]);
  const [showManualInput, setShowManualInput] = useState(false);
  const recognitionRef = useRef<any>(null);
  const waveTimerRef = useRef<any>(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'luganda' ? 'lg' : 'en-UG';

      recognition.onstart = () => {
        setIsListening(true);
        playChime('start');
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setLiveTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition warning:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [language]);

  // Audio wave animation
  useEffect(() => {
    if (isListening) {
      waveTimerRef.current = setInterval(() => {
        setAudioWaves([
          Math.floor(Math.random() * 32) + 8,
          Math.floor(Math.random() * 45) + 10,
          Math.floor(Math.random() * 52) + 12,
          Math.floor(Math.random() * 38) + 8,
          Math.floor(Math.random() * 48) + 12,
          Math.floor(Math.random() * 35) + 8,
          Math.floor(Math.random() * 42) + 10,
          Math.floor(Math.random() * 28) + 6,
        ]);
      }, 100);
    } else {
      clearInterval(waveTimerRef.current);
      setAudioWaves([10, 14, 18, 14, 10, 12, 14, 10]);
    }
    return () => clearInterval(waveTimerRef.current);
  }, [isListening]);

  const toggleListening = () => {
    if (isProcessing) return;

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      if (liveTranscript.trim()) {
        handleSubmitText(liveTranscript);
      }
    } else {
      setLiveTranscript('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = language === 'luganda' ? 'lg' : 'en-UG';
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {
          simulateVoiceInput();
        }
      } else {
        simulateVoiceInput();
      }
    }
  };

  const simulateVoiceInput = () => {
    setIsListening(true);
    playChime('start');
    const sample =
      language === 'luganda'
        ? "Ntunze kilo 5 ez'ennyaanya ku 3,000 eri Nakato, abanja 2,000"
        : 'sold 5 kg tomatoes at 3000 to Nakato, she owes 2,000.';

    let index = 0;
    const interval = setInterval(() => {
      index += 3;
      setLiveTranscript(sample.slice(0, index));
      if (index >= sample.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsListening(false);
          handleSubmitText(sample);
        }, 500);
      }
    }, 70);
  };

  const handleSubmitText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await onProcessTranscript(trimmed);
    setLiveTranscript('');
    setManualText('');
  };

  return (
    <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 sm:p-7 shadow-md border border-stone-800 relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
        {/* Status Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-stone-950 border border-stone-800 text-xs mb-4">
          <span
            className={`w-2 h-2 rounded-full ${
              isListening ? 'bg-rose-500 animate-ping' : isProcessing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
          <span className="font-medium text-stone-300">
            {isListening
              ? t.listening
              : isProcessing
              ? t.analyzing
              : language === 'luganda'
              ? 'Wandiika n’eddoboozi: Ebyatundiddwa, Amabanja ne Sitoka'
              : 'Voice-to-Ledger Engine: Speak sales, amabanja debts & inventory'}
          </span>
        </div>

        {/* Tactile Microphone Button */}
        <div className="relative my-3 flex flex-col items-center">
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping -m-3"></div>
              <div className="absolute inset-0 rounded-full bg-amber-500/15 animate-pulse -m-6"></div>
            </>
          )}

          <button
            onClick={toggleListening}
            disabled={isProcessing}
            aria-label={isListening ? 'Stop listening' : 'Start speaking'}
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 transform active:scale-95 shadow-lg relative z-10 cursor-pointer ${
              isListening
                ? 'bg-rose-600 ring-4 ring-rose-500/30 text-white'
                : isProcessing
                ? 'bg-stone-800 ring-2 ring-amber-500/40 text-amber-400 animate-pulse'
                : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold ring-4 ring-amber-500/20'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-8 h-8 sm:w-9 sm:h-9 mb-1 text-white animate-pulse" />
                <span className="text-[11px] font-bold tracking-wider uppercase">
                  {language === 'luganda' ? 'Mala' : 'Stop'}
                </span>
              </>
            ) : isProcessing ? (
              <>
                <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-1"></div>
                <span className="text-[10px] font-bold uppercase text-amber-300">
                  {language === 'luganda' ? 'Ebala...' : 'Parsing...'}
                </span>
              </>
            ) : (
              <>
                <Mic className="w-8 h-8 sm:w-9 sm:h-9 mb-1 text-stone-950" />
                <span className="text-[11px] font-black tracking-wider uppercase text-stone-950">
                  {language === 'luganda' ? 'Yogera' : 'Speak'}
                </span>
              </>
            )}
          </button>

          {/* Sound Waveform Visualizer */}
          <div className="flex items-center space-x-1.5 h-8 mt-3 px-4 py-1.5 rounded-full bg-stone-950 border border-stone-800">
            {audioWaves.map((height, i) => (
              <span
                key={i}
                style={{ height: `${height}px` }}
                className={`w-1 rounded-full transition-all duration-75 ${
                  isListening ? 'bg-amber-400' : 'bg-stone-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Live Speech Recognition Bubble */}
        {(liveTranscript || isListening) && (
          <div className="w-full mt-2 p-3.5 bg-stone-950 border border-amber-500/30 rounded-xl text-stone-200 text-sm text-left flex items-start space-x-3">
            <Radio className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-mono font-bold block mb-0.5">
                {language === 'luganda' ? 'Eddoboozi Eryakafuluma:' : 'Live Speech Buffer:'}
              </span>
              <p className="font-mono text-sm text-white">"{liveTranscript || '...'}"</p>
            </div>
            {liveTranscript && (
              <button
                onClick={() => handleSubmitText(liveTranscript)}
                className="px-3 py-1 bg-amber-500 text-stone-950 font-bold text-xs rounded-lg hover:bg-amber-400 self-center"
              >
                {language === 'luganda' ? 'Kola' : 'Process'}
              </button>
            )}
          </div>
        )}

        {/* Preset Prompt Section */}
        <div className="w-full mt-5 text-left border-t border-stone-800/80 pt-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              {t.tryExamples}
            </span>
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              {showManualInput
                ? language === 'luganda'
                  ? 'Kweka eby’okuwandiika'
                  : 'Hide manual text input'
                : language === 'luganda'
                ? 'Wandiika mu kitabo buwandiisi'
                : 'Or enter text manually'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VOICE_PROMPT_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmitText(preset.text)}
                disabled={isProcessing || isListening}
                className="group flex flex-col p-2.5 rounded-xl bg-stone-950/60 hover:bg-stone-950 border border-stone-800 hover:border-amber-500/40 text-left transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-bold text-stone-200 group-hover:text-amber-400">
                    {preset.category}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-stone-800 text-[10px] text-stone-400 font-mono">
                    {preset.badge}
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-mono line-clamp-2 group-hover:text-stone-300">
                  "{preset.text}"
                </p>
              </button>
            ))}
          </div>

          {/* Manual text entry drawer */}
          {showManualInput && (
            <div className="mt-3 p-2 bg-stone-950 rounded-xl border border-stone-800 flex gap-2">
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitText(manualText)}
                placeholder={
                  language === 'luganda'
                    ? "Wandiika wano (e.g. Ntunze kilo 5 ez'ennyaanya ku 3000 eri Nakato, abanja 2000)..."
                    : 'Type merchant speech (e.g. sold 5 kg tomatoes at 3000 to Nakato, she owes 2,000)...'
                }
                className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={() => handleSubmitText(manualText)}
                disabled={!manualText.trim() || isProcessing}
                className="px-3.5 py-2 bg-amber-500 text-stone-950 font-bold rounded-lg text-xs hover:bg-amber-400 disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'luganda' ? 'Kola' : 'Parse'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
