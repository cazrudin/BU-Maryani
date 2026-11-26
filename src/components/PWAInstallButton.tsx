import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, X } from 'lucide-react';

interface PWAInstallButtonProps {
  onOpenApkModal?: () => void;
}

export function PWAInstallButton({ onOpenApkModal }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already running as standalone app or user dismissed the mini bar, don't show the sticky banner
  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-linear-to-r from-emerald-800 to-amber-900 text-white px-3 py-1.5 text-xs flex items-center justify-between shadow-xs border-b border-white/10">
        <div className="flex items-center gap-2 max-w-[70%] sm:max-w-none truncate">
          <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center shrink-0">
            <Smartphone className="w-3.5 h-3.5 text-amber-200" />
          </div>
          <span className="truncate">
            <strong className="font-semibold text-amber-200">Aplikasi Android:</strong> Pasang aplikasi Bu Maryani ke HP Anda untuk akses lebih cepat & mudah!
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isInstallable ? (
            <button
              id="header-install-pwa-btn"
              onClick={install}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3 h-3" />
              <span>Pasang ke HP</span>
            </button>
          ) : isIOS ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium text-[11px] transition-colors cursor-pointer"
            >
              Pasang di iOS
            </button>
          ) : null}

          {onOpenApkModal && (
            <button
              onClick={onOpenApkModal}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white rounded-lg font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Info .APK</span>
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="text-white/60 hover:text-white p-1 transition-colors cursor-pointer"
            title="Sembunyikan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-neutral-800">
            <h3 className="text-base font-bold text-neutral-900 mb-2">
              Pasang di iPhone / iPad
            </h3>
            <p className="text-xs text-neutral-600 space-y-1.5 leading-relaxed">
              1. Buka halaman ini di browser <strong>Safari</strong>.<br />
              2. Tekan tombol <strong>Share</strong> (ikon kotak panah ke atas) di menu bawah.<br />
              3. Gulir ke bawah lalu pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-neutral-900 py-2 text-xs font-bold text-white hover:bg-neutral-800 cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
