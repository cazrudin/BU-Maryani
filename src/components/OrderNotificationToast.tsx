import { Order } from '../types';
import { formatRupiah } from '../utils/formatters';
import { Bell, X, ArrowRight } from 'lucide-react';

interface OrderNotificationToastProps {
  order: Order | null;
  onDismiss: () => void;
  onViewOrder: () => void;
}

export function OrderNotificationToast({
  order,
  onDismiss,
  onViewOrder,
}: OrderNotificationToastProps) {
  if (!order) return null;

  return (
    <aside
      aria-label="Notifikasi Order Baru"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-neutral-900 text-white rounded-2xl p-4 shadow-2xl border border-amber-500/40 animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0 mt-0.5 animate-bounce">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Order Baru Masuk!
              </span>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.2 rounded font-mono">
                #{order.orderNumber}
              </span>
            </div>
            <p className="text-sm font-bold text-white mt-0.5">
              {order.customer.name}
            </p>
            <p className="text-xs text-neutral-300">
              {order.items.length} item • {formatRupiah(order.totalAmount)}
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-2.5 border-t border-neutral-800 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400">
          {order.customer.deliveryMethod === 'ambil_toko' ? '🏬 Ambil Toko' : '🚚 Kirim Alamat'}
        </span>
        <button
          onClick={() => {
            onViewOrder();
            onDismiss();
          }}
          className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
        >
          <span>Lihat di Admin</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
