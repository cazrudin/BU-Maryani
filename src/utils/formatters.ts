import { Order, Product, StoreSettings } from '../types';

/**
 * Format any product id (e.g. 'P001', 'P1', 'prod-1') into canonical 'P001' format
 */
export function formatProductId(id: string | undefined | null): string {
  if (!id) return 'P001';
  const trimmed = id.trim();
  // If it's a simple 'P' followed by numbers or digits, format to standard P001...
  // but if it's already customized (e.g. SNK-01, OLEH-A, P005), keep it clean
  const pMatch = trimmed.match(/^P(\d+)$/i);
  if (pMatch && pMatch[1]) {
    const num = parseInt(pMatch[1], 10);
    return `P${num.toString().padStart(3, '0')}`;
  }
  return trimmed;
}

/**
 * Extract integer number from product ID (e.g. 'P005' -> 5, 'prod-12' -> 12)
 */
export function extractProductNumber(id: string | undefined | null): number {
  if (!id) return 999999;
  const match = id.match(/(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 999999;
}

/**
 * Calculate the next product ID in sequence (e.g. if max is P010, return P011)
 */
export function getNextProductId(existingProducts: Product[]): string {
  if (!existingProducts || existingProducts.length === 0) {
    return 'P001';
  }
  let maxNum = 0;
  for (const p of existingProducts) {
    const n = extractProductNumber(p.id);
    if (n < 999999 && n > maxNum) {
      maxNum = n;
    }
  }
  const nextNum = maxNum + 1;
  return `P${nextNum.toString().padStart(3, '0')}`;
}

/**
 * Sort products ascending by product ID number (P001, P002, P003, ...)
 */
export function sortProductsByProductId(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const numA = extractProductNumber(a.id);
    const numB = extractProductNumber(b.id);
    if (numA !== numB) {
      return numA - numB;
    }
    return a.id.localeCompare(b.id);
  });
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date) + ' WIB';
  } catch {
    return dateString;
  }
}

/**
 * Builds a clear, professional WhatsApp message for Toko Oleh Oleh Bu Maryani
 */
export function buildWhatsAppOrderMessage(order: Order, settings: StoreSettings): string {
  const itemsText = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.productName}*\n   ↳ ${item.quantity} ${item.unit} x ${formatRupiah(item.price)} = *${formatRupiah(item.subtotal)}*`
    )
    .join('\n');

  const deliveryText =
    order.customer.deliveryMethod === 'ambil_toko'
      ? '🏬 *Ambil Sendiri di Toko Klaten*'
      : `🚚 *Kirim ke Alamat:*\n   ${order.customer.address || '-'}`;

  const notesText = order.customer.notes ? `\n📝 *Catatan Tambahan:*\n   ${order.customer.notes}` : '';

  const message = `Halo Admin *${settings.storeName}*, saya mau pesan oleh-oleh khas Klaten:

🧾 *NO. PESANAN: #${order.orderNumber}*
📅 *Tanggal:* ${formatDateIndo(order.createdAt)}

👤 *DATA PEMESAN:*
• Nama: *${order.customer.name}*
• No. HP/WA: *${order.customer.phone}*
• Metode: ${deliveryText}${notesText}

🛒 *DAFTAR BELANJA:*
${itemsText}

━━━━━━━━━━━━━━━━━━━
💰 *TOTAL BELANJA: ${formatRupiah(order.totalAmount)}*
━━━━━━━━━━━━━━━━━━━

Mohon info ketersediaan stok, ongkos kirim (jika dikirim), serta nomor rekening / QRIS untuk pembayaran ya Bu. Matur nuwun! 🙏`;

  return encodeURIComponent(message);
}

/**
 * Builds a short SMS / instant message text for SMS / notification
 */
export function buildShortSmsMessage(order: Order, settings: StoreSettings): string {
  const itemsSummary = order.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join(', ');
  return `[ORDER BARU ${settings.storeName}] #${order.orderNumber} dari ${order.customer.name} (${order.customer.phone}). Total: ${formatRupiah(order.totalAmount)}. Items: ${itemsSummary}. Metode: ${order.customer.deliveryMethod === 'ambil_toko' ? 'Ambil Toko' : 'Kirim'}.`;
}

/**
 * Audio chime using Web Audio API for incoming order notification
 */
export function playOrderChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Pleasant two-tone chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.8);
  } catch (err) {
    console.warn('Audio chime playback restricted or unsupported', err);
  }
}
