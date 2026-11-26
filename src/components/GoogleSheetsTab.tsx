import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Product, Order, StoreSettings } from '../types';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  setAccessTokenInMemory,
} from '../services/googleAuth';
import {
  GoogleDriveFile,
  listUserSpreadsheets,
  createStoreSpreadsheet,
  exportAllOrdersToSheet,
  exportProductsToSheet,
  importProductsFromSheet,
  extractSpreadsheetId,
  ORDER_SHEET_TITLE,
  PRODUCT_SHEET_TITLE,
} from '../services/googleSheets';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  LogOut,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface GoogleSheetsTabProps {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => Promise<boolean>;
  onUpdateProductsBulk: (updatedProducts: Product[]) => void;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  itemCount?: number;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'warning' | 'danger';
  action: () => Promise<void>;
}

export function GoogleSheetsTab({
  products,
  orders,
  settings,
  onUpdateSettings,
  onUpdateProductsBulk,
}: GoogleSheetsTabProps) {
  // Auth states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Spreadsheet selection states
  const [spreadsheetInput, setSpreadsheetInput] = useState(
    settings.googleSpreadsheetId || ''
  );
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);

  // Action loading states
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isExportingOrders, setIsExportingOrders] = useState(false);
  const [isExportingProducts, setIsExportingProducts] = useState(false);
  const [isImportingProducts, setIsImportingProducts] = useState(false);

  // Status feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Mandatory confirmation dialog state for Workspace data mutations
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setAuthInitialized(true);
      },
      () => {
        setUser(null);
        setToken(null);
        setAuthInitialized(true);
      }
    );

    // Also check if in-memory token exists
    getAccessToken().then((t) => {
      if (t) setToken(t);
    });

    return () => unsubscribe();
  }, []);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setFeedback(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setAccessTokenInMemory(result.accessToken);
        setFeedback({
          type: 'success',
          message: `Berhasil terhubung dengan Google (${result.user.email})!`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login Google dibatalkan atau gagal.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Google Logout
  const handleGoogleLogout = async () => {
    try {
      await logoutGoogle();
      setUser(null);
      setToken(null);
      setDriveFiles([]);
      setFeedback({ type: 'info', message: 'Telah keluar dari akun Google.' });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Fetch Spreadsheets from Google Drive
  const handleLoadDriveSpreadsheets = async () => {
    if (!token) {
      setFeedback({ type: 'error', message: 'Silakan masuk dengan Google terlebih dahulu.' });
      return;
    }

    setIsLoadingDrive(true);
    setFeedback(null);
    try {
      const files = await listUserSpreadsheets(token);
      setDriveFiles(files);
      setShowDrivePicker(true);
      if (files.length === 0) {
        setFeedback({
          type: 'info',
          message: 'Tidak ada file spreadsheet di Google Drive Anda. Anda dapat membuat yang baru di bawah ini.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengambil file spreadsheet dari Drive.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Select a spreadsheet from Drive list
  const handleSelectDriveSpreadsheet = async (file: GoogleDriveFile) => {
    setSpreadsheetInput(file.id);
    const newSettings: StoreSettings = {
      ...settings,
      googleSpreadsheetId: file.id,
      googleSpreadsheetName: file.name,
      googleSpreadsheetUrl: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
    };
    await onUpdateSettings(newSettings);
    setShowDrivePicker(false);
    setFeedback({
      type: 'success',
      message: `Spreadsheet "${file.name}" berhasil dipilih dan disimpan!`,
    });
  };

  // Save manual spreadsheet ID / URL
  const handleSaveManualId = async () => {
    const parsedId = extractSpreadsheetId(spreadsheetInput);
    if (!parsedId) {
      setFeedback({ type: 'error', message: 'Masukkan ID atau URL Google Spreadsheet yang valid.' });
      return;
    }

    const newSettings: StoreSettings = {
      ...settings,
      googleSpreadsheetId: parsedId,
      googleSpreadsheetUrl: `https://docs.google.com/spreadsheets/d/${parsedId}/edit`,
      googleSpreadsheetName: settings.googleSpreadsheetName || 'Spreadsheet Bu Maryani',
    };

    await onUpdateSettings(newSettings);
    setSpreadsheetInput(parsedId);
    setFeedback({
      type: 'success',
      message: 'ID Spreadsheet berhasil disimpan untuk Toko Bu Maryani!',
    });
  };

  // 1-Click: Create New Store Spreadsheet in Drive
  const handleCreateNewSpreadsheet = async () => {
    if (!token) {
      setFeedback({ type: 'error', message: 'Silakan hubungkan akun Google terlebih dahulu.' });
      return;
    }

    // Confirmation dialog before creating on user's Drive
    setConfirmDialog({
      isOpen: true,
      title: 'Buat Spreadsheet Baru di Google Drive?',
      description: `Sistem akan membuat file Google Spreadsheet baru berjudul "Toko Oleh Oleh ${settings.storeName} - Pembukuan & Pesanan" lengkap dengan lembar "${ORDER_SHEET_TITLE}" dan "${PRODUCT_SHEET_TITLE}". Data produk (${products.length} snack) dan pesanan (${orders.length} order) saat ini akan langsung diisikan.`,
      confirmLabel: 'Ya, Buat Spreadsheet Baru',
      confirmVariant: 'primary',
      action: async () => {
        setIsCreatingSheet(true);
        setFeedback(null);
        try {
          const { spreadsheetId, spreadsheetUrl } = await createStoreSpreadsheet(
            token,
            settings,
            products,
            orders
          );

          const sheetName = `Toko Oleh Oleh ${settings.storeName} - Pembukuan & Pesanan`;
          const updatedSettings: StoreSettings = {
            ...settings,
            googleSpreadsheetId: spreadsheetId,
            googleSpreadsheetUrl: spreadsheetUrl,
            googleSpreadsheetName: sheetName,
            googleSheetsLastSync: new Date().toISOString(),
          };

          await onUpdateSettings(updatedSettings);
          setSpreadsheetInput(spreadsheetId);

          setFeedback({
            type: 'success',
            message: 'Spreadsheet baru berhasil dibuat dan otomatis terhubung!',
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Gagal membuat Google Spreadsheet.';
          setFeedback({ type: 'error', message: msg });
        } finally {
          setIsCreatingSheet(false);
        }
      },
    });
  };

  // Export orders with user confirmation
  const handleTriggerExportOrders = () => {
    if (!token) {
      setFeedback({ type: 'error', message: 'Silakan masuk dengan Google terlebih dahulu.' });
      return;
    }
    const currentSheetId = settings.googleSpreadsheetId || extractSpreadsheetId(spreadsheetInput);
    if (!currentSheetId) {
      setFeedback({ type: 'error', message: 'Pilih atau buat spreadsheet terlebih dahulu.' });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Perbarui Lembar "${ORDER_SHEET_TITLE}"?`,
      description: `Tindakan ini akan menuliskan seluruh ${orders.length} data pesanan yang ada saat ini ke Google Spreadsheet "${settings.googleSpreadsheetName || currentSheetId}". Data lama pada lembar pesanan akan diperbarui.`,
      itemCount: orders.length,
      confirmLabel: 'Konfirmasi Ekspor Pesanan',
      confirmVariant: 'primary',
      action: async () => {
        setIsExportingOrders(true);
        setFeedback(null);
        try {
          const res = await exportAllOrdersToSheet(token, currentSheetId, orders);
          if (res.success) {
            await onUpdateSettings({
              ...settings,
              googleSheetsLastSync: new Date().toISOString(),
            });
            setFeedback({ type: 'success', message: res.message });
          } else {
            setFeedback({ type: 'error', message: res.message });
          }
        } finally {
          setIsExportingOrders(false);
        }
      },
    });
  };

  // Export products & stock with user confirmation
  const handleTriggerExportProducts = () => {
    if (!token) {
      setFeedback({ type: 'error', message: 'Silakan masuk dengan Google terlebih dahulu.' });
      return;
    }
    const currentSheetId = settings.googleSpreadsheetId || extractSpreadsheetId(spreadsheetInput);
    if (!currentSheetId) {
      setFeedback({ type: 'error', message: 'Pilih atau buat spreadsheet terlebih dahulu.' });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Perbarui Lembar "${PRODUCT_SHEET_TITLE}"?`,
      description: `Tindakan ini akan menuliskan ${products.length} produk cemilan beserta harga dan jumlah sisa stok saat ini ke lembar "${PRODUCT_SHEET_TITLE}" di Google Sheets.`,
      itemCount: products.length,
      confirmLabel: 'Konfirmasi Ekspor Stok',
      confirmVariant: 'primary',
      action: async () => {
        setIsExportingProducts(true);
        setFeedback(null);
        try {
          const res = await exportProductsToSheet(token, currentSheetId, products);
          if (res.success) {
            await onUpdateSettings({
              ...settings,
              googleSheetsLastSync: new Date().toISOString(),
            });
            setFeedback({ type: 'success', message: res.message });
          } else {
            setFeedback({ type: 'error', message: res.message });
          }
        } finally {
          setIsExportingProducts(false);
        }
      },
    });
  };

  // Import products & stock from sheet with user confirmation
  const handleTriggerImportProducts = () => {
    if (!token) {
      setFeedback({ type: 'error', message: 'Silakan masuk dengan Google terlebih dahulu.' });
      return;
    }
    const currentSheetId = settings.googleSpreadsheetId || extractSpreadsheetId(spreadsheetInput);
    if (!currentSheetId) {
      setFeedback({ type: 'error', message: 'Pilih atau buat spreadsheet terlebih dahulu.' });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Tarik & Sinkronkan Data dari Google Sheets?`,
      description: `Sistem akan membaca kolom Stok dan Harga dari lembar "${PRODUCT_SHEET_TITLE}" di Google Sheets Anda, lalu memperbarui stok dan harga di toko web ini.`,
      confirmLabel: 'Ya, Sinkronkan Sekarang',
      confirmVariant: 'warning',
      action: async () => {
        setIsImportingProducts(true);
        setFeedback(null);
        try {
          const res = await importProductsFromSheet(token, currentSheetId, products);
          if (res.success && res.updatedProducts) {
            onUpdateProductsBulk(res.updatedProducts);
            await onUpdateSettings({
              ...settings,
              googleSheetsLastSync: new Date().toISOString(),
            });
            setFeedback({ type: 'success', message: res.message });
          } else {
            setFeedback({ type: 'error', message: res.message });
          }
        } finally {
          setIsImportingProducts(false);
        }
      },
    });
  };

  const activeSpreadsheetId = settings.googleSpreadsheetId;
  const activeSpreadsheetUrl =
    settings.googleSpreadsheetUrl ||
    (activeSpreadsheetId ? `https://docs.google.com/spreadsheets/d/${activeSpreadsheetId}/edit` : '');

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-white shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                Integrasi Google Sheets & Drive
              </h3>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Sinkronisasi pesanan masuk, pembukuan penjualan, dan update stok snack langsung dari spreadsheet.
              </p>
            </div>
          </div>

          {activeSpreadsheetId && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-100 border border-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Spreadsheet Aktif Terhubung</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert / Feedback message */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-900 border border-rose-200'
              : 'bg-amber-50 text-amber-900 border border-amber-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-relaxed">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-neutral-400 hover:text-neutral-700 text-xs px-1 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* SECTION 1: GOOGLE AUTHENTICATION */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
              <span>1. Akun Google Terhubung</span>
              <span className="text-[11px] font-medium text-neutral-500">
                (Google Drive & Sheets API)
              </span>
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              Hubungkan akun Google untuk memberi izin aplikasi membaca dan menulis spreadsheet toko.
            </p>
          </div>
        </div>

        {!user ? (
          <div className="bg-neutral-50 p-4 rounded-xl border border-dashed border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-neutral-600 max-w-md">
              <p className="font-semibold text-neutral-800 mb-1">
                Belum terhubung dengan akun Google
              </p>
              <p className="text-neutral-500">
                Klik tombol di samping untuk masuk menggunakan akun Google Anda dan memberikan izin akses Google Sheets & Drive.
              </p>
            </div>
            <GoogleSignInButton
              onClick={handleGoogleLogin}
              isLoading={isLoggingIn}
              text="Hubungkan dengan Google"
            />
          </div>
        ) : (
          <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-10 h-10 rounded-full border border-emerald-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm">
                  {(user.displayName || user.email || 'G')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900 text-sm">
                    {user.displayName || 'Pengguna Google'}
                  </span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    Terhubung
                  </span>
                </div>
                <span className="text-xs text-neutral-600">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGoogleLogout}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-neutral-500" />
                <span>Ganti / Keluar Akun</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: SPREADSHEET TARGET */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div>
          <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
            <span>2. Target File Spreadsheet Toko</span>
          </h4>
          <p className="text-xs text-neutral-500 mt-0.5">
            Tentukan spreadsheet yang digunakan untuk menampung data pesanan dan katalog snack.
          </p>
        </div>

        {/* Active spreadsheet banner */}
        {activeSpreadsheetId ? (
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-xs text-neutral-900">
                  {settings.googleSpreadsheetName || 'Spreadsheet Pembukuan Bu Maryani'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-neutral-500 mt-0.5 block truncate max-w-md">
                ID: {activeSpreadsheetId}
              </span>
              {settings.googleSheetsLastSync && (
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Terakhir disinkronkan: {new Date(settings.googleSheetsLastSync).toLocaleString('id-ID')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeSpreadsheetUrl && (
                <a
                  href={activeSpreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Buka di Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
            Belum ada spreadsheet yang dipilih. Buat baru secara otomatis dengan 1 klik atau pilih file yang sudah ada di Google Drive Anda di bawah ini.
          </div>
        )}

        {/* Action options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Option A: 1-Click Create */}
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100/70 transition-colors flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 mb-1">
                <PlusCircle className="w-4 h-4 text-emerald-700" />
                <span>Buat File Baru Otomatis</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Membuat Google Spreadsheet baru &quot;Toko Oleh Oleh {settings.storeName} - Pembukuan & Pesanan&quot; di Drive dengan tab pesanan & stok yang sudah rapi diformat.
              </p>
            </div>
            <button
              type="button"
              id="btn-create-spreadsheet"
              onClick={handleCreateNewSpreadsheet}
              disabled={!token || isCreatingSheet}
              className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isCreatingSheet ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Membuat Spreadsheet...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Buat Spreadsheet Baru (1-Klik)</span>
                </>
              )}
            </button>
          </div>

          {/* Option B: Choose from Google Drive */}
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100/70 transition-colors flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 mb-1">
                <FolderOpen className="w-4 h-4 text-amber-700" />
                <span>Pilih dari Google Drive</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Gunakan spreadsheet yang sudah Anda miliki di Google Drive untuk toko ini.
              </p>
            </div>
            <button
              type="button"
              id="btn-browse-drive"
              onClick={handleLoadDriveSpreadsheets}
              disabled={!token || isLoadingDrive}
              className="w-full py-2 px-3 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isLoadingDrive ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Memuat Drive...</span>
                </>
              ) : (
                <>
                  <FolderOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>Daftar Spreadsheet Drive</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Drive files picker dropdown/modal */}
        {showDrivePicker && driveFiles.length > 0 && (
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                Pilih File Spreadsheet dari Google Drive Anda:
              </span>
              <button
                type="button"
                onClick={() => setShowDrivePicker(false)}
                className="text-xs text-neutral-500 hover:text-neutral-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {driveFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-2 bg-white rounded-lg border border-neutral-200 hover:border-emerald-500 flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono truncate">{file.id}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectDriveSpreadsheet(file)}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold shrink-0 cursor-pointer"
                  >
                    Gunakan File Ini
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Option C: Manual ID input */}
        <div className="pt-2 border-t border-neutral-100">
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Atau masukkan link / ID Spreadsheet manual:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={spreadsheetInput}
              onChange={(e) => setSpreadsheetInput(e.target.value)}
              placeholder="Contoh: 1BxiMVs0XR... atau paste link https://docs.google.com/spreadsheets/d/..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-mono"
            />
            <button
              type="button"
              onClick={handleSaveManualId}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Simpan ID
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: SYNC OPERATIONS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div>
          <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
            <span>3. Sinkronisasi Data Toko & Google Sheets</span>
          </h4>
          <p className="text-xs text-neutral-500 mt-0.5">
            Lakukan ekspor pesanan masuk atau sinkronisasi stok cemilan dua arah.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Box 1: Orders Sync */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>Ekspor Pesanan ({orders.length} Order)</span>
              </span>
              <span className="text-[10px] bg-neutral-200 text-neutral-700 font-mono px-2 py-0.5 rounded">
                Sheet: {ORDER_SHEET_TITLE}
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Mengekspor seluruh riwayat pesanan (Nama, No WA, Alamat, Total Biaya, Status) ke Google Sheets untuk pembukuan akuntansi.
            </p>

            <button
              type="button"
              id="btn-export-orders"
              onClick={handleTriggerExportOrders}
              disabled={!token || !activeSpreadsheetId || isExportingOrders}
              className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              {isExportingOrders ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengekspor ke Google Sheets...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Kirim Semua Pesanan ke Spreadsheet</span>
                </>
              )}
            </button>

            {/* Auto sync toggle */}
            <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px] font-semibold text-neutral-700">
                  Otomatis kirim pesanan baru
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.googleSheetsAutoSync ?? true}
                onChange={async (e) => {
                  await onUpdateSettings({
                    ...settings,
                    googleSheetsAutoSync: e.target.checked,
                  });
                }}
                className="w-4 h-4 accent-emerald-700 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Box 2: Product Catalog & Stock Sync */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-amber-700" />
                <span>Katalog & Stok ({products.length} Snack)</span>
              </span>
              <span className="text-[10px] bg-neutral-200 text-neutral-700 font-mono px-2 py-0.5 rounded">
                Sheet: {PRODUCT_SHEET_TITLE}
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Kirim stok toko ke spreadsheet atau tarik perubahan harga & stok yang Anda ubah di Google Sheets ke toko web.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-export-products"
                onClick={handleTriggerExportProducts}
                disabled={!token || !activeSpreadsheetId || isExportingProducts}
                className="py-2 px-2.5 bg-white hover:bg-neutral-100 border border-neutral-300 disabled:opacity-50 text-neutral-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isExportingProducts ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                )}
                <span>Ekspor Stok</span>
              </button>

              <button
                type="button"
                id="btn-import-products"
                onClick={handleTriggerImportProducts}
                disabled={!token || !activeSpreadsheetId || isImportingProducts}
                className="py-2 px-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {isImportingProducts ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Tarik dari Sheets</span>
              </button>
            </div>

            <p className="text-[10px] text-neutral-400">
              *Tips: Anda bisa mengedit kolom Harga dan Stok di Google Sheets lewat komputer atau HP, lalu klik &quot;Tarik dari Sheets&quot;.
            </p>
          </div>
        </div>
      </div>

      {/* MANDATORY CONFIRMATION MODAL FOR WORKSPACE MUTATIONS */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  confirmDialog.confirmVariant === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-neutral-900">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              {confirmDialog.description}
            </p>

            {confirmDialog.itemCount !== undefined && (
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 mb-5 flex items-center justify-between">
                <span>Jumlah data yang diproses:</span>
                <span className="font-bold text-neutral-900 font-mono">
                  {confirmDialog.itemCount} item
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-action"
                onClick={async () => {
                  const action = confirmDialog.action;
                  setConfirmDialog(null);
                  await action();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-xs ${
                  confirmDialog.confirmVariant === 'warning'
                    ? 'bg-amber-700 hover:bg-amber-800'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
