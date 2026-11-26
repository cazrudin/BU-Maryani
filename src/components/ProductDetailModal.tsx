import { useState } from 'react';
import { Product } from '../types';
import { formatRupiah, formatProductId } from '../utils/formatters';
import { X, ShoppingBag, MessageCircle, Plus, Minus } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyDirectWhatsapp: (product: Product, quantity: number) => void;
}

export function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onBuyDirectWhatsapp,
}: ProductDetailModalProps) {
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const handleDec = () => {
    if (qty > 1) setQty(qty - 1);
  };

  const handleInc = () => {
    setQty(qty + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="product-detail-modal"
        className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 max-h-[90vh] flex flex-col"
      >
        {/* Close button */}
        <button
          id="close-detail-btn"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal content scrollable */}
        <div className="overflow-y-auto p-0 flex-1">
          {/* Product Image Container (Bersih tanpa tulisan menutupi foto) */}
          <div className="relative aspect-16/10 w-full bg-neutral-100">
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-5 sm:p-6">
            {/* ID Produk persis di bagian atas Nama Produk */}
            <div className="mb-2 flex items-center">
              <span
                id={`modal-product-id-${product.id}`}
                className="inline-flex items-center text-xs font-sans font-bold tracking-wide bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs"
              >
                ID: {formatProductId(product.id)}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 leading-snug">
              {product.name}
            </h2>

            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-black text-red-700">
                {formatRupiah(product.price)}
              </span>
              <span className="text-sm font-medium text-neutral-500">
                / {product.unit}
              </span>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Deskripsi Produk
              </h4>
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            <div className="mt-5 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-500 font-medium block">Pilih Jumlah ({product.unit}):</span>
                <span className="text-sm font-bold text-neutral-900">
                  Subtotal: {formatRupiah(product.price * qty)}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white rounded-xl border border-neutral-300 p-1">
                <button
                  id="modal-dec-qty-btn"
                  onClick={handleDec}
                  disabled={qty <= 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-neutral-900">
                  {qty}
                </span>
                <button
                  id="modal-inc-qty-btn"
                  onClick={handleInc}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Catatan untuk pembeli dapat menanyakan stok langsung ke admin */}
            <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center gap-2 text-emerald-900 text-xs font-medium">
              <MessageCircle className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Pemesanan dalam jumlah banyak (grosir) atau cek stok terbaru dapat langsung konfirmasi via WhatsApp ke Admin Bu Maryani.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-white border-t border-neutral-200 grid grid-cols-2 gap-3">
          <button
            id="modal-add-cart-btn"
            onClick={() => {
              onAddToCart(product, qty);
              onClose();
            }}
            className="py-2.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <ShoppingBag className="w-4 h-4 text-red-700" />
            <span>+ Keranjang ({qty})</span>
          </button>

          <button
            id="modal-buy-wa-btn"
            onClick={() => {
              onBuyDirectWhatsapp(product, qty);
              onClose();
            }}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-900/15 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Pesan via WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
