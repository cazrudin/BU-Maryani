import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Product, CartItem, Order, StoreSettings } from './types';
import { DEFAULT_PRODUCTS, DEFAULT_STORE_SETTINGS } from './data/initialData';
import { api } from './services/api';
import {
  subscribeToProducts,
  subscribeToStoreSettings,
  subscribeToOrders,
} from './services/firestoreService';
import {
  playOrderChime,
  buildWhatsAppOrderMessage,
  sortProductsByProductId,
  formatProductId,
} from './utils/formatters';
import { getAccessToken } from './services/googleAuth';
import { appendOrderToSheet } from './services/googleSheets';

import { Navbar } from './components/Navbar';
import { BannerHero } from './components/BannerHero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartModal } from './components/CartModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AdminModal } from './components/AdminModal';
import { ShareModal } from './components/ShareModal';
import { DownloadModal } from './components/DownloadModal';
import { AndroidApkModal } from './components/AndroidApkModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OrderNotificationToast } from './components/OrderNotificationToast';

import {
  MapPin,
  Phone,
  Clock,
  Lock,
  Share2,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Download,
  Smartphone,
} from 'lucide-react';

const CART_STORAGE_KEY = 'bu_maryani_cart_v1';
const ADMIN_SESSION_KEY = 'bu_maryani_admin_session_v1';

