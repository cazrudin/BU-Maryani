import React from 'react';
import { Product, Order, StoreSettings } from '../types';
import {
  downloadOrdersCsv,
  downloadProductsCsv,
  downloadStoreBackupJson,
} from '../utils/downloadHelpers';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  Code2,
  ExternalLink,
  X,
  CheckCircle2,
  Archive,
  Info,
  Smartphone,
} from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  onOpenSheetsTab?: () => void;
  onOpenAndroidApk?: () => void;
}

export function DownloadModal({
  isOpen,
  onClose,
  products,
  orders,
  settings,
  onOpenSheetsTab,
  onOpenAndroidApk,
}: DownloadModalProps) {
  if (!isOpen) return null;

  const handleDownloadOrders = () => {
    downloadOrdersCsv(orders, settings.storeName);
  };

  const handleDownloadProducts = () => {
    downloadProductsCsv(products, settings.storeName);
  };

  const handleDownloadBackup = () => {
    downloadStoreBackupJson(products, orders, settings);
  };

  const activeSpreadsheetId = settings.googleSpreadsheetId;
  const excelDownloadUrl = activeSpreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${activeSpreadsheetId}/export?format=xlsx`
    : null;
  const pdfDownloadUrl = activeSpreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${activeSpreadsheetId}/export?format=pdf`
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 bg-amber-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-800/80 flex items-center justify-center text-amber-200">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Pusat Download File & Data Toko
              </h3>
              <p className="text-xs text-amber-200/90">
                Download laporan pesanan, katalog snack, backup data, atau file aplikasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-amber-800/60 hover:bg-amber-800 flex items-center justify-center text-amber-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-neutral-800">
          {/* Section 1: Data Files (Excel/CSV & JSON) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>1. Download Laporan & Data Toko (Excel / CSV / JSON)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option A: Orders CSV */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-50 transition-all flex flex-col justify-between gap-3">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-xs text-neutral-900">
                    Laporan Pesanan (.CSV)
                  </h5>
                  <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                    Daftar {orders.length} pesanan pembeli lengkap (Nama, WA, Alamat, Total, Status). Bisa dibuka di Excel.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-download-orders-csv"
                  onClick={handleDownloadOrders}
                  className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              {/* Option B: Products CSV */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-50 transition-all flex flex-col justify-between gap-3">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-xs text-neutral-900">
                    Katalog & Stok (.CSV)
                  </h5>
                  <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                    Daftar {products.length} snack, harga jual, dan sisa stok terkini. Cocok untuk opname stok fisik.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-download-products-csv"
                  onClick={handleDownloadProducts}
                  className="w-full py-2 px-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              {/* Option C: Backup JSON */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-50 transition-all flex flex-col justify-between gap-3">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-2">
                    <Database className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-xs text-neutral-900">
                    Backup Lengkap (.JSON)
                  </h5>
                  <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                    Seluruh basis data toko (produk, pesanan, dan konfigurasi) untuk arsip aman atau cadangan.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-download-backup-json"
                  onClick={handleDownloadBackup}
                  className="w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Android APK & Mobile App */}
          <div className="p-4 rounded-2xl border-2 border-emerald-500/80 bg-linear-to-r from-emerald-50 to-amber-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>2. Pasang & Download Aplikasi Android (.APK / PWA)</span>
              </h4>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                Android Ready
              </span>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed">
              Aplikasi Bu Maryani (Pusat Oleh Oleh Klaten) telah siap dijadikan aplikasi HP Android! Anda dapat langsung memasangnya ke layar beranda smartphone atau men-generate file mentah <strong>.APK</strong> resmi via PWABuilder.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {onOpenAndroidApk && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAndroidApk();
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Buka Menu Download & Pasang APK</span>
                </button>
              )}
              <span className="text-[11px] text-neutral-500">
                Layar penuh, ikon aplikasi resmi, dan tanpa batas browser.
              </span>
            </div>
          </div>

          {/* Section 3: Google Sheets Live Export (Excel .xlsx & PDF) */}
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>2. Download dari Google Sheets Terhubung (.XLSX & PDF)</span>
              </h4>
              {activeSpreadsheetId && (
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Terhubung
                </span>
              )}
            </div>

            {activeSpreadsheetId ? (
              <div className="space-y-2.5">
                <p className="text-xs text-neutral-600">
                  Spreadsheet aktif:{' '}
                  <strong className="text-neutral-900 font-semibold">
                    {settings.googleSpreadsheetName || 'Spreadsheet Pembukuan Bu Maryani'}
                  </strong>
                  . Anda dapat langsung mengunduh file spreadsheet dalam format Excel (.xlsx) atau dokumen PDF:
                </p>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {excelDownloadUrl && (
                    <a
                      href={excelDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File Excel (.xlsx)</span>
                    </a>
                  )}
                  {pdfDownloadUrl && (
                    <a
                      href={pdfDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Download Dokumen PDF (.pdf)</span>
                    </a>
                  )}
                  <a
                    href={settings.googleSpreadsheetUrl || `https://docs.google.com/spreadsheets/d/${activeSpreadsheetId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 text-emerald-800 hover:text-emerald-950 text-xs font-bold inline-flex items-center gap-1.5 underline"
                  >
                    <span>Buka Google Sheets</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-600">
                <p>
                  Belum menghubungkan Google Sheets. Hubungkan akun Google untuk sinkronisasi otomatis dan unduh file format Excel (.xlsx) langsung dari Google Drive.
                </p>
                {onOpenSheetsTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSheetsTab();
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shrink-0 cursor-pointer"
                  >
                    Buka Google Sheets
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Download Source Code Aplikasi (ZIP) */}
          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-3">
            <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              <span>3. Download Source Code Aplikasi Web Ini (File .ZIP)</span>
            </h4>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Jika Anda ingin mengunduh seluruh file kodingan proyek (React + Vite + TypeScript) untuk disimpan di komputer atau dijalankan secara lokal:
            </p>

            <div className="bg-white p-3.5 rounded-xl border border-neutral-200 text-xs text-neutral-700 space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </div>
                <div>
                  Lihat ke menu panel atas di halaman <strong>Google AI Studio</strong> (di atas atau pojok kanan atas jendela layar).
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </div>
                <div>
                  Klik ikon <strong>Titik Tiga (&bull;&bull;&bull;)</strong> atau tombol <strong>Settings / Bagikan</strong> di pojok kanan atas.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </div>
                <div>
                  Pilih opsi <strong>&quot;Export as ZIP&quot;</strong> atau <strong>&quot;Export to GitHub&quot;</strong>. Browser Anda akan langsung mengunduh seluruh file proyek aplikasi ini dalam satu berkas <code>.zip</code>.
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center gap-2 text-[11px] text-blue-900 font-medium">
              <Info className="w-4 h-4 text-blue-700 shrink-0" />
              <span>
                File ZIP tersebut berisi seluruh kode sumber lengkap, aset ikon/gambar, dan file konfigurasi yang siap Anda jalankan dengan perintah <code>npm install</code> & <code>npm run dev</code>.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end">
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
