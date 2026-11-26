import { Product, StoreSettings } from '../types';
import { Sparkles, ShieldCheck, Truck, MessageCircle, Share2, Award } from 'lucide-react';
import { StoreLogo } from './StoreLogo';

interface BannerHeroProps {
  settings: StoreSettings;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenShare: () => void;
  products?: Product[];
}

export function BannerHero({
  settings,
  activeCategory,
  onSelectCategory,
  onOpenShare,
  products = [],
}: BannerHeroProps) {
  const standardCategories = [
    { id: 'all', label: 'Semua Produk' },
    { id: 'keripik', label: '🍟 Keripik & Gurih' },
    { id: 'manis', label: '🍯 Manis & Jenang' },
    { id: 'tradisional', label: '🍘 Khas Tradisional' },
    { id: 'paket', label: '🎁 Paket Oleh-Oleh' },
  ];

  const standardIds = ['all', 'keripik', 'manis', 'tradisional', 'paket'];
  const customCategories = Array.from(
    new Set(
      products
        .map((p) => p.category?.trim())
        .filter((cat): cat is string => Boolean(cat && !standardIds.includes(cat.toLowerCase())))
    )
  ).map((cat) => ({
    id: cat,
    label: `✨ ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
  }));

  const categories = [...standardCategories, ...customCategories];

  return (
    <section className="bg-gradient-to-b from-red-50/40 via-white to-white pt-4 pb-6 border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main Banner Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-800 via-red-700 to-emerald-800 text-white p-5 sm:p-7 shadow-lg shadow-red-950/15">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/70 border border-yellow-300/40 text-yellow-300 text-xs font-bold mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>PUSAT OLEH OLEH KLATEN • Kios Pasar Klaten (Since 1965)</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-2 text-white">
                Cita Rasa Otentik Klaten, Renyah &amp; Gurih Setiap Gigitan!
              </h2>

              <p className="text-red-50 text-xs sm:text-sm leading-relaxed mb-5 max-w-lg font-normal">
                Aneka camilan khas Klaten legendaris: Keripik Paru Sapi, Keripik Belut Pedan, Jenang Dodol besek bambu, dan Slondok. Melayani Grosir &amp; Ecer, langsung pesan via WhatsApp!
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  id="hero-wa-btn"
                  href={`https://wa.me/${settings.phone}?text=${encodeURIComponent('Halo Bu Maryani, saya ingin tanya seputar oleh-oleh khas Klaten.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Pesan via WhatsApp</span>
                </a>

                <button
                  id="hero-share-btn"
                  onClick={onOpenShare}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-xs text-white text-xs sm:text-sm font-semibold border border-white/20 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Bagikan Katalog Toko</span>
                </button>
              </div>
            </div>

            {/* Official Badge on Hero Desktop & Mobile */}
            <div className="flex md:flex-col items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/20 shadow-xl shrink-0 self-center md:self-auto">
              <img
                src="/logo.png"
                alt="Logo Resmi Bu Maryani"
                className="w-28 sm:w-36 h-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
              />
              <div className="text-center text-xs">
                <div className="font-extrabold text-yellow-300 text-[11px] sm:text-xs">
                  Melayani Grosir &amp; Ecer
                </div>
                <div className="text-[10px] text-white/90">
                  WA: {settings.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Decorative backdrop light */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        </div>

        {/* Feature Highlights Bar (Dominant White) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-1">
          <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-neutral-200 text-neutral-800 text-xs shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">100% Halal &amp; Higienis</span>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-neutral-200 text-neutral-800 text-xs shadow-2xs">
            <Truck className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">Bisa Kirim ke Luar Kota</span>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-neutral-200 text-neutral-800 text-xs shadow-2xs">
            <Award className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Resep Asli Tradisional Klaten</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`category-${cat.id}-btn`}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-red-600 text-white shadow-xs shadow-red-700/20'
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
