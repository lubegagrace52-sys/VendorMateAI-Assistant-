import React from 'react';
import { Language, LedgerEntry, Debtor, StockItem } from '../types';
import { UI_TRANSLATIONS } from '../data/mockData';
import {
  Volume2,
  TrendingUp,
  Wallet,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Package,
  MessageSquare,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface DailySummaryViewProps {
  language: Language;
  sales: LedgerEntry[];
  debtors: Debtor[];
  stock: StockItem[];
  onPlayAudio: (text: string) => void;
  isSpeaking: boolean;
  onOpenDebtorModal: (debtor: Debtor) => void;
  onRestockItem: (stockId: string) => void;
}

export const DailySummaryView: React.FC<DailySummaryViewProps> = ({
  language,
  sales,
  debtors,
  stock,
  onPlayAudio,
  isSpeaking,
  onOpenDebtorModal,
  onRestockItem,
}) => {
  const t = UI_TRANSLATIONS[language];
  const isLuganda = language === 'luganda';

  // Calculate metrics
  const totalSales = sales.reduce((acc, s) => acc + (s.totalAmountUGX || 0), 0);
  const totalCash = sales.reduce((acc, s) => acc + (s.amountPaidUGX || 0), 0);
  const totalCredit = sales.reduce((acc, s) => acc + (s.amountOwedUGX || 0), 0);
  const totalOutstandingDebts = debtors.reduce((acc, d) => acc + (d.amountOwedUGX || 0), 0);

  // Profit estimation
  const totalCost = sales.reduce((acc, s) => {
    const item = stock.find(
      (it) => it.name.toLowerCase() === s.itemName.toLowerCase() || it.nameLuganda.toLowerCase() === s.itemNameLuganda?.toLowerCase()
    );
    const unitCost = item ? item.unitCostUGX : (s.unitPriceUGX * 0.7);
    return acc + (unitCost * s.quantity);
  }, 0);
  const estimatedProfit = Math.max(0, totalSales - totalCost);

  const activeDebtors = debtors.filter((d) => d.amountOwedUGX > 0).sort((a, b) => b.amountOwedUGX - a.amountOwedUGX);
  const lowStock = stock.filter((s) => s.currentQty <= s.reorderThreshold);

  const spokenBriefingLuganda = `Okufunza kw'olunaku lwa leero: Otunze ebya UGX ${totalSales.toLocaleString()}. Ssente z'okung'aanyizza mu nsawo ziri UGX ${totalCash.toLocaleString()}. Amabanja ga leero gali UGX ${totalCredit.toLocaleString()}. Amagoba go gali emitwalo ${Math.round(estimatedProfit / 10000)} (UGX ${estimatedProfit.toLocaleString()}). ${activeDebtors.length > 0 ? `Abasinga okubanja bano: ${activeDebtors.slice(0, 2).map((d) => `${d.customerName} abanja UGX ${d.amountOwedUGX.toLocaleString()}`).join(', ')}.` : 'Tolina mabanja mangi agatannasasulwa.'} ${lowStock.length > 0 ? `Sitoka ezze wansi ku: ${lowStock.map((s) => s.nameLuganda).join(', ')}. Genda e Kalerwe oba Owino enkya enkya ozuukuse sitoka.` : 'Sitoka yo eri bulungi.'}`;

  const spokenBriefingEnglish = `Daily Market Briefing: Total gross sales stand at UGX ${totalSales.toLocaleString()}. Cash in hand collected is UGX ${totalCash.toLocaleString()}. New amabanja credit extended today is UGX ${totalCredit.toLocaleString()}. Estimated gross profit is UGX ${estimatedProfit.toLocaleString()}. ${activeDebtors.length > 0 ? `Top receivables to follow up: ${activeDebtors.slice(0, 2).map((d) => `${d.customerName} owing UGX ${d.amountOwedUGX.toLocaleString()}`).join(', ')}.` : 'No critical overdue debts.'} ${lowStock.length > 0 ? `Critical inventory low on: ${lowStock.map((s) => s.name).join(', ')}. Restock wholesale from Kalerwe or Owino.` : 'Stock levels are stable.'}`;

  const briefingText = isLuganda ? spokenBriefingLuganda : spokenBriefingEnglish;

  return (
    <div className="space-y-6">
      {/* Audio Briefing Hero Banner */}
      <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-stone-800">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-stone-800 text-amber-400 font-mono text-[11px] uppercase tracking-wider">
            <span>{isLuganda ? 'Okufunza Kw’Akatale n’Eddoboozi' : 'Audio Financial Summary'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {t.dailyBriefingTitle}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400">
            {isLuganda
              ? 'Wuliriza alipoota y’ebitundiddwa, amagoba, ababanjibwa ne sitoka ekozezza'
              : 'Synthesized voice briefing of realized margins, credit exposure, and restock urgencies'}
          </p>
        </div>

        <button
          onClick={() => onPlayAudio(briefingText)}
          className={`px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center space-x-2 transition shadow shrink-0 ${
            isSpeaking ? 'ring-4 ring-amber-400/40' : ''
          }`}
        >
          <Volume2 className="w-4 h-4 text-stone-950" />
          <span>{isSpeaking ? (isLuganda ? 'Erimu Eyogera...' : 'Playing Speech...') : t.listenBriefing}</span>
        </button>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              {t.todaySales}
            </span>
            <span className="p-2 rounded-lg bg-stone-100 text-stone-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-stone-900 font-mono">
              UGX {totalSales.toLocaleString()}
            </div>
            <p className="text-xs text-stone-500 mt-1 font-mono">
              {sales.length} {isLuganda ? 'ebitundiddwa' : 'recorded transactions'}
            </p>
          </div>
        </div>

        {/* Cash In Hand */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              {t.cashCollected}
            </span>
            <span className="p-2 rounded-lg bg-stone-100 text-stone-700">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              UGX {totalCash.toLocaleString()}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {isLuganda ? 'Ssente ezikwasiddwa' : 'Liquid cash collected'}
            </p>
          </div>
        </div>

        {/* Total Outstanding Debts */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              {t.unpaidDebts}
            </span>
            <span className="p-2 rounded-lg bg-stone-100 text-stone-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600 font-mono">
              UGX {totalOutstandingDebts.toLocaleString()}
            </div>
            <p className="text-xs text-stone-500 mt-1 font-mono">
              {activeDebtors.length} {isLuganda ? 'ababanja' : 'debtors pending'}
            </p>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              {t.estimatedProfit}
            </span>
            <span className="p-2 rounded-lg bg-stone-100 text-stone-700">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-stone-900 font-mono">
              UGX {estimatedProfit.toLocaleString()}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {isLuganda ? 'Amagoba agabaliddwa' : 'Gross trade margin'}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Who Owes What vs What's Running Low */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receivables List */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-stone-700" />
              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">{t.whoOwesWhat}</h3>
                <p className="text-xs text-stone-500">
                  {isLuganda ? 'Abaguzi abalina amabanja' : 'Customer credit ledger and recovery status'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-stone-100 text-stone-800 text-xs font-mono font-bold">
              UGX {totalOutstandingDebts.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2.5">
            {activeDebtors.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">
                {isLuganda ? 'Tewali mabanja agatannasasulwa.' : 'All accounts settled. Zero outstanding credit.'}
              </p>
            ) : (
              activeDebtors.map((debtor) => (
                <div
                  key={debtor.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 hover:border-stone-400 transition flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-stone-900 text-sm truncate">
                        {debtor.customerName}
                      </span>
                      <span className="text-[11px] font-mono text-stone-500">
                        {debtor.phoneNumber}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5 truncate">
                      {debtor.itemOwed} • <span className="text-stone-400">{debtor.lastTransactionDate}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-rose-600 text-sm">
                      UGX {debtor.amountOwedUGX.toLocaleString()}
                    </div>
                    <button
                      onClick={() => onOpenDebtorModal(debtor)}
                      className="mt-1 inline-flex items-center space-x-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-xs rounded transition"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{isLuganda ? 'Jjukiza' : 'Remind'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock List */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">{t.whatRunningLow}</h3>
                <p className="text-xs text-stone-500">
                  {isLuganda ? 'Eby’amaguzi ebikozezza mu sitoka' : 'Items depleted below minimum safety thresholds'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-stone-100 text-stone-800 text-xs font-mono font-bold">
              {lowStock.length} {isLuganda ? 'ebikozezza' : 'items'}
            </span>
          </div>

          <div className="space-y-2.5">
            {lowStock.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-100 flex flex-col items-center">
                <CheckCircle className="w-6 h-6 text-emerald-600 mb-1" />
                <span className="font-bold text-stone-800">
                  {isLuganda ? 'Sitoka yonna eri bulungi' : 'All stock levels within safety margins'}
                </span>
              </div>
            ) : (
              lowStock.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-stone-200 text-stone-800 font-mono text-xs font-bold flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-stone-900 text-sm truncate">
                        {isLuganda ? item.nameLuganda : item.name}
                      </div>
                      <div className="text-xs text-stone-600">
                        {isLuganda ? 'Esigaddewo:' : 'Remaining:'}{' '}
                        <span className="font-mono font-bold text-rose-600">
                          {item.currentQty} {item.unit}
                        </span>{' '}
                        (Min: {item.reorderThreshold} {item.unit})
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onRestockItem(item.id)}
                    className="shrink-0 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-xs rounded transition flex items-center space-x-1"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{isLuganda ? 'Gula' : 'Restock'}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
