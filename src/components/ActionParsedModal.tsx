import React from 'react';
import { Check, X, Volume2, User, Package, Wallet, CreditCard, Layers, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

interface ActionParsedModalProps {
  parsedData: any;
  language: Language;
  onConfirm: () => void;
  onCancel: () => void;
  onPlayAudio: (text: string) => void;
  isSpeaking: boolean;
}

export const ActionParsedModal: React.FC<ActionParsedModalProps> = ({
  parsedData,
  language,
  onConfirm,
  onCancel,
  onPlayAudio,
  isSpeaking,
}) => {
  if (!parsedData) return null;

  const hasDebt = parsedData.amountOwedUGX > 0;
  const isLuganda = language === 'luganda';

  const audioText = isLuganda
    ? parsedData.voiceResponseLuganda || parsedData.voiceResponseEnglish
    : parsedData.voiceResponseEnglish || parsedData.voiceResponseLuganda;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full p-6 text-stone-100 shadow-xl relative overflow-hidden">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-800 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {isLuganda ? 'Ekiteeso ky’AI Ekikakasiddwa' : 'Transaction Verification'}
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                {isLuganda ? 'Kebera ebivudde mu ddoboozi' : 'Verify parsed voice parameters'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Banner */}
        <div className="mb-4 p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => onPlayAudio(audioText)}
              className="p-2 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition shadow shrink-0"
              title="Play Voice Confirmation"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <div className="text-xs">
              <span className="font-semibold text-amber-400 font-mono uppercase text-[10px] block mb-0.5">
                {isLuganda ? 'Ekyogerebwa mu Ddoboozi:' : 'Audio Confirmation Synthesizer:'}
              </span>
              <p className="text-stone-300 font-mono text-xs line-clamp-2">"{audioText}"</p>
            </div>
          </div>
        </div>

        {/* Structured Transaction Card */}
        <div className="space-y-3 bg-stone-950 p-4 rounded-xl border border-stone-800 text-sm">
          {/* Item & Quantity */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-stone-400" />
              <span className="text-xs font-semibold text-stone-400">
                {isLuganda ? 'Ekitundiddwa' : 'Produce & Quantity'}:
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-white">
                {parsedData.quantity} {parsedData.unit}
              </span>
              <span className="text-amber-400 ml-1.5 font-medium text-xs font-mono">
                ({isLuganda ? parsedData.itemNameLuganda : parsedData.itemName})
              </span>
            </div>
          </div>

          {/* Unit Price & Total */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
            <span className="text-xs text-stone-400">
              {isLuganda ? 'Bbeeyi / Emu' : 'Unit Price'}:
            </span>
            <span className="font-mono text-stone-300 text-xs">
              UGX {(parsedData.unitPriceUGX || 0).toLocaleString()} / {parsedData.unit}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
            <span className="text-xs text-stone-300 font-bold uppercase tracking-wider">
              {isLuganda ? 'Omuwendo Gwonna' : 'Gross Value'}:
            </span>
            <span className="font-mono text-emerald-400 font-bold text-base">
              UGX {(parsedData.totalAmountUGX || 0).toLocaleString()}
            </span>
          </div>

          {/* Customer */}
          {parsedData.customerOrPartyName && (
            <div className="flex items-center justify-between pb-2 border-b border-stone-800/80">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-stone-400" />
                <span className="text-xs text-stone-400">{isLuganda ? 'Omuguzi' : 'Counterparty'}:</span>
              </div>
              <span className="font-bold text-stone-200 bg-stone-800 px-2 py-0.5 rounded text-xs font-mono">
                {parsedData.customerOrPartyName}
              </span>
            </div>
          )}

          {/* Cash vs Debt Breakdown */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-stone-900 p-2.5 rounded-lg border border-stone-800">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-0.5">
                {isLuganda ? 'Ezasasuddwa (Cash)' : 'Cash Collected'}:
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                UGX {(parsedData.amountPaidUGX || 0).toLocaleString()}
              </span>
            </div>
            <div
              className={`p-2.5 rounded-lg border ${
                hasDebt
                  ? 'bg-stone-900 border-rose-500/40 text-rose-300'
                  : 'bg-stone-900 border-stone-800 text-stone-400'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                {isLuganda ? 'Ebbanja (Amabanja)' : 'Credit Receivables'}:
              </span>
              <span className="font-mono font-bold text-rose-400 text-sm">
                {hasDebt ? `UGX ${(parsedData.amountOwedUGX || 0).toLocaleString()}` : 'UGX 0 (None)'}
              </span>
            </div>
          </div>

          {/* Stock Adjustment */}
          <div className="bg-stone-900 p-2 rounded-lg text-xs flex items-center justify-between text-stone-300 border border-stone-800/60 font-mono">
            <span>{isLuganda ? 'Sitoka Enkendeezebwa:' : 'Inventory Deducted:'}</span>
            <span className="font-bold text-rose-400">
              {parsedData.stockDelta < 0 ? `${parsedData.stockDelta} ${parsedData.unit}` : `+${parsedData.quantity} ${parsedData.unit}`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl border border-stone-700 text-stone-300 font-bold hover:bg-stone-800 transition text-xs"
          >
            {isLuganda ? 'Sazaamu' : 'Discard'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center space-x-2 shadow transition text-xs"
          >
            <Check className="w-4 h-4" />
            <span>{isLuganda ? 'Wandiika mu Kitabo' : 'Commit Transaction'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
