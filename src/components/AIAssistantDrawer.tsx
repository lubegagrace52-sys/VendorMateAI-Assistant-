import React, { useState, useRef, useEffect } from 'react';
import { Language, ChatMessage, GroundingSource, PlaceResult, StockItem, Debtor, LedgerEntry } from '../types';
import {
  Bot,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  ExternalLink,
  Search,
  MapPin,
  ChevronDown,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Users,
  Package,
} from 'lucide-react';
import { playChime } from '../utils/audioPlayer';

interface AIAssistantDrawerProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onNavigateTab: (tab: 'voice' | 'summary' | 'debts' | 'stock' | 'map' | 'advisor') => void;
  onPlayAudio: (text: string) => void;
  isSpeaking: boolean;
  stock: StockItem[];
  debtors: Debtor[];
  ledger: LedgerEntry[];
  totalSales: number;
  totalCash: number;
  totalDebts: number;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  language,
  isOpen,
  onClose,
  onOpen,
  onNavigateTab,
  onPlayAudio,
  isSpeaking,
  stock,
  debtors,
  ledger,
  totalSales,
  totalCash,
  totalDebts,
}) => {
  const isLuganda = language === 'luganda';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'model',
      content: isLuganda
        ? 'Oli otya. Nze VendorMateAI assistant wo ow’omunda mu dduuka. Nsobora okukuyamba ku bbalansi z’amabanja, sitoka ekozezza, amagoba ga leero, ne bbeeyi z’obutale e Kalerwe, Owino ne Nakasero. Obuzaayo ki leero?'
        : 'Welcome to VendorMateAI Integrated Trade Assistant. I have live access to your sales ledger, outstanding receivables, stock thresholds, and Kampala commodity market pricing. How can I assist your business right now?',
      timestamp: 'Just now',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [enableSearch, setEnableSearch] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const lowStockItems = stock.filter((s) => s.currentQty <= s.reorderThreshold);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Voice speech recognition for the assistant drawer
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'luganda' ? 'lg' : 'en-UG';

      recognition.onstart = () => {
        setIsListeningMic(true);
        playChime('start');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };

      recognition.onerror = () => {
        setIsListeningMic(false);
      };

      recognition.onend = () => {
        setIsListeningMic(false);
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

  const toggleMic = () => {
    if (isListeningMic) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListeningMic(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = language === 'luganda' ? 'lg' : 'en-UG';
          recognitionRef.current.start();
          setIsListeningMic(true);
        } catch (e) {
          const sample = isLuganda ? "Bani ababanja amabanja leero?" : "Who owes me money right now?";
          setInput(sample);
          handleSend(sample);
        }
      } else {
        const sample = isLuganda ? "Bani ababanja amabanja leero?" : "Who owes me money right now?";
        setInput(sample);
        handleSend(sample);
      }
    }
  };

  const handleSend = async (overrideText?: string) => {
    const query = (overrideText || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          language,
          enableSearch,
          appContext: {
            totalSales,
            totalCash,
            totalDebts,
            debtors: debtors.filter((d) => d.amountOwedUGX > 0).map((d) => ({
              customerName: d.customerName,
              amountOwedUGX: d.amountOwedUGX,
              itemOwed: d.itemOwed,
              phone: d.phoneNumber,
            })),
            lowStock: lowStockItems.map((s) => ({
              name: s.name,
              nameLuganda: s.nameLuganda,
              currentQty: s.currentQty,
              unit: s.unit,
              threshold: s.reorderThreshold,
            })),
          },
        }),
      });

      if (!res.ok) throw new Error('Assistant API error');
      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.text || 'Information updated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Assistant error:', err);
      const fallback: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: isLuganda
          ? `[VendorMateAI]: Leero otunze ebya UGX ${totalSales.toLocaleString()} n'amabanja ga UGX ${totalDebts.toLocaleString()}. Abasinga okubanja: ${debtors.slice(0, 2).map((d) => `${d.customerName} (UGX ${d.amountOwedUGX.toLocaleString()})`).join(', ')}. Sitoka ekozezza ku: ${lowStockItems.map((s) => s.nameLuganda).join(', ')}.`
          : `[VendorMateAI]: Active records indicate gross sales of UGX ${totalSales.toLocaleString()} with UGX ${totalDebts.toLocaleString()} outstanding receivables. Key accounts: ${debtors.slice(0, 2).map((d) => `${d.customerName} owing UGX ${d.amountOwedUGX.toLocaleString()}`).join(', ')}. Low inventory: ${lowStockItems.map((s) => s.name).join(', ')}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickShortcuts = [
    {
      label: isLuganda ? 'Bani ababanja?' : 'Who owes money?',
      query: isLuganda ? 'Mbulira amabanja gonna agaliwo leero naani ababanja?' : 'Who owes me money right now and what items did they take?',
    },
    {
      label: isLuganda ? 'Sitoka ekozezza?' : 'What is running low?',
      query: isLuganda ? 'Biki ebiri wansi mu sitoka leero bye nsaana okugula?' : 'What inventory is running low that I need to restock?',
    },
    {
      label: isLuganda ? 'Bbeeyi e Kalerwe?' : 'Tomato glut check',
      query: isLuganda ? 'Bbeeyi y’ennyaanya e Kalerwe eri etya leero?' : 'What is the current tomato price in Kalerwe and how should I price mine?',
    },
  ];

  return (
    <>
      {/* Floating Omnipresent Assistant Trigger (When Closed) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center space-x-2">
          {/* Proactive context chip */}
          {lowStockItems.length > 0 && (
            <div
              onClick={onOpen}
              className="hidden sm:flex items-center space-x-1.5 bg-stone-900 border border-stone-700 text-stone-200 px-3 py-2 rounded-xl text-xs shadow-lg cursor-pointer hover:border-amber-400 transition font-mono"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>{lowStockItems.length} items low stock • Ask AI</span>
            </div>
          )}

          <button
            onClick={onOpen}
            className="group flex items-center space-x-2 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-700 hover:border-amber-400 rounded-2xl shadow-2xl transition transform active:scale-95 cursor-pointer"
            title="Open VendorMateAI Assistant"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4 text-stone-950" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-stone-100 group-hover:text-amber-400">
              VendorMateAI
            </span>
          </button>
        </div>
      )}

      {/* Floating / Docked Assistant Drawer (When Open) */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 shadow-2xl flex flex-col bg-white border border-stone-300 ${
            isExpanded
              ? 'inset-4 sm:inset-10 rounded-2xl'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[440px] h-[580px] rounded-2xl'
          }`}
        >
          {/* Header */}
          <div className="bg-stone-900 text-stone-100 p-3.5 sm:p-4 rounded-t-2xl flex items-center justify-between border-b border-stone-800 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                <Bot className="w-4 h-4 text-stone-950" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  VendorMateAI Co-Pilot
                  <span className="text-[10px] font-mono font-semibold px-1 py-0.2 bg-stone-800 text-amber-400 rounded border border-stone-700">
                    Gemma 4 • Live Context
                  </span>
                </h3>
                <p className="text-[11px] text-stone-400 font-mono">
                  {isLuganda ? 'Omuyambi w’ekikugu ku dduuka lyo' : 'Context-aware store and trade assistant'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-stone-400">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:text-white hover:bg-stone-800 transition hidden sm:inline-block"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:text-white hover:bg-stone-800 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Bar */}
          <div className="bg-stone-950 text-stone-300 px-3.5 py-1.5 text-[11px] font-mono flex items-center justify-between border-b border-stone-800 shrink-0">
            <div className="flex items-center space-x-3">
              <span>Sales: <strong className="text-emerald-400 font-bold">UGX {totalSales.toLocaleString()}</strong></span>
              <span>•</span>
              <span>Debts: <strong className="text-rose-400 font-bold">UGX {totalDebts.toLocaleString()}</strong></span>
            </div>
            {lowStockItems.length > 0 && (
              <span className="text-amber-400 font-bold">{lowStockItems.length} low stock</span>
            )}
          </div>

          {/* Messages Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-stone-50">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-stone-900 text-white rounded-br-none'
                        : 'bg-white text-stone-900 border border-stone-200 shadow-sm rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-stone-100 flex flex-wrap gap-1 text-[10px]">
                        <span className="text-stone-400 font-mono">Sources:</span>
                        {msg.sources.map((src, i) => (
                          <a
                            key={i}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-0.5 text-amber-700 hover:underline"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[120px]">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isUser && (
                    <div className="flex items-center space-x-2 mt-1 px-1">
                      <button
                        onClick={() => onPlayAudio(msg.content)}
                        className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center space-x-1"
                        title="Listen audio"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Listen</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="bg-white rounded-xl p-3 border border-stone-200 text-xs text-stone-500 flex items-center space-x-2 max-w-[80%]">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span className="font-mono">Analyzing store context & trade data...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Context Shortcuts */}
          <div className="p-2 border-t border-stone-200 bg-white flex items-center space-x-1.5 overflow-x-auto scrollbar-none shrink-0">
            {quickShortcuts.map((sc, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sc.query)}
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-medium whitespace-nowrap transition border border-stone-200/80"
              >
                {sc.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-stone-200 bg-white rounded-b-2xl shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={toggleMic}
                className={`p-2 rounded-lg border transition ${
                  isListeningMic
                    ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
                }`}
                title={isListeningMic ? 'Stop recording' : 'Speak to Assistant'}
              >
                {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isLuganda
                    ? 'Baza AI ku dduuka lyo oba obutale...'
                    : 'Ask assistant about your debts, stock, or market prices...'
                }
                className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-amber-400 font-bold rounded-lg text-xs transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
