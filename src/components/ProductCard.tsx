import React, { useState } from 'react';
import { Product } from '../types';
import { formatRupiah, formatProductId } from '../utils/formatters';
import { ShoppingBag, MessageCircle, Check } from 'lucide-react';

export interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (product: Product, quantity?: number) => void;
  onBuyDirectWhatsapp: (product: Product, quantity?: number) => void;
  onViewDetail: (product: Product) => void;
}

export function ProductCard({
  product,
  onAddToCart,
  onBuyDirectWhatsapp,
  onViewDetail,
}: ProductCardProps) {
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const isOutOfStock = product.stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product, 1);
    setIsAddedFeedback(true);
    setTimeout(() => setIsAddedFeedback(false), 1500);
  };

  const handleQuickWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBuyDirectWhatsapp(product);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onViewDetail(product)}
      className="group bg-white rounded-2xl border border-neutral-200/90 hover:border-red-400 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Product Image Container (Bersih tanpa tulisan yang menutupi foto) */}
      <div className="relative w-full aspect-4/3 overflow-hidden bg-neutral-100">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* ID Produk persis di bagian atas Nama Produk */}
          <div className="mb-1.5 flex items-center">
            <span
              id={`product-id-badge-${product.id}`}
              className="inline-flex items-center text-[11px] sm:text-xs font-sans font-bold tracking-wide bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs"
            >
              ID: {formatProductId(product.id)}
            </span>
          </div>

          <h3 className="font-bold text-neutral-900 text-sm sm:text-base leading-snug group-hover:text-red-700 transition-colors line-clamp-2">
            {product.name}
          </h3>

          <p className="mt-1 text-xs text-neutral-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Unit & Actions */}
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-xs text-neutral-500 font-medium">Harga:</span>
              <div className="text-base sm:text-lg font-black text-red-700 leading-tight">
                {formatRupiah(product.price)}
                <span className="text-xs font-normal text-neutral-500 ml-1">
                  / {product.unit}
                </span>
              </div>
            </div>
            {isOutOfStock && (
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                Stok Habis
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            {/* Quick Add To Cart */}
            <button
              id={`add-cart-btn-${product.id}`}
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`w-full py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                  : isAddedFeedback
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-200/90'
              }`}
            >
              {isAddedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Masuk!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>+ Keranjang</span>
                </>
              )}
            </button>

            {/* Quick WhatsApp order */}
            <button
              id={`buy-wa-btn-${product.id}`}
              onClick={handleQuickWhatsApp}
              disabled={isOutOfStock}
              className={`w-full py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Pesan WA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
