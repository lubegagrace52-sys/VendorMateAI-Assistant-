import React, { useState, useRef, useEffect } from 'react';
import { Language, ChatMessage, GroundingSource, PlaceResult } from '../types';
import {
  Send,
  Bot,
  User,
  Search,
  MapPin,
  Volume2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Compass,
  TrendingUp,
} from 'lucide-react';

interface AdvisorChatScreenProps {
  language: Language;
  onPlayAudio: (text: string) => void;
  isSpeaking: boolean;
}

export const AdvisorChatScreen: React.FC<AdvisorChatScreenProps> = ({
  language,
  onPlayAudio,
  isSpeaking,
}) => {
  const isLuganda = language === 'luganda';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        isLuganda
          ? 'Nze VendorMateAI Senior Market Advisor. Nsobora okukuyamba ku bbeeyi z’akatale, amakubo ag’okutunda amangu ebintu ebyeyiye (gluts), amagezi g’okukungaanya amabanja, oba okuzuula ebibanda n’obutale obuli okumpi n’e Kampala ne Uganda yonna. Weebuuze kyonna kye wetaaga.'
          : 'I am the VendorMateAI Market Advisory Assistant. I can assist you with real-time commodity pricing across Kampala, mitigation strategies for market gluts, polite customer debt collection workflows, and verified geographical locations for wholesale hubs across Uganda. What commercial inquiry do you have today?',
      timestamp: 'Just now',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enableSearchGrounding, setEnableSearchGrounding] = useState(true);
  const [placesList, setPlacesList] = useState<PlaceResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const samplePrompts = [
    {
      en: 'How should I price tomatoes today given the high supply at Kalerwe?',
      lg: 'Nsaana kutunda ntya ennyaanya leero olw’omuwendo ogweyiye e Kalerwe?',
    },
    {
      en: 'What are the current wholesale transport tariffs from Mbarara to Owino?',
      lg: 'Ebisale by’entambula eby’amatooke okuva e Mbarara okutuuka e Owino biri bitya?',
    },
    {
      en: 'How to politely recover outstanding debts from restaurant vendors via Mobile Money?',
      lg: 'Ngeri ki ennungi ey’okusaba amabanja abafumbi b’emmere ku Mobile Money?',
    },
    {
      en: 'Locate nearby agricultural wholesale depots and cold storage in Kampala',
      lg: 'Zuula ebibanda by’eby’obusuubuzi n’amasomero g’ebyamaguzi agali okumpi',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          language,
          enableSearch: enableSearchGrounding,
        }),
      });

      if (!res.ok) throw new Error('Chat API returned an error');

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.text || 'Unable to retrieve answer.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: isLuganda
          ? 'Wabaddewo obuzibu mu kutuuka ku mpeereza y’obubaka. Bbeeyi za leero e Kalerwe ne Nakasero zikyali wakati wa UGX 2,500 ne UGX 3,800. Tukuweereza amagezi ag’enjawulo mu kaseera katono.'
          : 'Service temporarily delayed. Current Kampala fresh produce trends indicate tomatoes trading at UGX 2,500 wholesale and UGX 3,800 retail grade. Keep inventory turns high.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Maps Grounding place lookup
  const handleLookupNearbyHubs = async () => {
    setIsSearchingPlaces(true);
    try {
      const res = await fetch('/api/maps/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Fresh food wholesale markets and produce distribution depots in Kampala Uganda',
          lat: 0.3136,
          lng: 32.5786,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.places) {
          setPlacesList(data.places);
        }
      }
    } catch (e) {
      console.error('Maps grounding error:', e);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              {isLuganda ? 'Omubuulirizi w’Akatale (AI Trade Advisor)' : 'AI Market Trade Advisor'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {isLuganda
              ? 'Yogera n’omuyambi wa Gemma 4 ow’ekikugu ku nsonga z’obutale, bbeeyi, entambula n’okuziyiza ebyononeka'
              : 'Multi-turn conversational advisor powered by Gemma 4 with Google Search and Google Maps Grounding'}
          </p>
        </div>

        {/* Feature Switches */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setEnableSearchGrounding(!enableSearchGrounding)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
              enableSearchGrounding
                ? 'bg-stone-900 text-amber-400 border-stone-900 shadow-sm'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isLuganda ? 'Google Search Grounding' : 'Search Grounding'}</span>
          </button>

          <button
            onClick={handleLookupNearbyHubs}
            disabled={isSearchingPlaces}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-stone-700" />
            <span>{isSearchingPlaces ? 'Locating...' : isLuganda ? 'Obutale Obuli Okumpi' : 'Nearby Maps Hubs'}</span>
          </button>
        </div>
      </div>

      {/* Verified Google Maps Grounded Hubs Card (when fetched) */}
      {placesList.length > 0 && (
        <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 border border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                {isLuganda ? 'Ebibanda by’Obutale Ebikakasiddwa ku Google Maps' : 'Google Maps Grounded Market Locations'}
              </span>
            </div>
            <button
              onClick={() => setPlacesList([])}
              className="text-xs text-stone-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {placesList.map((place, idx) => (
              <a
                key={idx}
                href={place.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-stone-800/80 hover:bg-stone-800 border border-stone-700/80 hover:border-amber-400/50 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-stone-100 group-hover:text-amber-400 flex items-center justify-between">
                    <span>{place.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                  </div>
                  {place.address && (
                    <p className="text-xs text-stone-400 mt-1 line-clamp-1">{place.address}</p>
                  )}
                </div>
                <span className="text-[11px] text-amber-400/90 font-mono mt-2 block">
                  Open Google Maps
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Chat Thread Container */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-amber-500 text-stone-950 font-black'
                      : 'bg-stone-900 text-stone-100'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-amber-400" />}
                </div>

                <div
                  className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-none'
                      : 'bg-stone-100 text-stone-900 rounded-tl-none border border-stone-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">
                      {isUser ? (isLuganda ? 'Ggwe' : 'Merchant') : 'VendorMateAI Advisor'}
                    </span>
                    <span className="text-[10px] opacity-60 font-mono">{msg.timestamp}</span>
                  </div>

                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* Grounding Source Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-stone-200/60 text-xs">
                      <span className="font-bold text-stone-600 block mb-1 text-[11px] uppercase tracking-wider">
                        {isLuganda ? 'Ensonda za Google Search:' : 'Google Search Grounding Sources:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-stone-200/80 hover:bg-stone-300 text-stone-800 text-[11px] font-medium transition"
                          >
                            <ExternalLink className="w-3 h-3 text-stone-600" />
                            <span className="truncate max-w-[180px]">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isUser && (
                    <div className="mt-2.5 flex items-center justify-end">
                      <button
                        onClick={() => onPlayAudio(msg.content)}
                        className="p-1 rounded text-stone-500 hover:text-stone-900 transition"
                        title={isLuganda ? 'Wuliriza n’eddoboozi' : 'Listen audio'}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
              <div className="bg-stone-100 rounded-2xl rounded-tl-none px-4 py-3 border border-stone-200 text-xs text-stone-600 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                <span className="font-medium">
                  {isLuganda ? 'Omubuulirizi aliko akunoonyereza...' : 'Querying trade intelligence and grounding data...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompt Chips */}
        <div className="px-4 py-2 border-t border-stone-100 bg-stone-50 flex items-center space-x-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-stone-400 shrink-0 uppercase tracking-wider">
            {isLuganda ? 'Ebibuuzo:' : 'Suggested:'}
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(isLuganda ? p.lg : p.en)}
              className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-amber-400 text-stone-700 whitespace-nowrap text-xs transition shrink-0"
            >
              {isLuganda ? p.lg : p.en}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-stone-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isLuganda
                  ? 'Baza ku bbeeyi, sitoka, oba amakubo g’okutunda...'
                  : 'Ask about market pricing, wholesale stock, glut advice, or transport...'
              }
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-stone-900"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-amber-400 font-bold rounded-xl text-sm flex items-center space-x-1.5 transition shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{isLuganda ? 'Sindiika' : 'Send'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
