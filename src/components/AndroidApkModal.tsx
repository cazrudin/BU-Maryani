import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  ExternalLink,
  Copy,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Globe,
  Share2,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
}

export function AndroidApkModal({ isOpen, onClose, appUrl }: AndroidApkModalProps) {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  // Use the public shared or origin URL for PWABuilder
  const targetUrl = appUrl.startsWith('http') ? appUrl : window.location.origin;
  const pwaBuilderUrl = `https://www.pwabuilder.com/report?url=${encodeURIComponent(targetUrl)}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectInstall = async () => {
    setInstalling(true);
    try {
      const result = await install();
      if (result) {
        setInstallSuccess(true);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 bg-linear-to-r from-emerald-800 via-emerald-700 to-amber-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-200 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Aplikasi Android (.APK & PWA)
                </h3>
                <span className="bg-emerald-400/30 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300/30">
                  Android Ready
                </span>
              </div>
              <p className="text-xs text-emerald-100/90">
                Pusat Oleh Oleh Klaten - Bu Maryani siap dipasang langsung di smartphone Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-neutral-800">
          {/* Method 1: Direct 1-Click Install to Android Phone */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/50 space-y-3.5 relative overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="font-bold text-sm sm:text-base text-emerald-950">
                  Pasang Langsung ke HP Android (Instalasi Instan)
                </h4>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Paling Mudah & Cepat
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
              Aplikasi telah dilengkapi standar resmi <strong>Progressive Web App (PWA)</strong>. Anda bisa langsung memasangnya ke layar utama HP Android Anda tanpa perlu mendownload file APK besar. Aplikasi akan memiliki <strong>ikon Bu Maryani</strong>, beroperasi layar penuh, ringan, dan cepat!
            </p>

            {isInstalled || installSuccess ? (
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Aplikasi sudah terpasang di perangkat Anda! Buka lewat menu atau layar utama HP.</span>
              </div>
            ) : isInstallable ? (
              <div className="pt-1">
                <button
                  type="button"
                  id="btn-install-apk-prompt"
                  onClick={handleDirectInstall}
                  disabled={installing}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{installing ? 'Memproses...' : 'Pasang Aplikasi ke HP Sekarang'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/80 space-y-2 text-xs text-neutral-700">
                <div className="font-bold text-neutral-900 flex items-center gap-1.5 text-xs">
                  <Info className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cara Pasang di HP Android via Google Chrome:</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-neutral-600">
                  <li>
                    Buka link toko ini di browser <strong>Google Chrome</strong> di HP Anda.
                  </li>
                  <li>
                    Klik menu <strong>Titik Tiga (⋮)</strong> di pojok kanan atas Chrome.
                  </li>
                  <li>
                    Pilih <strong>&quot;Install aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
                  </li>
                  <li>
                    Aplikasi toko Bu Maryani otomatis muncul di beranda HP Anda layaknya aplikasi Play Store!
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Method 2: Generate & Download Official .APK via PWABuilder */}
          <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-neutral-50/70 space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-neutral-800 text-white font-black text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="font-bold text-sm sm:text-base text-neutral-900">
                  Download File Mentah (.APK / .AAB) untuk Android
                </h4>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200">
                File .APK Asli
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Jika Anda memerlukan berkas biner <code>.apk</code> untuk dibagikan lewat WhatsApp atau diunggah ke Google Play Store, Anda dapat meng-generate file APK secara gratis dan instan menggunakan <strong>PWABuilder (layanan resmi Google & Microsoft TWA)</strong>:
            </p>

            <div className="bg-white p-3.5 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-neutral-500 font-medium">Link Web Toko Anda:</span>
                <div className="flex items-center gap-1.5 bg-neutral-100 px-2.5 py-1.5 rounded-lg border border-neutral-200 font-mono text-[11px] text-neutral-800 truncate max-w-full">
                  <Globe className="w-3 h-3 text-neutral-500 shrink-0" />
                  <span className="truncate">{targetUrl}</span>
                  <button
                    onClick={handleCopyUrl}
                    className="ml-1 text-emerald-700 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
                    title="Salin Link"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Buka Generator APK (PWABuilder)</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>URL Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Salin Link Web Toko</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-neutral-500 leading-normal border-t border-neutral-100 pt-2.5">
                💡 <em>Langkah di PWABuilder:</em> Klik tombol di atas &rarr; Tekan tombol <strong>&quot;Package for Stores&quot;</strong> &rarr; Pilih <strong>&quot;Android&quot;</strong> &rarr; Klik <strong>&quot;Generate APK&quot;</strong>. File <code>.apk</code> langsung siap diunduh!
              </div>
            </div>
          </div>

          {/* Highlights & Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-neutral-900 font-semibold">Ringan & Cepat</strong>
                <span className="text-neutral-500 text-[11px]">Hanya &lt; 2 MB di HP</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <strong className="block text-neutral-900 font-semibold">Tampilan Bersih</strong>
                <span className="text-neutral-500 text-[11px]">Layar penuh tanpa URL bar</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-2.5">
              <Share2 className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <strong className="block text-neutral-900 font-semibold">Otomatis Update</strong>
                <span className="text-neutral-500 text-[11px]">Stok & harga selalu baru</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Ikon & Manifest Toko Bu Maryani telah terpasang
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
