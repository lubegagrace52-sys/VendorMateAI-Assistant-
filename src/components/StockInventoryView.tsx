import React, { useState } from 'react';
import { StockItem, Language } from '../types';
import { UI_TRANSLATIONS } from '../data/mockData';
import { Package, AlertTriangle, Plus, Search, CheckCircle2, TrendingUp, Layers } from 'lucide-react';

interface StockInventoryViewProps {
  language: Language;
  stock: StockItem[];
  onRestock: (stockId: string, quantityToAdd: number) => void;
  onAddNewProduct: (item: Omit<StockItem, 'id'>) => void;
}

export const StockInventoryView: React.FC<StockInventoryViewProps> = ({
  language,
  stock,
  onRestock,
  onAddNewProduct,
}) => {
  const t = UI_TRANSLATIONS[language];
  const isLuganda = language === 'luganda';

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStockForRestock, setSelectedStockForRestock] = useState<StockItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // New product state
  const [newName, setNewName] = useState('');
  const [newNameLuganda, setNewNameLuganda] = useState('');
  const [newCategory, setNewCategory] = useState<'vegetables' | 'staples' | 'fruits' | 'proteins'>('vegetables');
  const [newQty, setNewQty] = useState<number>(20);
  const [newUnit, setNewUnit] = useState('kg');
  const [newCost, setNewCost] = useState<number>(2000);
  const [newPrice, setNewPrice] = useState<number>(3000);
  const [newThreshold, setNewThreshold] = useState<number>(10);
  const [newCode, setNewCode] = useState('PRD');

  const filteredStock = stock.filter((item) => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameLuganda.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockCount = stock.filter((s) => s.currentQty <= s.reorderThreshold).length;

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockForRestock || restockQty <= 0) return;
    onRestock(selectedStockForRestock.id, restockQty);
    setSelectedStockForRestock(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    onAddNewProduct({
      name: newName,
      nameLuganda: newNameLuganda || newName,
      icon: newCode || 'PRD',
      category: newCategory,
      currentQty: Number(newQty),
      unit: newUnit,
      unitCostUGX: Number(newCost),
      sellingPriceUGX: Number(newPrice),
      reorderThreshold: Number(newThreshold),
      lastRestocked: new Date().toISOString().split('T')[0],
    });

    setNewName('');
    setNewNameLuganda('');
    setShowAddProductModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-stone-700" />
            <h2 className="text-xl sm:text-2xl font-black text-stone-900">
              {isLuganda ? 'Sitoka y’Akatale n’Ebizze Wansi' : 'Inventory Tracking & Reorder Alerts'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {isLuganda
              ? 'Sitoka ekendera mu buli kitundiddwa n’eddoboozi. Laba ebyetaaga okugulwa enkya'
              : 'Automated stock reconciliation driven by voice transactions and minimum safety stock limits'}
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {lowStockCount > 0 && (
            <div className="p-2 px-3 bg-stone-100 rounded-xl border border-stone-200 text-xs font-bold text-stone-800 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {lowStockCount} {isLuganda ? 'ebikozezza' : 'reorder alerts'}
              </span>
            </div>
          )}

          <button
            onClick={() => setShowAddProductModal(true)}
            className="px-4 py-2.5 bg-stone-900 text-amber-400 font-bold rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 hover:bg-stone-800 transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>{isLuganda ? 'Yongerako Eky’amaguzi' : 'Add Item'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isLuganda ? 'Noonya mu sitoka...' : 'Search inventory by commodity name...'
            }
            className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-stone-900 shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto pb-1">
          {['all', 'vegetables', 'staples', 'fruits', 'proteins'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs capitalize whitespace-nowrap transition ${
                filterCategory === cat
                  ? 'bg-stone-900 text-amber-400 shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
              }`}
            >
              {cat === 'all' ? (isLuganda ? 'Byonna' : 'All') : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredStock.map((item) => {
          const isLow = item.currentQty <= item.reorderThreshold;
          const percentage = Math.min(100, Math.round((item.currentQty / (item.reorderThreshold * 2.5)) * 100));
          const unitProfit = item.sellingPriceUGX - item.unitCostUGX;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all ${
                isLow ? 'border-amber-400 ring-1 ring-amber-400/40' : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center font-mono font-bold text-stone-800 text-xs border border-stone-200">
                    {item.icon}
                  </div>
                  {isLow ? (
                    <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>{isLuganda ? 'Ezze Wansi' : 'Low Stock'}</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] font-semibold">
                      {isLuganda ? 'Erimu' : 'Adequate'}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-stone-900 text-base">
                    {isLuganda ? item.nameLuganda : item.name}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {isLuganda ? item.name : item.nameLuganda}
                  </p>
                </div>

                {/* Stock Level Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-stone-500">{isLuganda ? 'Erisigaddeyo:' : 'Remaining:'}</span>
                    <span className="font-mono font-bold text-lg text-stone-900">
                      {item.currentQty} <span className="text-xs font-normal text-stone-500">{item.unit}</span>
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLow ? 'bg-rose-500' : 'bg-stone-900'
                      }`}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-stone-400 font-mono">
                    <span>Threshold:</span>
                    <span>{item.reorderThreshold} {item.unit}</span>
                  </div>
                </div>

                {/* Pricing Info */}
                <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                      {isLuganda ? 'Cost' : 'Wholesale'}
                    </span>
                    <span className="font-mono font-bold text-stone-700">
                      UGX {item.unitCostUGX.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                      {isLuganda ? 'Retail' : 'Selling'}
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      UGX {item.sellingPriceUGX.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-1 text-[11px] text-stone-500">
                  {isLuganda ? 'Amagoba ku buli' : 'Margin per'} {item.unit}:{' '}
                  <span className="font-mono font-bold text-stone-900">
                    +UGX {unitProfit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Restock Button */}
              <div className="mt-4 pt-3 border-t border-stone-100">
                <button
                  onClick={() => {
                    setSelectedStockForRestock(item);
                    setRestockQty(item.reorderThreshold * 2);
                  }}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800 font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isLuganda ? 'Gula Sitoka' : 'Restock Item'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Restock Modal */}
      {selectedStockForRestock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200 text-stone-900">
            <h3 className="font-bold text-base text-stone-900 mb-1">
              {isLuganda ? 'Yongera ku Sitoka' : 'Restock Produce'}
            </h3>
            <p className="text-xs text-stone-500 mb-4 font-mono">
              {isLuganda ? selectedStockForRestock.nameLuganda : selectedStockForRestock.name} (Current: {selectedStockForRestock.currentQty} {selectedStockForRestock.unit})
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">
                  {isLuganda
                    ? `Oguze bimeka (${selectedStockForRestock.unit})?`
                    : `Quantity to add (${selectedStockForRestock.unit}):`}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty || ''}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-stone-900 font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStockForRestock(null)}
                  className="flex-1 py-2 border border-stone-300 text-stone-600 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold rounded-lg text-xs"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 text-stone-900">
            <h3 className="font-bold text-base text-stone-900 mb-3">
              {isLuganda ? 'Yongerako Eky’amaguzi Ekipya' : 'Add New Inventory Line'}
            </h3>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    English Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Garlic"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Luganda Name:
                  </label>
                  <input
                    type="text"
                    value={newNameLuganda}
                    onChange={(e) => setNewNameLuganda(e.target.value)}
                    placeholder="e.g. Katungulukumu"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Initial Qty:
                  </label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Unit:
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-2 text-xs"
                  >
                    <option value="kg">kg</option>
                    <option value="bunch">bunch</option>
                    <option value="sack">sack</option>
                    <option value="piece">piece</option>
                    <option value="cluster">cluster</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Code (3 chars):
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-center font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Wholesale Cost (UGX):
                  </label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    Retail Selling (UGX):
                  </label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-2 border border-stone-300 text-stone-600 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold rounded-lg text-xs"
                >
                  Save Line
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
