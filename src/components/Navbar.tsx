import { ShoppingBag, Lock, Share2, Search, MapPin, FileSpreadsheet } from 'lucide-react';
import { StoreSettings } from '../types';
import { StoreLogo } from './StoreLogo';

interface NavbarProps {
  settings: StoreSettings;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onOpenShare: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAdminLoggedIn: boolean;
}

export function Navbar({
  settings,
  cartCount,
  onOpenCart,
  onOpenAdmin,
  onOpenShare,
  searchQuery,
  setSearchQuery,
  isAdminLoggedIn,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xs">
      {/* Top micro bar */}
      <div className="bg-red-700 text-white text-xs py-1.5 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-[11px] sm:text-xs">
            <MapPin className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
            <span className="truncate">Kios Pasar Klaten, Jawa Tengah • Buka: {settings.openingHours}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] sm:text-xs">
            <button
              id="share-header-btn"
              onClick={onOpenShare}
              className="hover:text-yellow-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan Toko</span>
            </button>
            {settings.googleSpreadsheetId && (
              <>
                <span className="text-white/40">|</span>
                <a
                  href={settings.googleSpreadsheetUrl || `https://docs.google.com/spreadsheets/d/${settings.googleSpreadsheetId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-200 flex items-center gap-1 cursor-pointer transition-colors text-emerald-200 font-semibold"
                  title="Buka Google Sheets Toko Bu Maryani"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Google Sheets</span>
                </a>
              </>
            )}
            <span className="text-white/40">|</span>
            <button
              id="admin-login-top-btn"
              onClick={onOpenAdmin}
              className="hover:text-yellow-200 flex items-center gap-1 cursor-pointer transition-colors font-medium"
            >
              <Lock className="w-3.5 h-3.5 text-yellow-300" />
              <span>{isAdminLoggedIn ? 'Kelola Toko (Aktif)' : 'Kelola Toko'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-3 md:gap-6">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            <StoreLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-emerald-800 uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  PUSAT OLEH OLEH KLATEN
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-red-600">
                  Since 1965
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-3xl font-cooper text-red-700 tracking-tight leading-none mt-1">
                {settings.storeName === 'Toko Oleh Oleh Bu Maryani' ? 'Bu Maryani' : (settings.storeName || 'Bu Maryani')}
              </h1>
              <p className="text-[11px] sm:text-xs text-neutral-600 font-medium hidden sm:block mt-0.5">
                Kios Pasar Klaten • Aneka Snack Gurih &amp; Manis Khas Klaten
              </p>
            </div>
          </div>

          {/* Search bar desktop */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-desktop-input"
              type="text"
              placeholder="Cari keripik paru, jenang dodol, slondok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-50/80 border border-neutral-200 rounded-full focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 font-semibold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="admin-action-btn"
              onClick={onOpenAdmin}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                isAdminLoggedIn
                  ? 'bg-red-50 border-red-300 text-red-800 shadow-xs'
                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-red-600" />
              <span>{isAdminLoggedIn ? 'Panel Admin' : 'Admin'}</span>
            </button>

            {/* Cart Button */}
            <button
              id="cart-trigger-btn"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md shadow-red-600/25 transition-all cursor-pointer"
              aria-label="Buka Keranjang Belanja"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Keranjang</span>
              {cartCount > 0 ? (
                <span className="bg-yellow-300 text-neutral-900 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              ) : (
                <span className="text-red-200 text-xs">0</span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar mobile */}
        <div className="mt-2.5 md:hidden relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-mobile-input"
            type="text"
            placeholder="Cari snack oleh-oleh Klaten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-full focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
