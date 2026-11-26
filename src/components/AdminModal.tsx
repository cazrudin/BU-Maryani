import React, { useState } from 'react';
import { Product, Order, StoreSettings } from '../types';
import {
  formatRupiah,
  formatDateIndo,
  playOrderChime,
  buildShortSmsMessage,
  formatProductId,
  getNextProductId,
  sortProductsByProductId,
} from '../utils/formatters';
import { PRESET_IMAGES } from '../data/initialData';
import {
  X,
  Lock,
  Package,
  Bell,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  Copy,
  MessageCircle,
  Volume2,
  VolumeX,
  LogOut,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Download,
  FileText,
  Database,
  Code2,
  Smartphone,
  Camera,
  Eye,
  EyeOff,
  Image as ImageIcon,
  BarChart3,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import { GoogleSheetsTab } from './GoogleSheetsTab';
import { ProductPhotoUpload } from './ProductPhotoUpload';
import { QuickPhotoModal } from './QuickPhotoModal';
import { AdminDashboard } from './AdminDashboard';
import {
  downloadOrdersCsv,
  downloadProductsCsv,
  downloadStoreBackupJson,
} from '../utils/downloadHelpers';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  adminPin: string;
  isLoggedIn: boolean;
  onLogin: (pin: string) => Promise<boolean>;
  onLogout: () => void;
  onUpdateProduct: (product: Product, oldProductId?: string) => Promise<boolean>;
  onAddProduct: (product: Omit<Product, 'createdAt'> & { id?: string }) => Promise<Product>;
  onDeleteProduct: (productId: string) => Promise<boolean>;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => Promise<boolean>;
  onUpdateSettings: (settings: StoreSettings) => Promise<boolean>;
  onResetDemo: () => Promise<void>;
  onClearOrders?: () => Promise<void>;
  onUpdateProductsBulk?: (updatedProducts: Product[]) => void;
  onOpenAndroidApk?: () => void;
  initialTab?: 'products' | 'orders' | 'sheets' | 'settings' | 'dashboard';
}

