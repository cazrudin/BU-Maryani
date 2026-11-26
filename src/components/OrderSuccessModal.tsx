import { useState } from 'react';
import { Order, StoreSettings } from '../types';
import { formatRupiah, buildWhatsAppOrderMessage, buildShortSmsMessage } from '../utils/formatters';
import { CheckCircle2, MessageCircle, Copy, Check, ExternalLink, X } from 'lucide-react';

interface OrderSuccessModalProps {
  order: Order | null;
  settings: StoreSettings;
  onClose: () => void;
}

export function OrderSuccessModal({ order, settings, onClose }: OrderSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const waEncoded = buildWhatsAppOrderMessage(order, settings);
  const waUrl = `https://wa.me/${settings.phone}?text=${waEncoded}`;
  const shortSms = buildShortSmsMessage(order, settings);

  const handleCopy = () => {
    navigator.clipboard.writeText(shortSms);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="order-success-modal"
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200 text-center flex flex-col items-center"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 w-8 h-8 rounded-full flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <img
          src="/logo.png"
          alt="Logo Bu Maryani"
          className="h-14 w-auto object-contain mb-2 drop-shadow-sm"
        />

        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-extrabold text-neutral-900">
          Pesanan Berhasil Dibuat!
        </h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-xs">
          No. Pesanan: <span className="font-bold text-neutral-900">#{order.orderNumber}</span>
        </p>

        {/* Order Card Brief */}
        <div className="w-full my-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-left space-y-2">
          <div className="flex justify-between text-xs text-neutral-600">
            <span>Pemesan:</span>
            <span className="font-bold text-neutral-900">{order.customer.name}</span>
          </div>
          <div className="flex justify-between text-xs text-neutral-600">
            <span>Metode:</span>
            <span className="font-bold text-neutral-900">
              {order.customer.deliveryMethod === 'ambil_toko' ? 'Ambil di Toko' : 'Kirim Paket'}
            </span>
          </div>
          <div className="flex justify-between text-xs text-neutral-600">
            <span>Total Belanja:</span>
            <span className="font-black text-red-700 text-sm">{formatRupiah(order.totalAmount)}</span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 mb-5 leading-relaxed">
          Silakan klik tombol di bawah untuk melanjutkan dan mengirim rincian belanjaan ke WhatsApp Bu Maryani agar pesanan segera diproses.
        </p>

        {/* Big WhatsApp Action Button */}
        <a
          id="send-whatsapp-order-btn"
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 transition-all cursor-pointer mb-2.5"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Kirim Rincian ke WhatsApp Toko</span>
          <ExternalLink className="w-4 h-4 opacity-70" />
        </a>

        {/* Copy Short Summary */}
        <button
          id="copy-sms-summary-btn"
          onClick={handleCopy}
          className="w-full py-2 px-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Tersalin ke Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Salin Format Pesan Singkat / SMS</span>
            </>
          )}
        </button>

        <button
          onClick={onClose}
          className="mt-4 text-xs font-semibold text-neutral-400 hover:text-neutral-700 cursor-pointer"
        >
          Kembali ke Katalog Belanja
        </button>
      </div>
    </div>
  );
}
