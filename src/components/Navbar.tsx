import React from 'react';
import { Language } from '../types';
import { UI_TRANSLATIONS } from '../data/mockData';
import { Volume2, VolumeX, TrendingUp, Users, Wallet, Mic, Square, Globe, Bot } from 'lucide-react';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  totalSales: number;
  totalCash: number;
  totalDebts: number;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  onOpenAssistant?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  soundEnabled,
  onToggleSound,
  totalSales,
  totalCash,
  totalDebts,
  isSpeaking,
  onStopSpeaking,
  onOpenAssistant,
}) => {
  const t = UI_TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      {/* Top Professional Ticker */}
      <div className="bg-stone-950 text-stone-300 px-4 py-1.5 text-xs font-medium flex items-center justify-between border-b border-stone-800/80">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold tracking-wide text-stone-200 uppercase text-[10px]">
            {language === 'luganda' ? 'Akatale k’Omusuubuzi mu Uganda' : 'Uganda Agri-Trade Network Terminal'}
          </span>
          <span className="text-stone-500 hidden sm:inline">•</span>
          <span className="text-stone-400 hidden sm:inline text-[11px]">Kampala, Jinja, Mbarara, Gulu</span>
        </div>

        <div className="flex items-center space-x-3">
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-0.5 rounded text-[11px] font-semibold transition"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
              <span>{language === 'luganda' ? 'Siriikiriza' : 'Stop Audio'}</span>
            </button>
          )}
          <span className="font-mono text-[11px] text-stone-400">UGX / Shillings</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm">
            <Mic className="w-5 h-5 text-stone-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                VendorMateAI
                <span className="text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded bg-stone-800 text-amber-400 border border-stone-700 font-mono font-semibold">
                  Trade OS
                </span>
              </h1>
            </div>
            <p className="text-xs text-stone-400 line-clamp-1">
              {language === 'luganda' ? 'Omuyambi w’omusuubuzi n’eddoboozi' : 'Autonomous Voice Market & Trade Assistant'}
            </p>
          </div>
        </div>

        {/* Live Metrics Bar */}
        <div className="hidden md:flex items-center space-x-4 bg-stone-950/80 px-4 py-2 rounded-xl border border-stone-800 text-xs">
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-stone-400">{t.todaySales}:</span>
            <span className="font-bold text-emerald-400 font-mono">UGX {totalSales.toLocaleString()}</span>
          </div>
          <div className="h-4 w-px bg-stone-800" />
          <div className="flex items-center space-x-1.5">
            <Wallet className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-stone-400">{t.cashCollected}:</span>
            <span className="font-bold text-amber-400 font-mono">UGX {totalCash.toLocaleString()}</span>
          </div>
          <div className="h-4 w-px bg-stone-800" />
          <div className="flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-stone-400">{language === 'luganda' ? 'Amabanja' : 'Receivables'}:</span>
            <span className="font-bold text-rose-400 font-mono">UGX {totalDebts.toLocaleString()}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          {/* AI Assistant Button */}
          {onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
              title="Open VendorMateAI Assistant"
            >
              <Bot className="w-3.5 h-3.5 text-stone-950" />
              <span className="hidden sm:inline">VendorMateAI</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label="Toggle voice output"
            className={`p-2 rounded-xl border transition flex items-center justify-center ${
              soundEnabled
                ? 'bg-stone-800 border-amber-500/40 text-amber-400 hover:bg-stone-700'
                : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
            }`}
            title={soundEnabled ? 'Speech synthesizer active' : 'Speech synthesizer muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Bilingual Switcher */}
          <div className="inline-flex rounded-xl p-1 bg-stone-800 border border-stone-700 text-xs">
            <button
              onClick={() => onLanguageChange('luganda')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                language === 'luganda'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Luganda
            </button>
            <button
              onClick={() => onLanguageChange('english')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                language === 'english'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
