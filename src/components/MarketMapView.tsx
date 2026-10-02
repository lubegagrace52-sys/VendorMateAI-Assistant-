import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MarketPrice, Language, GroundingSource } from '../types';
import { MARKETS_DATA, UI_TRANSLATIONS } from '../data/mockData';
import {
  MapPin,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Info,
  DollarSign,
  PlusCircle,
  CheckCircle2,
  Search,
  ExternalLink,
  Volume2,
} from 'lucide-react';

interface MarketMapViewProps {
  language: Language;
  onPlayAudio: (text: string) => void;
}

export const MarketMapView: React.FC<MarketMapViewProps> = ({
  language,
  onPlayAudio,
}) => {
  const t = UI_TRANSLATIONS[language];
  const isLuganda = language === 'luganda';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedProduce, setSelectedProduce] = useState<string>('Tomatoes');
  const [marketsList, setMarketsList] = useState<MarketPrice[]>(MARKETS_DATA);
  const [activeMarket, setActiveMarket] = useState<MarketPrice | null>(MARKETS_DATA[1]);
  const [myCostUGX, setMyCostUGX] = useState<number>(2200);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Search Grounding Live Commodity News State
  const [searchSummary, setSearchSummary] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<GroundingSource[]>([]);
  const [isSearchingIntel, setIsSearchingIntel] = useState(false);

  // Community contribution form
  const [reportMarket, setReportMarket] = useState('Owino (St. Balikuddembe)');
  const [reportRetail, setReportRetail] = useState<number>(3000);
  const [reportWholesale, setReportWholesale] = useState<number>(2200);
  const [reportSuccess, setReportSuccess] = useState(false);

  const produceOptions = [
    { id: 'Tomatoes', nameLuganda: "Ennyaanya", code: 'TOM' },
    { id: 'Matooke', nameLuganda: 'Amatooke', code: 'MAT' },
    { id: 'Red Onions', nameLuganda: 'Obutungulu', code: 'ONI' },
    { id: 'Irish Potatoes', nameLuganda: 'Obummonde', code: 'POT' },
    { id: 'Cabbage', nameLuganda: 'Emboga', code: 'CAB' },
    { id: 'Beans', nameLuganda: 'Ebijanjaalo', code: 'BEA' },
  ];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [0.325, 32.58],
        zoom: 12,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | VendorMateAI Uganda Terminal',
        maxZoom: 18,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      leafletMapRef.current = map;
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update map markers
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    marketsList.forEach((mkt) => {
      const isGlut = mkt.isGlut;
      const isShortage = mkt.isShortage;

      const badgeStyle = isGlut
        ? 'bg-rose-700 text-white border border-rose-500'
        : isShortage
        ? 'bg-emerald-700 text-white border border-emerald-500'
        : 'bg-stone-900 text-amber-400 border border-stone-700';

      const tagText = isGlut ? 'SURPLUS' : isShortage ? 'HIGH MARGIN' : 'ACTIVE';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="flex flex-col items-center transform -translate-x-1/2 -translate-y-full cursor-pointer">
            <div class="${badgeStyle} px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-md flex items-center gap-1 whitespace-nowrap">
              <span>${tagText}:</span>
              <span>UGX ${mkt.retailPriceUGX.toLocaleString()}</span>
            </div>
            <div class="w-2 h-2 bg-stone-900 rotate-45 -mt-1 shadow-sm"></div>
          </div>
        `,
        iconSize: [100, 36],
        iconAnchor: [50, 32],
      });

      const marker = L.marker([mkt.lat, mkt.lng], { icon: customIcon });

      marker.on('click', () => {
        setActiveMarket(mkt);
      });

      marker.bindPopup(`
        <div class="p-2 text-stone-900 font-sans text-xs">
          <div class="font-bold text-sm text-stone-900">${mkt.marketName}</div>
          <div class="text-[11px] text-stone-500 mb-1">${mkt.cityOrDistrict} (${mkt.distanceKm} km)</div>
          <div class="font-mono font-bold text-emerald-700">Retail: UGX ${mkt.retailPriceUGX.toLocaleString()}/${mkt.unit}</div>
          <div class="font-mono text-stone-600">Wholesale: UGX ${mkt.wholesalePriceUGX.toLocaleString()}/${mkt.unit}</div>
          ${mkt.isGlut ? '<div class="mt-1 font-bold text-rose-600 font-mono text-[10px]">[SURPLUS GLUT WARNING]</div>' : ''}
        </div>
      `);

      markersLayerRef.current?.addLayer(marker);
    });
  }, [marketsList, selectedProduce]);

  // Google Search Grounding for live commodity intelligence
  const handleQueryLiveSearch = async () => {
    setIsSearchingIntel(true);
    try {
      const res = await fetch('/api/search/commodity-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Uganda ${selectedProduce} wholesale retail prices Kalerwe Owino Nakasero Kampala 2026`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSearchSummary(data.summary);
        setSearchSources(data.sources || []);
      }
    } catch (e) {
      console.error('Search grounding error:', e);
    } finally {
      setIsSearchingIntel(false);
    }
  };

  const prices = marketsList.map((m) => m.retailPriceUGX);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  const glutMarket = marketsList.find((m) => m.isGlut);

  const glutAudioLuganda = glutMarket
    ? `Okulabula kw'ennyaanya ezeyiye: E Kalerwe ennyaanya ziyiise nnyo olwa leero. Bbeeyi ya wholesale yagudde ku UGX ${glutMarket.wholesalePriceUGX.toLocaleString()}. Weewale okusuza ennyaanya nnyingi. Zikung'aanye ozitunde mangu oba ozitwale e Nakasero gye zitundibwa ku UGX 4,200.`
    : `Bbeeyi y'ennyaanya eri wakati wa UGX ${minPrice.toLocaleString()} ne ${maxPrice.toLocaleString()}.`;

  const glutAudioEnglish = glutMarket
    ? `Market surplus advisory: High tomato supply recorded at Kalerwe Market with wholesale dropping to UGX ${glutMarket.wholesalePriceUGX.toLocaleString()} per kg. Recommend fast inventory turnover at UGX 2,800 to prevent post-harvest spoilage, or arbitrage to Nakasero for premium margins.`
    : `Current market fair price ranges between UGX ${minPrice.toLocaleString()} and ${maxPrice.toLocaleString()}.`;

  const handleContributePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportRetail || reportRetail <= 0) return;

    const updated = marketsList.map((m) => {
      if (m.marketName === reportMarket) {
        return {
          ...m,
          retailPriceUGX: reportRetail,
          wholesalePriceUGX: reportWholesale || Math.round(reportRetail * 0.7),
          reportedByCount: m.reportedByCount + 1,
          lastUpdated: 'Just now',
        };
      }
      return m;
    });

    setMarketsList(updated);
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setShowSubmitModal(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-stone-700" />
            <h2 className="text-xl sm:text-2xl font-black text-stone-900">
              {isLuganda ? 'Maapu y’Akatale, Bbeeyi Entuufu n’Ebeyiye' : 'Market Mapping & Pricing Intelligence'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {isLuganda
              ? 'Bbeeyi ez’obwesigwa okuva mu butale bw’e Kampala ne Uganda n’okulabula ku bbeeyi eziri wansi'
              : 'Crowd-sourced pricing mapped across Kampala and regional hubs, with Google Search grounding'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleQueryLiveSearch}
            disabled={isSearchingIntel}
            className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition"
          >
            <Search className="w-3.5 h-3.5 text-stone-600" />
            <span>{isSearchingIntel ? 'Querying Web...' : 'Live Search Intel'}</span>
          </button>

          <button
            onClick={() => onPlayAudio(isLuganda ? glutAudioLuganda : glutAudioEnglish)}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isLuganda ? 'Wuliriza Bbeeyi' : 'Audio Briefing'}</span>
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isLuganda ? 'Taako Bbeeyi' : 'Report Price'}</span>
          </button>
        </div>
      </div>

      {/* Live Google Search Grounded News Card */}
      {searchSummary && (
        <div className="bg-stone-900 text-white rounded-2xl p-5 border border-stone-800 shadow-md">
          <div className="flex items-center justify-between mb-2 border-b border-stone-800 pb-2">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Google Search Grounded Commodity Intelligence
              </span>
            </div>
            <button
              onClick={() => setSearchSummary(null)}
              className="text-xs text-stone-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
            {searchSummary}
          </p>
          {searchSources.length > 0 && (
            <div className="mt-3 pt-2 border-t border-stone-800 flex flex-wrap gap-2 text-xs">
              <span className="text-stone-400 text-[11px] font-mono">Sources:</span>
              {searchSources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-400 text-[11px] transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{src.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Produce Selector Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {produceOptions.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedProduce(item.id)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition flex items-center space-x-2 border shadow-sm ${
              selectedProduce === item.id
                ? 'bg-stone-900 text-amber-400 border-stone-900'
                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
            }`}
          >
            <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-stone-800 text-stone-300">
              {item.code}
            </span>
            <span>{isLuganda ? item.nameLuganda : item.id}</span>
          </button>
        ))}
      </div>

      {/* Glut Warning Banner */}
      {glutMarket && (
        <div className="bg-stone-50 border border-stone-300 rounded-2xl p-5 text-stone-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
              ALERT
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-rose-700 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100">
                  {isLuganda ? 'Okulabula Kw’Ebyeyiye' : 'Glut / Surplus Advisory'}
                </span>
                <span className="text-xs font-bold text-stone-800">{glutMarket.marketName}</span>
              </div>
              <h4 className="font-bold text-sm sm:text-base text-stone-900 mt-1">
                {isLuganda
                  ? `Ennyaanya zeyiye e Kalerwe. Wholesale yagudde ku UGX ${glutMarket.wholesalePriceUGX.toLocaleString()}/kg`
                  : `Tomato supply surplus reported at Kalerwe. Wholesale compressed to UGX ${glutMarket.wholesalePriceUGX.toLocaleString()}/kg`}
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                {isLuganda
                  ? 'Weewale okusuza ennyaanya nnyingi mu dduuka zireme kuvunda. Ziseze ku 2,800 UGX oba zitwale e Nakasero gye zitundibwa ku 4,200 UGX.'
                  : 'Farmers from Luweero and Kayunga arrived with heavy bulk shipments. Accelerate sales velocity at UGX 2,800 to mitigate spoilage, or transfer inventory to Nakasero.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onPlayAudio(isLuganda ? glutAudioLuganda : glutAudioEnglish)}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-xs rounded-xl shadow shrink-0 flex items-center space-x-1"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isLuganda ? 'Wuliriza Amagezi' : 'Play Audio Tip'}</span>
          </button>
        </div>
      )}

      {/* Main Grid: Leaflet Map (Left) + Fair Price Suggester (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                {isLuganda ? 'Maapu y’Obutale (Leaflet)' : 'Live Leaflet Terminal Map (Uganda)'}
              </span>
            </div>
            <span className="text-xs text-stone-500 font-mono">
              {marketsList.length} markets active
            </span>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-stone-200 relative z-0"
          ></div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-stone-600 px-2 pt-2 border-t border-stone-100 gap-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-700"></span>
                <span>Surplus Glut</span>
              </div>
              <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span>
                <span>High Margin</span>
              </div>
              <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-900"></span>
                <span>Balanced</span>
              </div>
            </div>
            <span className="text-[11px] text-stone-400 font-mono">
              Select marker for pricing metrics
            </span>
          </div>
        </div>

        {/* Fair Price & Profit Calculator */}
        <div className="space-y-4">
          <div className="bg-stone-900 text-stone-100 p-5 sm:p-6 rounded-2xl border border-stone-800 shadow-md">
            <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded bg-stone-800 text-amber-400 font-mono text-[11px] uppercase tracking-wider mb-3">
              <span>{isLuganda ? 'Bbeeyi Entuufu' : 'Fair Price Benchmark'}</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-stone-400 uppercase tracking-wider block font-semibold">
                {isLuganda ? `Bbeeyi Enzire (${selectedProduce}):` : `Suggested Selling Band (${selectedProduce}):`}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                UGX {minPrice.toLocaleString()} - {maxPrice.toLocaleString()}
              </div>
              <p className="text-xs text-stone-300">
                {isLuganda ? 'Bbeeyi ya wakati:' : 'Kampala regional average:'}{' '}
                <span className="font-bold text-white font-mono">UGX {avgPrice.toLocaleString()} / kg</span>
              </p>
            </div>

            {/* Profit margin simulator */}
            <div className="mt-5 pt-4 border-t border-stone-800 space-y-3">
              <label className="text-xs font-semibold text-stone-400 block">
                {isLuganda ? 'Oguze ku mmeka (Wholesale Cost in UGX)?' : 'Wholesale Procurement Cost (UGX/kg):'}
              </label>
              <input
                type="number"
                value={myCostUGX}
                onChange={(e) => setMyCostUGX(Number(e.target.value))}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-stone-700"
              />

              {myCostUGX > 0 && (
                <div className="p-3 rounded-xl bg-stone-950 text-xs space-y-1 border border-stone-800/80 font-mono">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Margin at average:</span>
                    <span className="font-bold text-emerald-400">
                      +UGX {(avgPrice - myCostUGX).toLocaleString()} ({Math.round(((avgPrice - myCostUGX) / avgPrice) * 100)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Breakeven baseline:</span>
                    <span className="font-bold text-amber-400">
                      UGX {Math.round(myCostUGX * 1.15).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Market Card */}
          {activeMarket && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm sm:text-base">{activeMarket.marketName}</h4>
                  <p className="text-xs text-stone-500 font-mono">{activeMarket.cityOrDistrict}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-xs font-mono">
                  {activeMarket.distanceKm} km
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                  <span className="text-stone-400 block mb-0.5 font-semibold">{isLuganda ? 'Kutunda' : 'Retail Price'}</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">
                    UGX {activeMarket.retailPriceUGX.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                  <span className="text-stone-400 block mb-0.5 font-semibold">{isLuganda ? 'Wholesale' : 'Wholesale Price'}</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">
                    UGX {activeMarket.wholesalePriceUGX.toLocaleString()}
                  </span>
                </div>
              </div>

              {activeMarket.adviceNote && (
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-700">
                  <span className="font-bold block mb-0.5 text-stone-900 font-mono text-[11px] uppercase">
                    Commercial Note:
                  </span>
                  <p>{activeMarket.adviceNote}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contribute Price Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-stone-900">
                {isLuganda ? 'Taako Bbeeyi ey’Akatale k’Olimu' : 'Report Field Commodity Price'}
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center text-emerald-700 flex flex-col items-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2" />
                <h4 className="font-bold text-sm">
                  {isLuganda ? 'Bbeeyi yo yongeddwa ku maapu bulungi.' : 'Price updated successfully.'}
                </h4>
              </div>
            ) : (
              <form onSubmit={handleContributePrice} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    {isLuganda ? 'Akatale kano:' : 'Market Venue:'}
                  </label>
                  <select
                    value={reportMarket}
                    onChange={(e) => setReportMarket(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-900"
                  >
                    {marketsList.map((m) => (
                      <option key={m.id} value={m.marketName}>
                        {m.marketName} ({m.cityOrDistrict})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    {isLuganda ? `Bbeeyi y’okutunda (${selectedProduce} UGX/kg):` : `Retail Selling Rate (${selectedProduce} UGX/kg):`}
                  </label>
                  <input
                    type="number"
                    required
                    value={reportRetail || ''}
                    onChange={(e) => setReportRetail(Number(e.target.value))}
                    placeholder="e.g. 3200"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">
                    {isLuganda ? `Bbeeyi ya Wholesale (UGX/kg):` : `Wholesale Rate (UGX/kg):`}
                  </label>
                  <input
                    type="number"
                    value={reportWholesale || ''}
                    onChange={(e) => setReportWholesale(Number(e.target.value))}
                    placeholder="e.g. 2400"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 py-2 border border-stone-300 text-stone-600 font-semibold rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold rounded-lg text-xs"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
