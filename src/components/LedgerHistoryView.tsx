import React, { useState } from 'react';
import { LedgerEntry, Language } from '../types';
import { UI_TRANSLATIONS } from '../data/mockData';
import { Volume2, Receipt, User, ArrowDownRight, ArrowUpRight, Clock, Radio } from 'lucide-react';

interface LedgerHistoryViewProps {
  language: Language;
  ledger: LedgerEntry[];
  onPlayAudio: (text: string) => void;
  isSpeaking: boolean;
}

export const LedgerHistoryView: React.FC<LedgerHistoryViewProps> = ({
  language,
  ledger,
  onPlayAudio,
  isSpeaking,
}) => {
  const t = UI_TRANSLATIONS[language];
  const isLuganda = language === 'luganda';

  const [filterType, setFilterType] = useState<string>('all');

  const filtered = ledger.filter((entry) => {
    if (filterType === 'all') return true;
    if (filterType === 'debts') return entry.amountOwedUGX > 0;
    if (filterType === 'cash') return entry.amountOwedUGX === 0;
    if (filterType === 'restock') return entry.intent === 'PURCHASE_STOCK';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <h3 className="font-bold text-stone-900 text-base sm:text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-stone-700" />
            <span>{isLuganda ? 'Ekitabo ky’Ebitundiddwa (Ledger Feed)' : 'Transaction Ledger Feed'}</span>
          </h3>
          <p className="text-xs text-stone-500">
            {isLuganda
              ? 'Buli kigambo kye wayogedde kikuŋŋaanyiziddwa wano mu kitabo'
              : 'Continuous audit log of transactions captured via voice recognition and manual entries'}
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {[
            { id: 'all', labelLuganda: 'Byonna', labelEn: 'All Lines' },
            { id: 'debts', labelLuganda: 'Amabanja', labelEn: 'Receivables' },
            { id: 'cash', labelLuganda: 'Kasiimo (Cash)', labelEn: 'Cash Only' },
            { id: 'restock', labelLuganda: 'Kugula Sitoka', labelEn: 'Restock' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilterType(chip.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs whitespace-nowrap transition ${
                filterType === chip.id
                  ? 'bg-stone-900 text-amber-400'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {isLuganda ? chip.labelLuganda : chip.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Feed */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            {t.noTransactionsYet}
          </div>
        ) : (
          filtered.map((item) => {
            const hasDebt = item.amountOwedUGX > 0;
            const audioText = isLuganda
              ? item.voiceResponseLuganda || item.voiceResponseEnglish
              : item.voiceResponseEnglish || item.voiceResponseLuganda;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-stone-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left metadata */}
                <div className="flex items-start space-x-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      item.intent === 'PURCHASE_STOCK'
                        ? 'bg-stone-200 text-stone-800'
                        : hasDebt
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.intent === 'PURCHASE_STOCK' ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : hasDebt ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-stone-900 text-sm">
                        {item.quantity} {item.unit} {isLuganda ? item.itemNameLuganda : item.itemName}
                      </span>
                      {item.customerOrPartyName && (
                        <span className="text-xs px-2 py-0.5 rounded bg-stone-200 text-stone-800 font-mono">
                          {item.customerOrPartyName}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-500">
                      <span className="font-mono">{item.timestamp}</span>
                      <span>•</span>
                      <span className="font-mono">
                        UGX {item.unitPriceUGX?.toLocaleString()} / {item.unit}
                      </span>
                      {item.voiceTranscript && (
                        <>
                          <span>•</span>
                          <span className="text-stone-400 line-clamp-1 max-w-xs font-mono text-[11px]">
                            "{item.voiceTranscript}"
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right totals & audio replay */}
                <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm sm:text-base text-stone-900">
                      UGX {item.totalAmountUGX.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-mono font-bold">
                      {hasDebt ? (
                        <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {isLuganda ? 'Abanja:' : 'Credit:'} UGX {item.amountOwedUGX.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {isLuganda ? 'Asasudde (Cash)' : 'Settled Cash'}
                        </span>
                      )}
                    </div>
                  </div>

                  {audioText && (
                    <button
                      onClick={() => onPlayAudio(audioText)}
                      className="p-1.5 rounded-lg bg-white hover:bg-stone-900 hover:text-amber-400 text-stone-600 border border-stone-200 transition"
                      title={isLuganda ? 'Wuliriza n’eddoboozi' : 'Listen audio'}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
