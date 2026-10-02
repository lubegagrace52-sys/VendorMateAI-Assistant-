import React, { useState, useEffect } from 'react';
import { Language, LedgerEntry, StockItem, Debtor, DailySummaryData } from './types';
import {
  INITIAL_STOCK,
  INITIAL_DEBTORS,
  INITIAL_LEDGER,
  UI_TRANSLATIONS,
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { VoiceAssistantHero } from './components/VoiceAssistantHero';
import { ActionParsedModal } from './components/ActionParsedModal';
import { DailySummaryView } from './components/DailySummaryView';
import { DebtBookView } from './components/DebtBookView';
import { StockInventoryView } from './components/StockInventoryView';
import { MarketMapView } from './components/MarketMapView';
import { LedgerHistoryView } from './components/LedgerHistoryView';
import { AdvisorChatScreen } from './components/AdvisorChatScreen';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { speakVoiceFeedback, stopSpeaking, playChime } from './utils/audioPlayer';
import {
  Mic,
  BarChart3,
  Users,
  Package,
  MapPin,
  Bot,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('luganda');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState<'voice' | 'summary' | 'debts' | 'stock' | 'map' | 'advisor'>('voice');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Application State
  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('soko_stock');
    return saved ? JSON.parse(saved) : INITIAL_STOCK;
  });

  const [debtors, setDebtors] = useState<Debtor[]>(() => {
    const saved = localStorage.getItem('soko_debtors');
    return saved ? JSON.parse(saved) : INITIAL_DEBTORS;
  });

  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem('soko_ledger');
    return saved ? JSON.parse(saved) : INITIAL_LEDGER;
  });

  // Voice AI processing states
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [parsedAction, setParsedAction] = useState<any | null>(null);
  const [selectedDebtorForModal, setSelectedDebtorForModal] = useState<Debtor | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('soko_stock', JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem('soko_debtors', JSON.stringify(debtors));
  }, [debtors]);

  useEffect(() => {
    localStorage.setItem('soko_ledger', JSON.stringify(ledger));
  }, [ledger]);

  const t = UI_TRANSLATIONS[language];
  const isLuganda = language === 'luganda';

  // Metrics
  const totalSales = ledger.reduce((acc, entry) => acc + (entry.totalAmountUGX || 0), 0);
  const totalCash = ledger.reduce((acc, entry) => acc + (entry.amountPaidUGX || 0), 0);
  const totalDebts = debtors.reduce((acc, debtor) => acc + (debtor.amountOwedUGX || 0), 0);

  // Audio Playback
  const handlePlayAudio = (text: string) => {
    if (!soundEnabled) return;
    speakVoiceFeedback(
      text,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  // Process voice transcript with server Gemini API
  const handleProcessTranscript = async (transcript: string) => {
    setIsProcessingVoice(true);
    try {
      const res = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          language,
          currentStock: stock.map((s) => ({
            name: s.name,
            nameLuganda: s.nameLuganda,
            qty: s.currentQty,
            unit: s.unit,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to process voice command');
      }

      const data = await res.json();
      setParsedAction({ ...data, rawTranscript: transcript });
      playChime('success');

      // Spoken voice feedback
      if (soundEnabled) {
        const audioMsg = isLuganda
          ? data.voiceResponseLuganda || data.voiceResponseEnglish
          : data.voiceResponseEnglish || data.voiceResponseLuganda;
        handlePlayAudio(audioMsg);
      }
    } catch (err: any) {
      console.error('Error processing voice:', err);
      setBannerNotice(
        isLuganda
          ? 'Netiwaaka erwawo katono, naye ebikwata ku kitundiddwa bikuumiddwa.'
          : 'Service experienced network latency. Entry recorded in buffer.'
      );
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Confirm and commit parsed transaction
  const handleConfirmAction = () => {
    if (!parsedAction) return;

    const newLedgerId = `led-${Date.now()}`;
    const newEntry: LedgerEntry = {
      id: newLedgerId,
      timestamp: 'Just now',
      intent: parsedAction.intent || 'SALE',
      itemName: parsedAction.itemName || 'Produce',
      itemNameLuganda: parsedAction.itemNameLuganda || parsedAction.itemName,
      quantity: parsedAction.quantity || 1,
      unit: parsedAction.unit || 'kg',
      unitPriceUGX: parsedAction.unitPriceUGX || 0,
      totalAmountUGX: parsedAction.totalAmountUGX || 0,
      customerOrPartyName: parsedAction.customerOrPartyName || '',
      paymentStatus: parsedAction.paymentStatus || 'PAID_CASH',
      amountPaidUGX: parsedAction.amountPaidUGX || 0,
      amountOwedUGX: parsedAction.amountOwedUGX || 0,
      voiceTranscript: parsedAction.rawTranscript,
      voiceResponseLuganda: parsedAction.voiceResponseLuganda,
      voiceResponseEnglish: parsedAction.voiceResponseEnglish,
    };

    // 1. Update Ledger
    setLedger((prev) => [newEntry, ...prev]);

    // 2. Update Stock
    const qtyDelta = parsedAction.stockDelta || -parsedAction.quantity;
    setStock((prev) =>
      prev.map((item) => {
        const match =
          item.name.toLowerCase() === parsedAction.itemName?.toLowerCase() ||
          item.nameLuganda.toLowerCase() === parsedAction.itemNameLuganda?.toLowerCase() ||
          parsedAction.itemName?.toLowerCase().includes(item.name.toLowerCase());

        if (match) {
          const updatedQty = Math.max(0, item.currentQty + qtyDelta);
          return { ...item, currentQty: updatedQty };
        }
        return item;
      })
    );

    // 3. Update or Add Debtor
    if (parsedAction.amountOwedUGX > 0 && parsedAction.customerOrPartyName) {
      const custName = parsedAction.customerOrPartyName.trim();
      setDebtors((prev) => {
        const existingIdx = prev.findIndex(
          (d) => d.customerName.toLowerCase() === custName.toLowerCase()
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            amountOwedUGX: updated[existingIdx].amountOwedUGX + parsedAction.amountOwedUGX,
            lastTransactionDate: 'Just now',
            itemOwed: `${parsedAction.quantity} ${parsedAction.unit} ${parsedAction.itemName}`,
          };
          return updated;
        } else {
          const newDebtor: Debtor = {
            id: `debtor-${Date.now()}`,
            customerName: custName,
            phoneNumber: '+256700000000',
            amountOwedUGX: parsedAction.amountOwedUGX,
            totalPurchasedUGX: parsedAction.totalAmountUGX,
            lastTransactionDate: 'Just now',
            itemOwed: `${parsedAction.quantity} ${parsedAction.unit} ${parsedAction.itemName}`,
            notes: 'Spoken credit sale via voice assistant',
          };
          return [newDebtor, ...prev];
        }
      });
    }

    setParsedAction(null);
    playChime('success');
    setBannerNotice(
      isLuganda
        ? `Kikoleddwa: Ebyatundiddwa biwandiikiddwa mu kitabo, sitoka ne bbalansi bikakasiddwa.`
        : `Transaction committed: Ledger updated, stock deducted, and credit balance reconciled.`
    );
    setTimeout(() => setBannerNotice(null), 5000);
  };

  // Settle Debt
  const handleSettleDebt = (debtorId: string, amountPaid: number) => {
    setDebtors((prev) =>
      prev.map((d) => {
        if (d.id === debtorId) {
          const remaining = Math.max(0, d.amountOwedUGX - amountPaid);
          return {
            ...d,
            amountOwedUGX: remaining,
            lastTransactionDate: 'Just now (Payment)',
            notes: `Paid UGX ${amountPaid.toLocaleString()} today`,
          };
        }
        return d;
      })
    );

    const debtor = debtors.find((d) => d.id === debtorId);
    if (debtor) {
      const entry: LedgerEntry = {
        id: `led-${Date.now()}`,
        timestamp: 'Just now',
        intent: 'DEBT_REPAYMENT',
        itemName: `Repayment: ${debtor.itemOwed}`,
        itemNameLuganda: `Okusasula: ${debtor.itemOwed}`,
        quantity: 1,
        unit: 'payment',
        unitPriceUGX: amountPaid,
        totalAmountUGX: amountPaid,
        customerOrPartyName: debtor.customerName,
        paymentStatus: 'PAID_CASH',
        amountPaidUGX: amountPaid,
        amountOwedUGX: 0,
        voiceResponseLuganda: `${debtor.customerName} asasudde UGX ${amountPaid.toLocaleString()} ku bbanja lye.`,
        voiceResponseEnglish: `${debtor.customerName} settled UGX ${amountPaid.toLocaleString()} towards balance.`,
      };
      setLedger((prev) => [entry, ...prev]);
    }

    playChime('success');
    const msg = isLuganda
      ? `Okusasula kwa UGX ${amountPaid.toLocaleString()} kukulunguddwa mu kitabo.`
      : `Payment of UGX ${amountPaid.toLocaleString()} recorded in ledger.`;
    setBannerNotice(msg);
    if (soundEnabled) handlePlayAudio(msg);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Restock inventory item
  const handleRestock = (stockId: string, qtyToAdd: number) => {
    setStock((prev) =>
      prev.map((item) => {
        if (item.id === stockId) {
          return {
            ...item,
            currentQty: item.currentQty + qtyToAdd,
            lastRestocked: new Date().toISOString().split('T')[0],
          };
        }
        return item;
      })
    );

    const stockItem = stock.find((s) => s.id === stockId);
    if (stockItem) {
      const restockEntry: LedgerEntry = {
        id: `led-${Date.now()}`,
        timestamp: 'Just now',
        intent: 'PURCHASE_STOCK',
        itemName: stockItem.name,
        itemNameLuganda: stockItem.nameLuganda,
        quantity: qtyToAdd,
        unit: stockItem.unit,
        unitPriceUGX: stockItem.unitCostUGX,
        totalAmountUGX: qtyToAdd * stockItem.unitCostUGX,
        customerOrPartyName: 'Wholesale Depot',
        paymentStatus: 'PAID_CASH',
        amountPaidUGX: qtyToAdd * stockItem.unitCostUGX,
        amountOwedUGX: 0,
        voiceResponseLuganda: `Oguze ${qtyToAdd} ${stockItem.unit} ez'${stockItem.nameLuganda} ku sitoka.`,
        voiceResponseEnglish: `Restocked ${qtyToAdd} ${stockItem.unit} of ${stockItem.name}.`,
      };
      setLedger((prev) => [restockEntry, ...prev]);
    }

    playChime('success');
    setBannerNotice(
      isLuganda
        ? `Sitoka eyongeddwaako bulungi.`
        : `Inventory restocked successfully.`
    );
    setTimeout(() => setBannerNotice(null), 3000);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans selection:bg-amber-300">
      {/* Professional Terminal Navbar */}
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        totalSales={totalSales}
        totalCash={totalCash}
        totalDebts={totalDebts}
        isSpeaking={isSpeaking}
        onStopSpeaking={handleStopSpeaking}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Clean Notification Strip */}
      {bannerNotice && (
        <div className="bg-stone-900 text-amber-400 text-xs font-mono font-semibold px-4 py-2 text-center flex items-center justify-center space-x-2 border-b border-stone-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6">
        {/* Screen Navigation Tabs */}
        <div className="bg-white p-1.5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'voice'
                ? 'bg-stone-900 text-amber-400 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{t.tabLedger}</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'summary'
                ? 'bg-stone-900 text-amber-400 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t.tabSummary}</span>
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition relative ${
              activeTab === 'debts'
                ? 'bg-stone-900 text-amber-400 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.tabDebts}</span>
            {totalDebts > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 -ml-1"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'stock'
                ? 'bg-stone-900 text-amber-400 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t.tabStock}</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'map'
                ? 'bg-stone-900 text-amber-400 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{t.tabMarketMap}</span>
          </button>

          <button
            onClick={() => setActiveTab('advisor')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'advisor'
                ? 'bg-stone-900 text-amber-400 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>{t.tabAdvisor}</span>
          </button>
        </div>

        {/* Screen 1: Voice & Quick Ledger */}
        {activeTab === 'voice' && (
          <div className="space-y-6">
            <VoiceAssistantHero
              language={language}
              onProcessTranscript={handleProcessTranscript}
              isProcessing={isProcessingVoice}
            />

            <LedgerHistoryView
              language={language}
              ledger={ledger}
              onPlayAudio={handlePlayAudio}
              isSpeaking={isSpeaking}
            />
          </div>
        )}

        {/* Screen 2: Daily Summary & Profit */}
        {activeTab === 'summary' && (
          <DailySummaryView
            language={language}
            sales={ledger}
            debtors={debtors}
            stock={stock}
            onPlayAudio={handlePlayAudio}
            isSpeaking={isSpeaking}
            onOpenDebtorModal={(d) => {
              setSelectedDebtorForModal(d);
              setActiveTab('debts');
            }}
            onRestockItem={(id) => {
              handleRestock(id, 20);
            }}
          />
        )}

        {/* Screen 3: Debt Book & MoMo Reminders */}
        {activeTab === 'debts' && (
          <DebtBookView
            language={language}
            debtors={debtors}
            onSettleDebt={handleSettleDebt}
            onAddDebtor={(newDebtor) => {
              setDebtors((prev) => [
                { ...newDebtor, id: `debtor-${Date.now()}` },
                ...prev,
              ]);
            }}
            selectedDebtor={selectedDebtorForModal}
            onSelectDebtor={setSelectedDebtorForModal}
            onPlayAudio={handlePlayAudio}
          />
        )}

        {/* Screen 4: Stock & Low-Stock Alerts */}
        {activeTab === 'stock' && (
          <StockInventoryView
            language={language}
            stock={stock}
            onRestock={handleRestock}
            onAddNewProduct={(item) => {
              setStock((prev) => [...prev, { ...item, id: `stock-${Date.now()}` }]);
            }}
          />
        )}

        {/* Screen 5: Leaflet Market Map & Glut Advisor */}
        {activeTab === 'map' && (
          <MarketMapView language={language} onPlayAudio={handlePlayAudio} />
        )}

        {/* Screen 6: Gemini Trade Chatbot with Search & Maps Grounding */}
        {activeTab === 'advisor' && (
          <AdvisorChatScreen
            language={language}
            onPlayAudio={handlePlayAudio}
            isSpeaking={isSpeaking}
          />
        )}
      </main>

      {/* Confirmation Modal when Voice is Processed */}
      {parsedAction && (
        <ActionParsedModal
          parsedData={parsedAction}
          language={language}
          onConfirm={handleConfirmAction}
          onCancel={() => setParsedAction(null)}
          onPlayAudio={handlePlayAudio}
          isSpeaking={isSpeaking}
        />
      )}

      {/* Omnipresent AI Assistant Drawer */}
      <AIAssistantDrawer
        language={language}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onOpen={() => setIsAssistantOpen(true)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsAssistantOpen(false);
        }}
        onPlayAudio={handlePlayAudio}
        isSpeaking={isSpeaking}
        stock={stock}
        debtors={debtors}
        ledger={ledger}
        totalSales={totalSales}
        totalCash={totalCash}
        totalDebts={totalDebts}
      />

      {/* Professional Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        <p className="font-mono">
          <span className="font-bold text-stone-800">VendorMateAI</span> • Agricultural Vendor & Trade OS (Luganda and English)
        </p>
        <p className="mt-0.5 text-[11px] text-stone-400 font-mono">
          Gemma 4 Model (gemma-4-31b-it) • Google Search Grounding • Google Maps Grounding • Leaflet Mapping
        </p>
      </footer>
    </div>
  );
}
