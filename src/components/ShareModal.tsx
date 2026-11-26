import { useState } from 'react';
import { StoreSettings } from '../types';
import { X, Copy, Check, Share2, MessageCircle } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
}

export function ShareModal({ isOpen, onClose, settings }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rawUrl = window.location.origin;
  const currentUrl = rawUrl.includes('://ais-dev-')
    ? rawUrl.replace('://ais-dev-', '://ais-pre-')
    : rawUrl;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWa = () => {
    const text = `Halo! Yuk intip aneka snack dan oleh-oleh khas Klaten gurih renyah di *${settings.storeName}*.\n\nBisa langsung pilih snack, cek stok real-time, dan pesan via WhatsApp di sini:\n${currentUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: settings.storeName,
          text: `Belanja snack oleh-oleh khas Klaten di ${settings.storeName}`,
          url: currentUrl,
        });
      } catch {
        // cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="share-store-modal"
        className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-neutral-200 text-center"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <img
          src="/logo.png"
          alt="Logo Bu Maryani"
          className="h-14 w-auto mx-auto object-contain mb-2 drop-shadow-sm"
        />

        <h3 className="text-lg font-extrabold text-neutral-900">
          Bagikan Link Toko ke Pelanggan
        </h3>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          Pelanggan bisa langsung melihat katalog, cek ketersediaan stok, dan memesan via WhatsApp.
        </p>

        {/* QR Code */}
        <div className="w-40 h-40 mx-auto p-2 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-center mb-4">
          <img
            src={qrUrl}
            alt="QR Code Toko"
            className="w-full h-full object-contain rounded-lg"
          />
        </div>
        <p className="text-[11px] text-neutral-400 mb-4">
          Scan QR untuk membuka toko di HP
        </p>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            id="share-whatsapp-btn"
            onClick={handleShareWa}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Bagikan ke WhatsApp</span>
          </button>

          <button
            id="copy-store-link-btn"
            onClick={handleCopy}
            className="w-full py-2.5 px-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 text-neutral-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Tautan Website</span>
              </>
            )}
          </button>

          {'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2 text-xs text-neutral-500 hover:text-neutral-800 font-medium cursor-pointer"
            >
              Bagikan via Aplikasi Lain...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
