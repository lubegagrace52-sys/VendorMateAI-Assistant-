export type Language = 'luganda' | 'english';

export type TransactionIntent =
  | 'SALE'
  | 'PURCHASE_STOCK'
  | 'DEBT_REPAYMENT'
  | 'EXPENSE'
  | 'PRICE_INQUIRY'
  | 'STOCK_CHECK';

export type PaymentStatus = 'PAID_CASH' | 'FULL_CREDIT' | 'PARTIAL_CREDIT';

export interface LedgerEntry {
  id: string;
  timestamp: string;
  intent: TransactionIntent;
  itemName: string;
  itemNameLuganda: string;
  quantity: number;
  unit: string;
  unitPriceUGX: number;
  totalAmountUGX: number;
  customerOrPartyName: string;
  paymentStatus: PaymentStatus;
  amountPaidUGX: number;
  amountOwedUGX: number;
  voiceTranscript?: string;
  voiceResponseLuganda?: string;
  voiceResponseEnglish?: string;
}

export interface StockItem {
  id: string;
  name: string;
  nameLuganda: string;
  icon: string;
  category: 'vegetables' | 'staples' | 'fruits' | 'proteins';
  currentQty: number;
  unit: string;
  unitCostUGX: number;
  sellingPriceUGX: number;
  reorderThreshold: number;
  lastRestocked: string;
}

export interface Debtor {
  id: string;
  customerName: string;
  phoneNumber: string;
  amountOwedUGX: number;
  totalPurchasedUGX: number;
  lastTransactionDate: string;
  itemOwed: string;
  notes?: string;
}

export interface MarketPrice {
  id: string;
  marketName: string;
  cityOrDistrict: string;
  lat: number;
  lng: number;
  produce: string;
  produceLuganda: string;
  wholesalePriceUGX: number;
  retailPriceUGX: number;
  unit: string;
  reportedByCount: number;
  trend: 'rising' | 'falling' | 'stable';
  isGlut: boolean;
  isShortage: boolean;
  lastUpdated: string;
  distanceKm: number;
  adviceNote?: string;
}

export interface DailySummaryData {
  summaryLuganda: string;
  summaryEnglish: string;
  profitEstimateUGX: number;
  revenueUGX: number;
  cashCollectedUGX: number;
  creditOwedUGX: number;
  lowStockItems: StockItem[];
  topDebtors: Debtor[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface PlaceResult {
  title: string;
  uri: string;
  address?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  sources?: GroundingSource[];
}