export function AdminModal({
  isOpen,
  onClose,
  products,
  orders,
  settings,
  adminPin,
  isLoggedIn,
  onLogin,
  onLogout,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onUpdateSettings,
  onResetDemo,
  onClearOrders,
  onUpdateProductsBulk,
  onOpenAndroidApk,
  initialTab = 'products',
}: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'sheets' | 'settings' | 'dashboard'>(initialTab);
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Separate Owner authentication state for the Owner Dashboard tab (Owner Password default: 1802)
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState(false);
  const [ownerPinInput, setOwnerPinInput] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [ownerLoginError, setOwnerLoginError] = useState('');
  const [isUnlockingOwner, setIsUnlockingOwner] = useState(false);

  const currentOwnerPin = settings.ownerPin || (typeof window !== 'undefined' ? localStorage.getItem('bu_maryani_owner_pin') : null) || '1802';

  const handleOwnerUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerLoginError('');
    setIsUnlockingOwner(true);

    if (ownerPinInput.trim() === currentOwnerPin) {
      setIsOwnerUnlocked(true);
      setOwnerPinInput('');
      setOwnerLoginError('');
    } else {
      setOwnerLoginError('Sandi salah! Silakan coba lagi.');
    }
    setIsUnlockingOwner(false);
  };

  const handleUpdateOwnerPin = async (newPin: string): Promise<boolean> => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bu_maryani_owner_pin', newPin);
      }
      const updatedSettings: StoreSettings = {
        ...settings,
        ownerPin: newPin,
      };
      return await onUpdateSettings(updatedSettings);
    } catch (e) {
      console.error('Failed to update owner pin:', e);
      return false;
    }
  };

  // Search in admin
  const [adminSearch, setAdminSearch] = useState('');

  // Quick photo changer state (phone camera / gallery)
  const [quickPhotoProduct, setQuickPhotoProduct] = useState<Product | null>(null);

  // Editing product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // New/Edit product form fields
  const [formCustomId, setFormCustomId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('keripik');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [formPrice, setFormPrice] = useState<string>('25000');
  const [formUnit, setFormUnit] = useState('bungkus');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitInput, setCustomUnitInput] = useState('');
  const [formStock, setFormStock] = useState<string>('10');
  const [formWeight, setFormWeight] = useState<string>('250');
  const [formImage, setFormImage] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Store settings form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [newPin, setNewPin] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Keep settingsForm in sync with settings prop
  React.useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Orders status filter
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Admin Login
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    const success = await onLogin(pinInput.trim());
    setIsLoggingIn(false);
    if (!success) {
      setLoginError('Kata Sandi Admin salah. Coba lagi.');
    } else {
      setPinInput('');
    }
  };

  // Open add product form
  const handleOpenAddProduct = () => {
    setIsCreatingProduct(true);
    setEditingProduct(null);
    setFormCustomId(getNextProductId(products));
    setFormName('');
    setFormCategory('keripik');
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setFormPrice('25000');
    setFormUnit('bungkus');
    setIsCustomUnit(false);
    setCustomUnitInput('');
    setFormStock('20');
    setFormWeight('250');
    setFormImage(PRESET_IMAGES[0].url);
    setFormDescription('');
  };

  // Open edit product form
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsCreatingProduct(false);
    setFormCustomId(formatProductId(prod.id));
    setFormName(prod.name);
    const standardCategories = ['keripik', 'manis', 'tradisional', 'paket'];
    if (standardCategories.includes(prod.category)) {
      setFormCategory(prod.category);
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    } else {
      setFormCategory('custom');
      setIsCustomCategory(true);
      setCustomCategoryInput(prod.category);
    }
    setFormPrice(String(prod.price));
    const standardUnits = ['bungkus', 'kg', 'pcs', 'toples', 'besek', 'box', 'pack'];
    if (standardUnits.includes(prod.unit)) {
      setFormUnit(prod.unit);
      setIsCustomUnit(false);
      setCustomUnitInput('');
    } else {
      setFormUnit('custom');
      setIsCustomUnit(true);
      setCustomUnitInput(prod.unit);
    }
    setFormStock(String(prod.stock));
    setFormWeight(String(prod.weightGram || 250));
    setFormImage(prod.image);
    setFormDescription(prod.description);
  };

  // Save product form
  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedPrice = parseInt(String(formPrice).replace(/[^0-9]/g, ''), 10) || 0;
    const parsedStock = parseInt(String(formStock).replace(/[^0-9]/g, ''), 10) || 0;
    const parsedWeight = parseInt(String(formWeight).replace(/[^0-9]/g, ''), 10) || 250;
    const cleanId = formCustomId.trim() || (isCreatingProduct ? getNextProductId(products) : (editingProduct?.id || 'P001'));
    const finalCategory = isCustomCategory
      ? (customCategoryInput.trim() || 'Lainnya')
      : formCategory;
    const finalUnit = isCustomUnit
      ? (customUnitInput.trim() || 'bungkus')
      : formUnit;

    if (isCreatingProduct) {
      await onAddProduct({
        id: cleanId,
        name: formName.trim(),
        category: finalCategory,
        price: parsedPrice,
        unit: finalUnit.trim(),
        stock: parsedStock,
        weightGram: parsedWeight,
        image: formImage || PRESET_IMAGES[0].url,
        description: formDescription.trim(),
        isActive: true,
      });
      setIsCreatingProduct(false);
    } else if (editingProduct) {
      const oldId = editingProduct.id;
      await onUpdateProduct({
        ...editingProduct,
        id: cleanId,
        name: formName.trim(),
        category: finalCategory,
        price: parsedPrice,
        unit: finalUnit.trim(),
        stock: parsedStock,
        weightGram: parsedWeight,
        image: formImage || editingProduct.image,
        description: formDescription.trim(),
      }, oldId);
      setEditingProduct(null);
    }
  };

  // Fast stock adjust button
  const handleFastStockAdjust = (product: Product, delta: number) => {
    const updatedStock = Math.max(0, product.stock + delta);
    onUpdateProduct({ ...product, stock: updatedStock });
  };

  // Copy SMS / short notification
  const handleCopyOrderSms = (order: Order) => {
    const sms = buildShortSmsMessage(order, settings);
    navigator.clipboard.writeText(sms);
    setCopiedOrderId(order.id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  const pendingOrdersCount = orders.filter((o) => o.status === 'menunggu_konfirmasi').length;

  // Filtered products sorted ascending by Product ID (P001, P002, ...)
  const filteredProducts = sortProductsByProductId(
    products.filter((p) =>
      p.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
      formatProductId(p.id).toLowerCase().includes(adminSearch.toLowerCase())
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="admin-management-modal"
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-neutral-200 h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="bg-neutral-900 text-white p-3 sm:p-3.5 flex items-center justify-between shrink-0 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Logo Bu Maryani"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold tracking-tight">Kelola Toko Bu Maryani</h3>
                <span className="text-[10px] bg-red-500/20 text-red-300 font-semibold px-2 py-0.5 rounded-full border border-red-500/30">
                  Mode HP Admin
                </span>
                {isLoggedIn && (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Online • Notif Masuk Aktif
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-400">
                Kios Pasar Klaten • Atur stok, harga, foto, dan pantau pesanan pelanggan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <button
                id="admin-logout-btn"
                onClick={() => {
                  setIsOwnerUnlocked(false);
                  onLogout();
                }}
                className="text-xs text-neutral-400 hover:text-rose-400 p-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Keluar Admin"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
            <button
              id="admin-close-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* If Not Logged In: Password / PIN Screen */}
        {!isLoggedIn ? (
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 bg-neutral-50">
            <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 text-center">
              <img
                src="/logo.png"
                alt="Logo Bu Maryani"
                className="w-32 h-auto mx-auto object-contain mb-3 drop-shadow-sm"
              />
              <h4 className="text-lg font-bold text-neutral-900">Masuk Akun Pengelola</h4>
              <p className="text-xs text-neutral-500 mt-1 mb-5">
                Masukkan Kata Sandi Admin untuk mengganti foto produk (kamera/galeri HP), memperbarui stok, dan mengelola pesanan.
              </p>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <div className="relative">
                    <input
                      id="admin-pin-input"
                      type={showPassword ? 'text' : 'password'}
                      maxLength={50}
                      placeholder="Masukkan Kata Sandi"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-full text-center text-lg sm:text-xl font-bold py-3 pl-4 pr-11 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-700 cursor-pointer rounded-lg"
                      title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {loginError && (
                    <p className="text-xs text-rose-600 font-semibold mt-2">{loginError}</p>
                  )}
                </div>

                <button
                  id="admin-login-submit-btn"
                  type="submit"
                  disabled={isLoggingIn || !pinInput}
                  className="w-full py-3 bg-amber-700 hover:bg-amber-800 active:scale-98 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isLoggingIn ? 'Memeriksa...' : 'Buka Pengelolaan Toko'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Logged In: Full Admin Portal */
          <div className="flex-1 flex flex-col min-h-0 bg-neutral-100">
            {/* Tabs Navigation */}
            <div className="bg-white border-b border-neutral-200 px-3 sm:px-6 flex items-center justify-between shrink-0 overflow-x-auto">
              <div className="flex gap-2 py-2">
                <button
                  id="tab-admin-products"
                  onClick={() => setActiveTab('products')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-red-50 text-red-950 border border-red-200 shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Package className="w-4 h-4 text-red-700" />
                  <span>Stok &amp; Produk ({products.length})</span>
                </button>

                <button
                  id="tab-admin-orders"
                  onClick={() => setActiveTab('orders')}
                  className={`relative px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-red-50 text-red-950 border border-red-200 shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Bell className="w-4 h-4 text-red-700" />
                  <span>Pesanan Masuk</span>
                  {pendingOrdersCount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>

                <button
                  id="tab-admin-sheets"
                  onClick={() => setActiveTab('sheets')}
                  className={`relative px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'sheets'
                      ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Google Sheets</span>
                  {settings.googleSpreadsheetId && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Spreadsheet terhubung" />
                  )}
                </button>

                <button
                  id="tab-admin-settings"
                  onClick={() => setActiveTab('settings')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-neutral-100 text-neutral-900 border border-neutral-300 shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Settings className="w-4 h-4 text-neutral-700" />
                  <span>Pengaturan Toko</span>
                </button>

                {/* TAB DASHBOARD: At the very end */}
                <button
                  id="tab-admin-dashboard"
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    activeTab === 'dashboard'
                      ? 'bg-red-700 text-white border-red-800 shadow-xs'
                      : 'bg-white hover:bg-red-50 border-neutral-200 text-neutral-800'
                  }`}
                  title="Dashboard & Grafik Penjualan"
                >
                  <BarChart3 className={`w-3.5 h-3.5 ${activeTab === 'dashboard' ? 'text-yellow-300' : 'text-red-700'}`} />
                  <span>Dashboard &amp; Grafik</span>
                  {!isOwnerUnlocked && (
                    <Lock className={`w-3 h-3 ${activeTab === 'dashboard' ? 'text-white/80' : 'text-neutral-400'}`} />
                  )}
                </button>
              </div>

              {/* Chime sound tester */}
              <div className="hidden sm:flex items-center gap-1 text-xs text-neutral-500">
                <button
                  onClick={() => playOrderChime()}
                  className="flex items-center gap-1 text-[11px] text-amber-800 hover:text-amber-950 p-1.5 rounded-md hover:bg-amber-50 cursor-pointer"
                  title="Tes bunyi notifikasi order"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Tes Suara Order</span>
                </button>
              </div>
            </div>

            {/* TAB 1: PRODUCTS & STOCK MANAGEMENT */}
            {activeTab === 'products' && (
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
                {/* Search & Add Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-neutral-200">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari produk di katalog..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onOpenAndroidApk && (
                      <button
                        onClick={onOpenAndroidApk}
                        className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        title="Pasang & Download Aplikasi Android (.APK)"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span className="hidden sm:inline">App .APK</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTab('sheets')}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Sinkronisasi stok dengan Google Sheets"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      <span className="hidden sm:inline">Google Sheets</span>
                    </button>

                    <button
                      id="admin-add-product-btn"
                      onClick={handleOpenAddProduct}
                      className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Tambah Snack Baru</span>
                    </button>
                  </div>
                </div>

                {/* Product list table/cards mobile-optimized */}
                <div className="space-y-3">
                  {filteredProducts.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-neutral-200 text-center text-xs text-neutral-500">
                      Tidak ada produk yang cocok dengan pencarian.
                    </div>
                  ) : (
                    filteredProducts.map((prod) => {
                      const isOutOfStock = prod.stock <= 0;

                      return (
                        <div
                          key={prod.id}
                          id={`admin-prod-${prod.id}`}
                          className="bg-white rounded-2xl p-3 sm:p-4 border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          {/* Thumbnail & Basic Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="relative group/thumb shrink-0">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                referrerPolicy="no-referrer"
                                className="w-16 h-16 sm:w-14 sm:h-14 rounded-xl object-cover bg-neutral-100 shrink-0 border border-neutral-200"
                              />
                              <button
                                type="button"
                                onClick={() => setQuickPhotoProduct(prod)}
                                className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-bold transition-opacity cursor-pointer shadow-xs"
                                title="Ganti foto snack dari Galeri atau Kamera HP"
                              >
                                <Camera className="w-4 h-4 text-amber-300" />
                                <span className="text-[8px] leading-tight mt-0.5">Foto</span>
                              </button>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                                  {formatProductId(prod.id)}
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                                  {prod.name}
                                </h4>
                                {!prod.isActive && (
                                  <span className="text-[10px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded font-semibold">
                                    Nonaktif
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-neutral-500 mt-0.5">
                                <span className="font-bold text-amber-900">
                                  {formatRupiah(prod.price)}
                                </span>{' '}
                                / {prod.unit}
                              </div>

                              <div className="text-[11px] text-neutral-400 capitalize">
                                Kategori: {prod.category}
                              </div>
                            </div>
                          </div>

                          {/* Quick Stock Controls (Instant 1-Tap on Phone) */}
                          <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                            {/* Stock Badge & Stepper */}
                            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 p-1 rounded-xl">
                              <span className="text-xs font-semibold px-1 text-neutral-500">
                                Stok:
                              </span>
                              <span
                                className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                                  isOutOfStock
                                    ? 'bg-rose-600 text-white'
                                    : prod.stock <= 5
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-emerald-600 text-white'
                                }`}
                              >
                                {prod.stock}
                              </span>

                              {/* Steppers: -1, +1, +5 */}
                              <button
                                onClick={() => handleFastStockAdjust(prod, -1)}
                                disabled={prod.stock <= 0}
                                className="w-6 h-6 rounded bg-white border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                                title="Kurang 1 stok"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => handleFastStockAdjust(prod, 1)}
                                className="w-6 h-6 rounded bg-white border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                                title="Tambah 1 stok"
                              >
                                +1
                              </button>
                              <button
                                onClick={() => handleFastStockAdjust(prod, 5)}
                                className="px-1.5 h-6 rounded bg-white border border-neutral-300 text-[11px] font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                                title="Tambah 5 stok"
                              >
                                +5
                              </button>
                            </div>

                            {/* Edit Detail & Delete */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setQuickPhotoProduct(prod)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center gap-1 border border-emerald-300 transition-colors cursor-pointer"
                                title="Ganti foto snack dari Galeri atau Kamera HP"
                              >
                                <Camera className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Ganti Foto</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1 border border-amber-200 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit Detail</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Yakin ingin menghapus "${prod.name}"?`)) {
                                    onDeleteProduct(prod.id);
                                  }
                                }}
                                className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Hapus produk"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: INCOMING ORDERS & SMS/WA NOTIFICATIONS */}
            {activeTab === 'orders' && (
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
                {/* Orders Filter Tabs */}
                <div className="flex items-center justify-between gap-2 flex-wrap bg-white p-3 rounded-2xl border border-neutral-200">
                  <div className="flex gap-1.5 overflow-x-auto">
                    {[
                      { id: 'all', label: `Semua (${orders.length})` },
                      {
                        id: 'menunggu_konfirmasi',
                        label: `Menunggu (${orders.filter((o) => o.status === 'menunggu_konfirmasi').length})`,
                      },
                      {
                        id: 'diproses',
                        label: `Diproses (${orders.filter((o) => o.status === 'diproses').length})`,
                      },
                      {
                        id: 'selesai',
                        label: `Selesai (${orders.filter((o) => o.status === 'selesai').length})`,
                      },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setOrderFilter(f.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                          orderFilter === f.id
                            ? 'bg-amber-800 text-white'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('sheets')}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Ekspor ke Google Sheets</span>
                    </button>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl border border-neutral-200 text-center text-neutral-500">
                    <Bell className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <h5 className="font-bold text-sm text-neutral-700">Belum Ada Pesanan Masuk</h5>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                      Saat pembeli menyelesaikan belanja di keranjang, pesanan akan langsung muncul di sini beserta ringkasan pesan singkat.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((ord) => {
                      const isPending = ord.status === 'menunggu_konfirmasi';
                      const cleanPhone = ord.customer.phone.replace(/[^0-9]/g, '');
                      const waCustomerLink = `https://wa.me/${
                        cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone
                      }?text=${encodeURIComponent(
                        `Halo Kak ${ord.customer.name}, ini dari Bu Maryani (Pusat Oleh Oleh Klaten) terkait pesanan #${ord.orderNumber} sebesar ${formatRupiah(ord.totalAmount)}.`
                      )}`;

                      return (
                        <div
                          key={ord.id}
                          id={`admin-order-${ord.id}`}
                          className={`bg-white rounded-2xl p-4 border shadow-xs transition-all ${
                            isPending ? 'border-amber-400 ring-1 ring-amber-300' : 'border-neutral-200'
                          }`}
                        >
                          {/* Top row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-neutral-900">
                                  #{ord.orderNumber}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    ord.status === 'menunggu_konfirmasi'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : ord.status === 'diproses'
                                      ? 'bg-blue-100 text-blue-900'
                                      : ord.status === 'dikirim'
                                      ? 'bg-purple-100 text-purple-900'
                                      : ord.status === 'selesai'
                                      ? 'bg-emerald-100 text-emerald-900'
                                      : 'bg-neutral-100 text-neutral-600'
                                  }`}
                                >
                                  {ord.status.replace('_', ' ')}
                                </span>
                              </div>
                              <span className="text-[11px] text-neutral-400">
                                {formatDateIndo(ord.createdAt)}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-xs text-neutral-500 block">Total Belanja:</span>
                              <span className="text-base font-black text-amber-900">
                                {formatRupiah(ord.totalAmount)}
                              </span>
                            </div>
                          </div>

                          {/* Customer info & Delivery */}
                          <div className="my-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-neutral-50 p-3 rounded-xl">
                            <div>
                              <span className="text-neutral-400 block text-[11px]">Data Pemesan:</span>
                              <p className="font-bold text-neutral-900">{ord.customer.name}</p>
                              <p className="text-neutral-600">{ord.customer.phone}</p>
                            </div>

                            <div>
                              <span className="text-neutral-400 block text-[11px]">Pengiriman:</span>
                              <p className="font-bold text-neutral-900">
                                {ord.customer.deliveryMethod === 'ambil_toko'
                                  ? '🏬 Ambil Langsung di Toko Klaten'
                                  : '🚚 Dikirim ke Alamat:'}
                              </p>
                              {ord.customer.address && (
                                <p className="text-neutral-600 line-clamp-2">{ord.customer.address}</p>
                              )}
                              {ord.customer.notes && (
                                <p className="text-amber-800 italic mt-0.5">
                                  Catatan: {ord.customer.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Items summary */}
                          <div className="space-y-1 mb-3">
                            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                              Rincian Snack:
                            </span>
                            {ord.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-xs py-0.5 text-neutral-700"
                              >
                                <span>
                                  • {item.productName} ({item.quantity} {item.unit})
                                </span>
                                <span className="font-semibold text-neutral-900">
                                  {formatRupiah(item.subtotal)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Order Actions: WhatsApp & SMS & Status */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100">
                            <div className="flex items-center gap-1.5">
                              {/* Direct WhatsApp to Customer */}
                              <a
                                href={waCustomerLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Chat WA Pembeli</span>
                              </a>

                              {/* Copy SMS Text */}
                              <button
                                onClick={() => handleCopyOrderSms(ord)}
                                className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                title="Salin format pesan singkat / SMS tagihan"
                              >
                                {copiedOrderId === ord.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Salin SMS</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Status Selector */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-neutral-500">Status:</span>
                              <select
                                value={ord.status}
                                onChange={(e) =>
                                  onUpdateOrderStatus(ord.id, e.target.value as Order['status'])
                                }
                                className="text-xs font-bold py-1 px-2.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-hidden"
                              >
                                <option value="menunggu_konfirmasi">Menunggu Konfirmasi</option>
                                <option value="diproses">Sedang Diproses</option>
                                <option value="dikirim">Dikirim</option>
                                <option value="selesai">Selesai</option>
                                <option value="dibatalkan">Dibatalkan</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: STORE SETTINGS */}
            {activeTab === 'settings' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <div className="max-w-xl mx-auto bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2">
                    Informasi Toko & WhatsApp
                  </h4>

                  {settingsSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{settingsSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Nama Toko
                    </label>
                    <input
                      type="text"
                      value={settingsForm.storeName}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, storeName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Nomor WhatsApp Toko (Penerima Pesanan)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 6281234567890"
                      value={settingsForm.phone}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          phone: e.target.value.replace(/[^0-9]/g, ''),
                        })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-xl font-mono"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Gunakan format 628xxx (tanpa tanda + atau spasi) agar tautan WhatsApp customer langsung bekerja.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Alamat Lengkap Toko di Klaten
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.address}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, address: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-xl resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Jam Buka & Operasional
                    </label>
                    <input
                      type="text"
                      value={settingsForm.openingHours}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, openingHours: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Informasi Rekening Pembayaran / Transfer
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.bankInfo}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, bankInfo: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-xl resize-none"
                    />
                  </div>

                  {/* Change Password */}
                  <div className="pt-3 border-t border-neutral-100">
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Ganti Kata Sandi Admin Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Masukkan kata sandi baru (default: olehbumaryani)"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="w-full px-3 py-2 pr-10 text-xs sm:text-sm border border-neutral-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                        title={showNewPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[11px] text-neutral-400 mt-1 block">
                      Kosongkan jika tidak ingin mengubah kata sandi toko.
                    </span>
                  </div>

                  <button
                    id="save-settings-btn"
                    onClick={async () => {
                      const updated = { ...settingsForm };
                      if (newPin.trim()) {
                        updated.adminPin = newPin.trim();
                      }
                      await onUpdateSettings(updated);
                      setNewPin('');
                      setSettingsSuccess('Pengaturan toko berhasil disimpan!');
                      setTimeout(() => setSettingsSuccess(''), 3000);
                    }}
                    className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Simpan Perubahan Toko
                  </button>

                  {/* Download & Export Data Section */}
                  <div className="pt-4 border-t border-neutral-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-emerald-700" />
                        <span>Download & Backup Data Toko</span>
                      </h4>
                      <span className="text-[10px] text-neutral-400 font-medium">Format Excel / CSV / JSON</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => downloadOrdersCsv(orders, settings.storeName)}
                        className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center"
                        title="Download file CSV pesanan masuk"
                      >
                        <FileText className="w-4 h-4 text-emerald-700" />
                        <span>Download Pesanan (.CSV)</span>
                        <span className="text-[10px] text-emerald-700/80 font-normal">{orders.length} order</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadProductsCsv(products, settings.storeName)}
                        className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center"
                        title="Download file CSV katalog snack dan stok"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-amber-700" />
                        <span>Download Stok Snack (.CSV)</span>
                        <span className="text-[10px] text-amber-700/80 font-normal">{products.length} snack</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadStoreBackupJson(products, orders, settings)}
                        className="p-2.5 rounded-xl border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center"
                        title="Download file backup JSON lengkap"
                      >
                        <Database className="w-4 h-4 text-neutral-700" />
                        <span>Backup Lengkap (.JSON)</span>
                        <span className="text-[10px] text-neutral-500 font-normal">Data Toko & Stok</span>
                      </button>
                    </div>

                    {/* How to download ZIP project code */}
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                      <Code2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Mau download source code aplikasi web (ZIP)?</strong>
                        <p className="text-blue-800 mt-0.5">
                          Klik tombol menu titik tiga (•••) atau tombol Export di pojok kanan atas jendela <strong>Google AI Studio</strong>, lalu pilih <em>&quot;Export as ZIP&quot;</em> atau <em>&quot;Export to GitHub&quot;</em>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 text-center">
                    <button
                      onClick={async () => {
                        if (confirm('Yakin ingin mereset produk dan pengaturan ke data awal demo?')) {
                          await onResetDemo();
                          alert('Data berhasil direset ke bawaan demo!');
                        }
                      }}
                      className="text-xs text-neutral-400 hover:text-rose-600 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Kembalikan Produk ke Bawaan Awal</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: GOOGLE SHEETS & DRIVE INTEGRATION */}
            {activeTab === 'sheets' && (
              <div className="flex-1 overflow-y-auto p-3 sm:p-5">
                <GoogleSheetsTab
                  products={products}
                  orders={orders}
                  settings={settings}
                  onUpdateSettings={onUpdateSettings}
                  onUpdateProductsBulk={(bulk) => {
                    if (onUpdateProductsBulk) {
                      onUpdateProductsBulk(bulk);
                    }
                  }}
                />
              </div>
            )}

            {/* TAB 5: DASHBOARD & RECHARTS SALES ANALYTICS (PROTECTED 🔒) */}
            {activeTab === 'dashboard' && (
              !isOwnerUnlocked ? (
                /* Discreet Lock Screen */
                <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-neutral-100">
                  <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-sm border border-neutral-200 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
                      <Lock className="w-6 h-6 text-amber-800" />
                    </div>

                    <form onSubmit={handleOwnerUnlock} className="space-y-3 pt-1 text-left">
                      <div>
                        <div className="relative">
                          <input
                            id="owner-pin-input"
                            type={showOwnerPassword ? 'text' : 'password'}
                            value={ownerPinInput}
                            onChange={(e) => {
                              setOwnerPinInput(e.target.value);
                              if (ownerLoginError) setOwnerLoginError('');
                            }}
                            placeholder="Masukkan sandi..."
                            className="w-full text-center text-base font-bold py-2.5 pl-4 pr-11 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-700 cursor-pointer rounded-lg"
                            title={showOwnerPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                          >
                            {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {ownerLoginError && (
                          <p className="text-xs text-rose-600 font-semibold mt-1.5 text-center">{ownerLoginError}</p>
                        )}
                      </div>

                      <button
                        id="owner-login-submit-btn"
                        type="submit"
                        disabled={isUnlockingOwner || !ownerPinInput}
                        className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 active:scale-98 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isUnlockingOwner ? 'Memeriksa...' : 'Buka Dashboard'}</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <AdminDashboard
                  orders={orders}
                  products={products}
                  currentOwnerPin={currentOwnerPin}
                  onNavigateToOrders={() => setActiveTab('orders')}
                  onClearOrders={onClearOrders}
                  onUpdateOwnerPin={handleUpdateOwnerPin}
                  onLockOwner={() => setIsOwnerUnlocked(false)}
                />
              )
            )}
          </div>
        )}

        {/* MODAL / DRAWER: ADD OR EDIT PRODUCT */}
        {(isCreatingProduct || editingProduct) && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-neutral-300 max-h-[90vh] flex flex-col">
              <div className="p-4 bg-amber-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm">
                    {isCreatingProduct ? '+ Tambah Snack Baru' : `Edit: ${editingProduct?.name}`}
                  </h4>
                  <span className="text-[11px] font-mono font-bold bg-amber-800 text-amber-200 px-2 py-0.5 rounded border border-amber-700">
                    ID: {isCreatingProduct ? getNextProductId(products) : formatProductId(editingProduct?.id)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsCreatingProduct(false);
                    setEditingProduct(null);
                  }}
                  className="w-7 h-7 rounded-full bg-amber-800 hover:bg-amber-700 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProductForm} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
                <div>
                  <label htmlFor="form-product-id-input" className="block text-xs font-semibold text-neutral-700 mb-1">
                    ID Produk <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="form-product-id-input"
                      type="text"
                      required
                      placeholder="Contoh: P001 atau custom"
                      value={formCustomId}
                      onChange={(e) => setFormCustomId(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-sans font-bold text-neutral-900 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                    {isCreatingProduct && (
                      <button
                        type="button"
                        onClick={() => setFormCustomId(getNextProductId(products))}
                        className="px-2.5 py-2 text-xs font-semibold bg-neutral-100 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-200 whitespace-nowrap cursor-pointer"
                        title="Gunakan ID urutan berikutnya"
                      >
                        Reset Otomatis
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nama Snack / Oleh-Oleh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Keripik Paru Klaten Renyah"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-neutral-700">
                        Harga (Rp) <span className="text-rose-500">*</span>
                      </label>
                      {formPrice && (
                        <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                          Rp {Number(formPrice || 0).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 select-none">
                        Rp
                      </span>
                      <input
                        id="product-form-price"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        placeholder="Ketik harga manual..."
                        value={formPrice}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          setFormPrice(cleaned);
                        }}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-xl font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                    {/* Pilihan Cepat / Preset Tombol */}
                    <div className="flex items-center gap-1 mt-1.5 overflow-x-auto pb-0.5">
                      {[15000, 20000, 25000, 30000, 35000, 50000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setFormPrice(String(amt))}
                          className="px-1.5 py-0.5 text-[10px] bg-neutral-100 hover:bg-amber-100 text-neutral-600 hover:text-amber-900 rounded font-medium shrink-0 cursor-pointer border border-neutral-200"
                        >
                          {amt / 1000}rb
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Satuan Produk <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={isCustomUnit ? 'custom' : formUnit}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomUnit(true);
                        } else {
                          setIsCustomUnit(false);
                          setFormUnit(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-xl font-semibold"
                    >
                      <option value="bungkus">bungkus</option>
                      <option value="kg">kg (Kilogram)</option>
                      <option value="pcs">pcs (Biji)</option>
                      <option value="toples">toples</option>
                      <option value="besek">besek</option>
                      <option value="box">box / kardus</option>
                      <option value="pack">pack</option>
                      <option value="custom">✏️ Custom (Ketik Manual...)</option>
                    </select>

                    {isCustomUnit && (
                      <div className="mt-1.5">
                        <input
                          id="product-custom-unit-input"
                          type="text"
                          required
                          placeholder="Contoh: porsi, renceng, kaleng, dll."
                          value={customUnitInput}
                          onChange={(e) => setCustomUnitInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Sisa Stok Tersedia <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      placeholder="0"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-xl font-bold text-neutral-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={isCustomCategory ? 'custom' : formCategory}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomCategory(true);
                        } else {
                          setIsCustomCategory(false);
                          setFormCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-xl font-medium"
                    >
                      <option value="keripik">🍟 Keripik & Gurih</option>
                      <option value="manis">🍯 Manis & Jenang</option>
                      <option value="tradisional">🍘 Khas Tradisional</option>
                      <option value="paket">🎁 Paket Oleh-Oleh</option>
                      <option value="custom">✏️ Custom (Ketik Manual...)</option>
                    </select>

                    {isCustomCategory && (
                      <div className="mt-1.5">
                        <input
                          id="product-custom-category-input"
                          type="text"
                          required
                          placeholder="Ketik nama kategori..."
                          value={customCategoryInput}
                          onChange={(e) => setCustomCategoryInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo Upload with Mobile Camera & Gallery */}
                <div>
                  <ProductPhotoUpload
                    value={formImage}
                    onChange={(newImg) => setFormImage(newImg)}
                    presetImages={PRESET_IMAGES}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Deskripsi Singkat Snack
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Jelaskan rasa, kerenyahan, keunggulan, daya simpan..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingProduct(false);
                      setEditingProduct(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs"
                  >
                    Simpan Produk
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* MODAL: QUICK PHOTO CHANGE FROM PHONE (CAMERA OR GALLERY) */}
        <QuickPhotoModal
          isOpen={!!quickPhotoProduct}
          product={quickPhotoProduct}
          onClose={() => setQuickPhotoProduct(null)}
          onSavePhoto={async (prod, newImg) => {
            const ok = await onUpdateProduct({ ...prod, image: newImg });
            return ok;
          }}
          presetImages={PRESET_IMAGES}
        />
      </div>
    </div>
  );
}