export default function App() {
  // Store Data States
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Admin Session State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [adminPin, setAdminPin] = useState<string>(DEFAULT_STORE_SETTINGS.adminPin);

  // Filter & Search
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isAndroidApkOpen, setIsAndroidApkOpen] = useState(false);
  const [activeToastOrder, setActiveToastOrder] = useState<Order | null>(null);
  const hasInitializedOrdersRef = useRef<boolean>(false);
  const prevOrderCountRef = useRef<number>(0);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // quota
    }
  }, [cart]);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const data = await api.getStoreData();
      if (data.products && data.products.length > 0) {
        setProducts(data.products);
      }
      if (data.settings) {
        setSettings(data.settings);
        if (data.settings.adminPin) {
          const effectivePin = data.settings.adminPin === '1234' ? 'olehbumaryani' : data.settings.adminPin;
          setAdminPin(effectivePin);
        }
      }

      // If admin logged in, fetch orders
      if (isAdminLoggedIn) {
        const adminOrders = await api.getAdminOrders(adminPin);
        setOrders(adminOrders);
      }
    } catch (err) {
      console.warn('Initial load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdminLoggedIn, adminPin]);

  useEffect(() => {
    loadData();

    // Subscribe to real-time changes in Firestore Cloud Database
    const unsubProducts = subscribeToProducts((cloudProducts) => {
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts(cloudProducts);
      }
    });

    const unsubSettings = subscribeToStoreSettings((cloudSettings) => {
      if (cloudSettings) {
        setSettings(cloudSettings);
        if (cloudSettings.adminPin) {
          const effectivePin =
            cloudSettings.adminPin === '1234' ? 'olehbumaryani' : cloudSettings.adminPin;
          setAdminPin(effectivePin);
        }
      }
    });

    const unsubOrders = subscribeToOrders((cloudOrders) => {
      if (isAdminLoggedIn && cloudOrders) {
        if (hasInitializedOrdersRef.current && cloudOrders.length > prevOrderCountRef.current) {
          const newest = cloudOrders[0];
          setActiveToastOrder(newest);
          playOrderChime();
        }
        prevOrderCountRef.current = cloudOrders.length;
        hasInitializedOrdersRef.current = true;
        setOrders(cloudOrders);
      }
    });

    return () => {
      unsubProducts();
      unsubSettings();
      unsubOrders();
    };
  }, [loadData, isAdminLoggedIn]);

  // Poll for store updates and new orders every 12 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await api.getStoreData();
        if (data.products) setProducts(data.products);
        if (data.settings) setSettings(data.settings);

        if (isAdminLoggedIn) {
          const freshOrders = await api.getAdminOrders(adminPin);
          if (freshOrders) {
            if (hasInitializedOrdersRef.current && freshOrders.length > prevOrderCountRef.current) {
              // New order detected!
              const newest = freshOrders[0];
              setActiveToastOrder(newest);
              playOrderChime();
            }
            prevOrderCountRef.current = freshOrders.length;
            hasInitializedOrdersRef.current = true;
            setOrders(freshOrders);
          }
        }
      } catch {
        // silent
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [isAdminLoggedIn, adminPin]);

  // Cart actions
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = Math.min(
          product.stock,
          updated[existingIndex].quantity + quantity
        );
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      } else {
        return [...prevCart, { product, quantity: Math.min(product.stock, quantity) }];
      }
    });
  };

  const handleUpdateCartQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity: Math.min(item.product.stock, newQty),
          };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Direct WhatsApp purchase from product card
  const handleBuyDirectWhatsapp = (product: Product, quantity = 1) => {
    handleAddToCart(product, quantity);
    setIsCartOpen(true);
  };

  // Checkout submission
  const handleCheckoutSuccess = async (customerData: {
    customerName: string;
    phone: string;
    deliveryMethod: 'kirim' | 'ambil_toko';
    address: string;
    notes: string;
  }) => {
    const totalAmount = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const orderNumber = `${Date.now().toString().slice(-6)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customer: {
        name: customerData.customerName,
        phone: customerData.phone,
        deliveryMethod: customerData.deliveryMethod,
        address: customerData.address,
        notes: customerData.notes,
      },
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        unit: item.product.unit,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      })),
      totalAmount,
      totalItems,
      status: 'menunggu_konfirmasi',
      createdAt: new Date().toISOString(),
      whatsappSent: true,
    };

    // Submit to server & local
    const res = await api.submitOrder(newOrder);

    // Update local product stocks
    if (res.remainingProducts) {
      setProducts(res.remainingProducts);
    } else {
      setProducts((prev) =>
        prev.map((p) => {
          const item = cart.find((c) => c.product.id === p.id);
          if (item) {
            return { ...p, stock: Math.max(0, p.stock - item.quantity) };
          }
          return p;
        })
      );
    }

    // Clear cart
    setCart([]);
    setIsCartOpen(false);

    // Show order success modal
    setOrderSuccess(newOrder);

    // Auto trigger WhatsApp window
    const waEncoded = buildWhatsAppOrderMessage(newOrder, settings);
    const waUrl = `https://wa.me/${settings.phone}?text=${waEncoded}`;
    window.open(waUrl, '_blank');

    // Auto-sync order to Google Sheets if configured and enabled
    if (settings.googleSpreadsheetId && (settings.googleSheetsAutoSync ?? true)) {
      getAccessToken().then((token) => {
        if (token && settings.googleSpreadsheetId) {
          appendOrderToSheet(token, settings.googleSpreadsheetId, newOrder).catch((e) => {
            console.warn('Auto sync order to Google Sheets failed:', e);
          });
        }
      });
    }
  };

  // Admin auth handlers
  const handleAdminLogin = async (enteredPin: string): Promise<boolean> => {
    const valid = await api.verifyPin(enteredPin, adminPin);
    if (valid) {
      setIsAdminLoggedIn(true);
      setAdminPin(enteredPin);
      try {
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      } catch {
        // quota
      }
      // Load orders
      const ords = await api.getAdminOrders(enteredPin);
      setOrders(ords);
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setActiveToastOrder(null);
    hasInitializedOrdersRef.current = false;
    prevOrderCountRef.current = 0;
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // quota
    }
  };

  // Admin Product Actions
  const handleAdminUpdateProduct = async (product: Product, oldProductId?: string): Promise<boolean> => {
    const ok = await api.updateProduct(product, adminPin, oldProductId);
    if (ok) {
      const prevId = oldProductId || product.id;
      setProducts((prev) => prev.map((p) => (p.id === prevId ? product : p)));
    }
    return ok;
  };

  const handleAdminAddProduct = async (
    product: Omit<Product, 'createdAt'> & { id?: string }
  ): Promise<Product> => {
    const newProd = await api.addProduct(product, adminPin);
    setProducts((prev) => [newProd, ...prev]);
    return newProd;
  };

  const handleAdminDeleteProduct = async (productId: string): Promise<boolean> => {
    const ok = await api.deleteProduct(productId, adminPin);
    if (ok) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
    return ok;
  };

  // Admin Order Actions
  const handleAdminUpdateOrderStatus = async (
    orderId: string,
    status: Order['status']
  ): Promise<boolean> => {
    const ok = await api.updateOrderStatus(orderId, status, adminPin);
    if (ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    }
    return ok;
  };

  // Admin Settings Actions
  const handleAdminUpdateSettings = async (newSettings: StoreSettings): Promise<boolean> => {
    const ok = await api.updateSettings(newSettings, adminPin);
    if (ok) {
      setSettings(newSettings);
      if (newSettings.adminPin) {
        setAdminPin(newSettings.adminPin);
      }
    }
    return ok;
  };

  const handleAdminResetDemo = async () => {
    setProducts([...DEFAULT_PRODUCTS]);
    setOrders([]);
    setSettings({ ...DEFAULT_STORE_SETTINGS });
    setAdminPin(DEFAULT_STORE_SETTINGS.adminPin);
  };

  const handleAdminClearOrders = async () => {
    await api.clearAllOrders(adminPin);
    setOrders([]);
  };

  const handleUpdateProductsBulk = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    try {
      localStorage.setItem('bu_maryani_products_v1', JSON.stringify(updatedProducts));
    } catch {
      // quota
    }
  };

  // Filtered products for customer view (only active products, sorted by ID Produk P001, P002, ...)
  const customerProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      if (!product.isActive) return false;

      // Category filter
      if (activeCategory !== 'all' && product.category !== activeCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = formatProductId(product.id).toLowerCase().includes(q);
        const matchName = product.name.toLowerCase().includes(q);
        const matchDesc = product.description.toLowerCase().includes(q);
        const matchCat = product.category.toLowerCase().includes(q);
        return matchId || matchName || matchDesc || matchCat;
      }

      return true;
    });

    return sortProductsByProductId(filtered);
  }, [products, activeCategory, searchQuery]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-50 text-neutral-900 flex flex-col font-sans selection:bg-amber-200">
      {/* PWA / Android Install Notification Bar */}
      <PWAInstallButton onOpenApkModal={() => setIsAndroidApkOpen(true)} />

      {/* Navbar */}
      <Navbar
        settings={settings}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Hero Banner with Category Filters */}
      <BannerHero
        settings={settings}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onOpenShare={() => setIsShareOpen(true)}
        products={products}
      />

      {/* Main Content: Product Catalog */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              <span>Katalog Oleh-Oleh Khas Klaten</span>
              <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                {customerProducts.length} Produk
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Pilihan cemilan asli Klaten siap pesan. Klik untuk detail atau beli via WhatsApp.
            </p>
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-amber-800 hover:text-amber-950 font-semibold cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-neutral-200 p-4 h-72 animate-pulse flex flex-col justify-between"
              >
                <div className="w-full h-36 bg-neutral-200 rounded-xl mb-3" />
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-neutral-100 rounded w-1/2 mb-4" />
                <div className="h-8 bg-neutral-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : customerProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-12 text-center max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-neutral-900 text-base">Produk Tidak Ditemukan</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-5">
              Tidak ada cemilan yang sesuai dengan kata kunci &quot;{searchQuery}&quot; atau kategori yang dipilih.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tampilkan Semua Snack
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {customerProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onBuyDirectWhatsapp={handleBuyDirectWhatsapp}
                onViewDetail={(prod) => setSelectedProductDetail(prod)}
              />
            ))}
          </div>
        )}

        {/* In-Page Quick Delivery & Store Info */}
        <section className="mt-12 rounded-3xl bg-gradient-to-br from-amber-900 to-amber-950 text-white p-6 sm:p-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-2">
                <MapPin className="w-4 h-4" />
                <span>Alamat Toko di Klaten</span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                {settings.address}
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  settings.storeName + ' ' + settings.address
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-white font-bold mt-2.5"
              >
                <span>Buka Petunjuk Arah Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div>
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-2">
                <Clock className="w-4 h-4" />
                <span>Jam Buka & Operasional</span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                {settings.openingHours}
              </p>
              <p className="text-[11px] text-amber-300/80 mt-2">
                Bisa pesan online 24 jam via WhatsApp. Pengiriman dilakukan setiap hari kerja & libur nasional.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-2">
                <Phone className="w-4 h-4" />
                <span>Kontak & Pemesanan Grosir</span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                WhatsApp: <span className="font-bold text-white font-mono">{settings.phone}</span>
              </p>
              <p className="text-[11px] text-amber-200/80 mt-1">
                Melayani pesanan partai besar, oleh-oleh rombongan piknik, atau hajatan.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setIsShareOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan Link Toko</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 text-xs py-8 border-t border-neutral-800 mt-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo Bu Maryani"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div>
              <span className="font-cooper text-base text-white tracking-wide block">
                {settings.storeName === 'Toko Oleh Oleh Bu Maryani' ? 'Bu Maryani' : (settings.storeName || 'Bu Maryani')}
              </span>
              <p className="text-[11px] text-neutral-400">PUSAT OLEH OLEH KLATEN • Kios Pasar Klaten (Since 1965)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
            {isAdminLoggedIn && (
              <>
                <button
                  onClick={() => setIsAndroidApkOpen(true)}
                  className="hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer text-emerald-300 font-semibold"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Aplikasi Android (.APK)</span>
                </button>
                <span>•</span>
                <button
                  onClick={() => setIsDownloadOpen(true)}
                  className="hover:text-yellow-300 flex items-center gap-1 transition-colors cursor-pointer text-yellow-200"
                >
                  <Download className="w-3 h-3" />
                  <span>Download File &amp; Data</span>
                </button>
                <span>•</span>
              </>
            )}
            <button
              onClick={() => setIsShareOpen(true)}
              className="hover:text-yellow-300 transition-colors cursor-pointer"
            >
              Bagikan Toko
            </button>
            <span>•</span>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="hover:text-yellow-300 flex items-center gap-1 transition-colors cursor-pointer text-neutral-300"
            >
              <Lock className="w-3 h-3" />
              <span>Kelola Toko (Admin HP)</span>
            </button>
          </div>

          <p className="text-[11px] text-neutral-500">
            &copy; {new Date().getFullYear()} {settings.storeName}. Siap upload di hosting.
          </p>
        </div>
      </footer>

      {/* Floating Cart Button (Mobile View) */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:hidden z-30">
          <button
            id="mobile-floating-cart-btn"
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl shadow-xl shadow-red-950/30 flex items-center justify-between transition-transform active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>Keranjang ({totalCartCount} item)</span>
            </div>
            <span className="bg-yellow-300 text-neutral-900 px-2.5 py-1 rounded-xl text-xs font-bold">
              Buka Keranjang &rarr;
            </span>
          </button>
        </div>
      )}

      {/* MODALS */}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
        onAddToCart={handleAddToCart}
        onBuyDirectWhatsapp={handleBuyDirectWhatsapp}
      />

      {/* Cart Modal / Drawer */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        settings={settings}
        onCheckoutSuccess={handleCheckoutSuccess}
      />

      {/* Order Success & WhatsApp Direct Link Modal */}
      <OrderSuccessModal
        order={orderSuccess}
        settings={settings}
        onClose={() => setOrderSuccess(null)}
      />

      {/* Mobile Admin Portal Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        orders={orders}
        settings={settings}
        adminPin={adminPin}
        isLoggedIn={isAdminLoggedIn}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        onUpdateProduct={handleAdminUpdateProduct}
        onAddProduct={handleAdminAddProduct}
        onDeleteProduct={handleAdminDeleteProduct}
        onUpdateOrderStatus={handleAdminUpdateOrderStatus}
        onUpdateSettings={handleAdminUpdateSettings}
        onResetDemo={handleAdminResetDemo}
        onClearOrders={handleAdminClearOrders}
        onUpdateProductsBulk={handleUpdateProductsBulk}
        onOpenAndroidApk={() => setIsAndroidApkOpen(true)}
      />

      {/* Share Link Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        settings={settings}
      />

      {/* Download Center Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        products={products}
        orders={orders}
        settings={settings}
        onOpenSheetsTab={() => setIsAdminOpen(true)}
        onOpenAndroidApk={() => setIsAndroidApkOpen(true)}
      />

      {/* Android APK & Install Modal */}
      <AndroidApkModal
        isOpen={isAndroidApkOpen}
        onClose={() => setIsAndroidApkOpen(false)}
        appUrl={
          window.location.origin.includes('://ais-dev-')
            ? window.location.origin.replace('://ais-dev-', '://ais-pre-')
            : window.location.origin
        }
      />

      {/* Order Notification Toast for Admin (only shown in Admin mode) */}
      {isAdminLoggedIn && (
        <OrderNotificationToast
          order={activeToastOrder}
          onDismiss={() => setActiveToastOrder(null)}
          onViewOrder={() => setIsAdminOpen(true)}
        />
      )}
    </div>
  );
}
