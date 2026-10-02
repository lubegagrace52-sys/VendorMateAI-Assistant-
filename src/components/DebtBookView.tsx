import React, { useState } from 'react';
import { Debtor, Language } from '../types';
import { UI_TRANSLATIONS } from '../data/mockData';
import {
  Users,
  Search,
  MessageSquare,
  CheckCircle,
  Copy,
  Phone,
  Plus,
  Volume2,
  X,
  CreditCard,
  Send,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface DebtBookViewProps {
  language: Language;
  debtors: Debtor[];
  onSettleDebt: (debtorId: string, amountPaid: number) => void;
  onAddDebtor: (debtor: Omit<Debtor, 'id'>) => void;
  selectedDebtor: Debtor | null;
  onSelectDebtor: (debtor: Debtor | null) => void;
  onPlayAudio: (text: string) => void;
}

export const DebtBookView: React.FC<DebtBookViewProps> = ({
  language,
  debtors,
  onSettleDebt,
  onAddDebtor,
  selectedDebtor,
  onSelectDebtor,
  onPlayAudio,
}) => {
  const t = UI_TRANSLATIONS[language];
  const isLuganda = language === 'luganda';

  const [searchTerm, setSearchTerm] = useState('');
  const [traderMomoNumber, setTraderMomoNumber] = useState('+256772000111');
  const [copied, setCopied] = useState(false);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [reminderLang, setReminderLang] = useState<Language>(language);

  // New debtor form
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newAmountOwed, setNewAmountOwed] = useState<number>(0);
  const [newItemOwed, setNewItemOwed] = useState('');

  const totalOutstanding = debtors.reduce((acc, d) => acc + (d.amountOwedUGX || 0), 0);

  const filteredDebtors = debtors.filter(
    (d) =>
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phoneNumber.includes(searchTerm) ||
      d.itemOwed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getReminderMessage = (debtor: Debtor, lang: Language) => {
    if (lang === 'luganda') {
      return `Oli otya ${debtor.customerName}. Nkulamusizza okuva ku dduuka lyaffe. Nkwijukizaako ku bbanja ly'eby'amaguzi (${debtor.itemOwed}) erya UGX ${debtor.amountOwedUGX.toLocaleString()}. Osobola okusasula mangu ku MTN MoMo oba Airtel Money ku namba yaffe: ${traderMomoNumber}. Webale nnyo obuwagizi bwo.`;
    }
    return `Hello ${debtor.customerName}, courteous reminder from our market stall regarding your pending balance of UGX ${debtor.amountOwedUGX.toLocaleString()} for ${debtor.itemOwed}. Kindly settle via MTN MoMo or Airtel Money to: ${traderMomoNumber}. Thank you for your continued business.`;
  };

  const handleOpenWhatsApp = (debtor: Debtor) => {
    const cleanPhone = debtor.phoneNumber.replace(/[^0-9]/g, '');
    const message = getReminderMessage(debtor, reminderLang);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleOpenSMS = (debtor: Debtor) => {
    const cleanPhone = debtor.phoneNumber.replace(/[^0-9]/g, '');
    const message = getReminderMessage(debtor, reminderLang);
    const url = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
    window.location.href = url;
  };

  const handleCopyMessage = (debtor: Debtor) => {
    const message = getReminderMessage(debtor, reminderLang);
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateDebtor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || newAmountOwed <= 0) return;

    onAddDebtor({
      customerName: newCustomerName,
      phoneNumber: newPhoneNumber || '+256700000000',
      amountOwedUGX: Number(newAmountOwed),
      totalPurchasedUGX: Number(newAmountOwed),
      lastTransactionDate: 'Today',
      itemOwed: newItemOwed || 'Market produce',
      notes: 'Recorded manually',
    });

    setNewCustomerName('');
    setNewPhoneNumber('');
    setNewAmountOwed(0);
    setNewItemOwed('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-stone-700" />
            <h2 className="text-xl sm:text-2xl font-black text-stone-900">
              {isLuganda ? 'Ekitabo ky’Amabanja (Debt Ledger)' : 'Customer Credit Ledger (Amabanja)'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {isLuganda
              ? 'Wandiika ababanja, sindiika obubaka ku WhatsApp/SMS ne Mobile Money, era omaleeko amabanja'
              : 'Track trade receivables, dispatch pre-filled WhatsApp / SMS payment prompts, and record settlements'}
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 flex-1 md:flex-none text-right">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              {isLuganda ? 'Omugatte Gw’Amabanja' : 'Total Outstanding'}
            </span>
            <span className="text-xl font-black text-rose-600 font-mono">
              UGX {totalOutstanding.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-3 bg-stone-900 text-amber-400 font-bold rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 hover:bg-stone-800 transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>{isLuganda ? 'Wandiika Ebbanja' : 'New Credit'}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            isLuganda
              ? 'Noonya omuguzi, ennamba y’essimu oba ekitundiddwa...'
              : 'Search debtor by name, phone or produce item...'
          }
          className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-stone-900 shadow-sm"
        />
      </div>

      {/* Debtors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDebtors.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-stone-200">
            <p className="text-stone-400 text-sm">
              {isLuganda ? 'Tewali mabanja gafaanana na kino.' : 'No debtor records found.'}
            </p>
          </div>
        ) : (
          filteredDebtors.map((debtor) => {
            const isSettled = debtor.amountOwedUGX === 0;

            return (
              <div
                key={debtor.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-sm flex flex-col justify-between ${
                  isSettled ? 'border-stone-200 bg-stone-50/40' : 'border-stone-200 hover:border-stone-400'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-1.5">
                        {debtor.customerName}
                        {isSettled && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {isLuganda ? 'Asasudde' : 'Settled'}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{debtor.phoneNumber}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                        {isLuganda ? 'Ebbanja' : 'Owed'}
                      </span>
                      <span
                        className={`text-base sm:text-lg font-black font-mono ${
                          isSettled ? 'text-stone-400' : 'text-rose-600'
                        }`}
                      >
                        UGX {debtor.amountOwedUGX.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 rounded-lg bg-stone-50 border border-stone-100 text-xs text-stone-600 space-y-1">
                    <div>
                      <span className="text-stone-400">{isLuganda ? 'Ekyaguziddwa:' : 'Item:'}</span>{' '}
                      <span className="font-medium text-stone-800">{debtor.itemOwed}</span>
                    </div>
                    <div className="text-stone-400 text-[11px] font-mono">
                      {debtor.lastTransactionDate}
                    </div>
                    {debtor.notes && (
                      <div className="text-stone-500 text-[11px]">"{debtor.notes}"</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectDebtor(debtor)}
                    disabled={isSettled}
                    className="flex-1 py-2 px-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-amber-400 font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center space-x-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isLuganda ? 'Jjukiza ku MoMo' : 'MoMo Reminder'}</span>
                  </button>

                  <button
                    onClick={() => onSettleDebt(debtor.id, debtor.amountOwedUGX)}
                    disabled={isSettled}
                    className="py-2 px-3 border border-stone-300 hover:border-emerald-500 text-stone-700 hover:text-emerald-700 font-bold text-xs rounded-lg transition flex items-center space-x-1"
                    title="Mark paid in full"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{isLuganda ? 'Malawo' : 'Settle'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MoMo Reminder Modal */}
      {selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 text-stone-900 relative">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-stone-900">
                  {isLuganda ? 'Sindiika Okujjukiza ku MoMo' : 'Dispatch Mobile Money Reminder'}
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  {selectedDebtor.customerName} ({selectedDebtor.phoneNumber})
                </p>
              </div>
              <button
                onClick={() => onSelectDebtor(null)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Switch for Reminder */}
            <div className="flex items-center justify-between bg-stone-100 p-1.5 rounded-lg mb-3 text-xs">
              <span className="text-stone-500 font-medium ml-1">
                {isLuganda ? 'Lulimi lw’obubaka:' : 'Template Language:'}
              </span>
              <div className="inline-flex space-x-1">
                <button
                  onClick={() => setReminderLang('luganda')}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    reminderLang === 'luganda'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Luganda
                </button>
                <button
                  onClick={() => setReminderLang('english')}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    reminderLang === 'english'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Trader MoMo Number */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-stone-500 block mb-1">
                {isLuganda ? 'Ennamba yo ey’akasiimo (MTN MoMo / Airtel Money):' : 'Receiving MoMo Account Number:'}
              </label>
              <input
                type="text"
                value={traderMomoNumber}
                onChange={(e) => setTraderMomoNumber(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 font-mono focus:outline-none focus:border-stone-900"
              />
            </div>

            {/* Pre-filled Message Preview */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  {isLuganda ? 'Obubaka Obutegekeddwa:' : 'Pre-filled Reminder Draft:'}
                </span>
                <button
                  onClick={() =>
                    onPlayAudio(getReminderMessage(selectedDebtor, reminderLang))
                  }
                  className="text-xs text-stone-700 hover:text-stone-900 flex items-center space-x-1 font-semibold"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isLuganda ? 'Wuliriza' : 'Listen'}</span>
                </button>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 leading-relaxed font-sans">
                {getReminderMessage(selectedDebtor, reminderLang)}
              </div>
            </div>

            {/* Direct Send Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => handleOpenWhatsApp(selectedDebtor)}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isLuganda ? 'Sindiika ku WhatsApp' : 'Open WhatsApp'}</span>
              </button>

              <button
                onClick={() => handleOpenSMS(selectedDebtor)}
                className="py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isLuganda ? 'Sindiika ku SMS' : 'Open SMS'}</span>
              </button>
            </div>

            <button
              onClick={() => handleCopyMessage(selectedDebtor)}
              className="w-full py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>
                {copied
                  ? isLuganda
                    ? 'Kikoppeddwa bulungi'
                    : 'Copied to clipboard'
                  : isLuganda
                  ? 'Koppa Obubaka'
                  : 'Copy Message'}
              </span>
            </button>

            {/* Partial Settlement */}
            <div className="mt-4 pt-3 border-t border-stone-100">
              <span className="text-xs font-bold text-stone-700 block mb-2">
                {isLuganda ? 'Okusasula ekitundu ku bbanja:' : 'Record partial repayment received:'}
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="UGX Amount"
                  value={paymentAmountInput}
                  onChange={(e) =>
                    setPaymentAmountInput(e.target.value ? Number(e.target.value) : '')
                  }
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-900 font-mono"
                />
                <button
                  onClick={() => {
                    if (paymentAmountInput && Number(paymentAmountInput) > 0) {
                      onSettleDebt(selectedDebtor.id, Number(paymentAmountInput));
                      setPaymentAmountInput('');
                      onSelectDebtor(null);
                    }
                  }}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-bold rounded-lg"
                >
                  {isLuganda ? 'Kaza Ezasasuddwa' : 'Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Debtor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-stone-900">
                {isLuganda ? 'Wandiika Omuguzi Ow’ebbanja' : 'Add New Credit Account'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDebtor} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">
                  {isLuganda ? 'Erinnya ly’Omuguzi:' : 'Debtor Name:'}
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Nakato, Wasswa, Mama Brian"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">
                  {isLuganda ? 'Ennamba y’Essimu:' : 'Phone Number:'}
                </label>
                <input
                  type="text"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  placeholder="e.g. +256772123456"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">
                  {isLuganda ? 'Omuwendo gw’Ebbanja (UGX):' : 'Debt Amount (UGX):'}
                </label>
                <input
                  type="number"
                  required
                  value={newAmountOwed || ''}
                  onChange={(e) => setNewAmountOwed(Number(e.target.value))}
                  placeholder="e.g. 5000"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">
                  {isLuganda ? 'Eky’amaguzi Ekyaguziddwa:' : 'Produce Owed For:'}
                </label>
                <input
                  type="text"
                  value={newItemOwed}
                  onChange={(e) => setNewItemOwed(e.target.value)}
                  placeholder="e.g. 5 kg Tomatoes, 2 bunches Matooke"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border border-stone-300 text-stone-600 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold rounded-lg text-xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
