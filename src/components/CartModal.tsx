import React, { useState } from 'react';
import { CartItem, StoreSettings } from '../types';
import { formatRupiah } from '../utils/formatters';
import { X, Trash2, Plus, Minus, ShoppingBag, Send, AlertCircle, MapPin, Store } from 'lucide-react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  settings: StoreSettings;
  onCheckoutSuccess: (orderData: {
    customerName: string;
    phone: string;
    deliveryMethod: 'kirim' | 'ambil_toko';
    address: string;
    notes: string;
  }) => void;
}

export function CartModal({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  settings,
  onCheckoutSuccess,
}: CartModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'kirim' | 'ambil_toko'>('kirim');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('Keranjang belanja Anda masih kosong.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Silakan masukkan nama Anda.');
      return;
    }

    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMsg('Silakan masukkan nomor WhatsApp/HP yang aktif (minimal 8 digit).');
      return;
    }

    if (deliveryMethod === 'kirim' && !address.trim()) {
      setErrorMsg('Silakan masukkan alamat lengkap pengiriman paket.');
      return;
    }

    // Check if any product quantity exceeds current stock
    for (const item of cart) {
      if (item.quantity > item.product.stock) {
        setErrorMsg(
          `Stok untuk "${item.product.name}" hanya tersisa ${item.product.stock} ${item.product.unit}. Harap kurangi jumlah pembelian.`
        );
        return;
      }
    }

    onCheckoutSuccess({
      customerName: name.trim(),
      phone: phone.trim(),
      deliveryMethod,
      address: address.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="cart-drawer"
        className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 bg-amber-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Keranjang Belanja</h2>
              <p className="text-xs text-neutral-500">
                {totalItems} item dipilih • {settings.storeName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                id="clear-cart-btn"
                onClick={onClearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Kosongkan Keranjang"
              >
                Kosongkan
              </button>
            )}
            <button
              id="close-cart-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Cart Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-neutral-800 text-base">Keranjang Anda Masih Kosong</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Yuk pilih aneka snack dan oleh-oleh khas Klaten Bu Maryani yang renyah dan gurih!
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Mulai Belanja
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Daftar Pesanan ({cart.length} Jenis Snack)
                </h4>
                {cart.map(({ product, quantity }) => {
                  const subtotal = product.price * quantity;
                  const isExceedStock = quantity > product.stock;

                  return (
                    <div
                      key={product.id}
                      id={`cart-item-${product.id}`}
                      className={`p-3 rounded-2xl border flex gap-3 transition-all ${
                        isExceedStock
                          ? 'border-rose-300 bg-rose-50/50'
                          : 'border-neutral-200 bg-neutral-50/50'
                      }`}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 object-cover rounded-xl shrink-0 bg-neutral-200"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-neutral-900 truncate">
                            {product.name}
                          </h4>
                          <button
                            id={`remove-cart-item-${product.id}`}
                            onClick={() => onRemoveItem(product.id)}
                            className="text-neutral-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                            title="Hapus item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-xs text-neutral-500 mt-0.5">
                          {formatRupiah(product.price)} / {product.unit}
                        </div>

                        {isExceedStock && (
                          <div className="text-[11px] text-rose-600 font-semibold mt-1">
                            ⚠️ Melebihi stok (tersisa {product.stock} {product.unit})
                          </div>
                        )}

                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 bg-white border border-neutral-300 rounded-lg p-0.5">
                            <button
                              id={`cart-dec-${product.id}`}
                              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                              disabled={quantity <= 1}
                              className="w-6 h-6 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center text-xs font-bold text-neutral-900">
                              {quantity}
                            </span>
                            <button
                              id={`cart-inc-${product.id}`}
                              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                              disabled={quantity >= product.stock}
                              className="w-6 h-6 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-red-700">
                              {formatRupiah(subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Customer Checkout Form */}
              <div className="border-t border-neutral-200 pt-4 space-y-3.5">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Informasi Pengiriman
                </h4>

                {/* Delivery Method Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('kirim')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      deliveryMethod === 'kirim'
                        ? 'border-red-600 bg-red-50 text-red-900 shadow-xs'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span>Kirim ke Alamat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('ambil_toko')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      deliveryMethod === 'ambil_toko'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <Store className="w-4 h-4 text-emerald-600" />
                    <span>Ambil di Toko</span>
                  </button>
                </div>

                {deliveryMethod === 'ambil_toko' && (
                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                    <p className="font-bold">📍 Lokasi Toko Bu Maryani:</p>
                    <p className="mt-0.5 text-neutral-700">{settings.address}</p>
                    <p className="mt-1 text-[11px] text-emerald-800">
                      Pesanan akan disiapkan dan bisa langsung diambil di kios pasar setelah konfirmasi WA.
                    </p>
                  </div>
                )}

                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nama Lengkap Pemesan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="checkout-name-input"
                    type="text"
                    required
                    placeholder="Contoh: Ibu Rina / Pak Budi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>

                {/* Customer WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    No. WhatsApp / HP Aktif <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="checkout-phone-input"
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Untuk konfirmasi total pesanan & nomor resi kiriman
                  </p>
                </div>

                {/* Delivery Address (if kirim) */}
                {deliveryMethod === 'kirim' && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Alamat Pengiriman Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="checkout-address-input"
                      rows={2}
                      required
                      placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden resize-none"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    id="checkout-notes-input"
                    type="text"
                    placeholder="Misal: minta toples dipisah, kirim siang hari..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer with Total & WhatsApp Button */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50/90 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-neutral-500 font-medium">Total Pembelian:</span>
                <p className="text-xs text-neutral-400">Belum termasuk ongkir jika dikirim</p>
              </div>
              <span className="text-xl sm:text-2xl font-black text-red-700">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            <button
              id="checkout-whatsapp-submit-btn"
              type="button"
              onClick={handleSubmitOrder}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
              <span>Pesan Sekarang via WhatsApp</span>
            </button>

            <p className="text-[11px] text-center text-neutral-500">
              Otomatis tersambung ke WhatsApp Bu Maryani ({settings.phone})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
