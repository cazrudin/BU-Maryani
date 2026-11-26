import { Order, Product, StoreSettings } from '../types';
import { formatDateIndo } from './formatters';

/**
 * Triggers a file download in the browser.
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Escapes a cell value for CSV format.
 */
function escapeCsvCell(cell: string | number | boolean | null | undefined): string {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell);
  // If contains commas, double quotes, or newlines, wrap in quotes and escape internal quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates and triggers download of a CSV file with UTF-8 BOM for Microsoft Excel.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | boolean)[][]) {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCsvCell).join(','));
  // \uFEFF is UTF-8 Byte Order Mark, needed so Excel reads Indonesian/Unicode correctly
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  triggerFileDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Generates and downloads the Orders CSV file.
 */
export function downloadOrdersCsv(orders: Order[], storeName: string) {
  const headers = [
    'No. Pesanan',
    'Tanggal Waktu',
    'Nama Pelanggan',
    'No. WhatsApp',
    'Metode Pengiriman',
    'Alamat Pengiriman',
    'Catatan',
    'Daftar Item Snack',
    'Total Item',
    'Total Bayar (Rp)',
    'Status Pesanan',
  ];

  const rows = orders.map((order) => {
    const itemsSummary = order.items
      .map((item) => `${item.productName} (${item.quantity} ${item.unit})`)
      .join('; ');

    return [
      `#${order.orderNumber}`,
      formatDateIndo(order.createdAt),
      order.customer.name,
      order.customer.phone,
      order.customer.deliveryMethod === 'ambil_toko' ? 'Ambil di Toko' : 'Kirim ke Alamat',
      order.customer.address || '-',
      order.customer.notes || '-',
      itemsSummary,
      order.totalItems,
      order.totalAmount,
      order.status,
    ];
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanStoreName = storeName.replace(/[^a-zA-Z0-9]/g, '_');
  downloadCsv(`Laporan_Pesanan_${cleanStoreName}_${dateStr}.csv`, headers, rows);
}

/**
 * Generates and downloads the Products CSV file.
 */
export function downloadProductsCsv(products: Product[], storeName: string) {
  const headers = [
    'ID Produk',
    'Nama Snack',
    'Kategori',
    'Harga (Rp)',
    'Satuan',
    'Sisa Stok',
    'Berat (gram)',
    'Status Aktif',
    'Deskripsi',
  ];

  const rows = products.map((product) => [
    product.id,
    product.name,
    product.category,
    product.price,
    product.unit,
    product.stock,
    product.weightGram || 250,
    product.isActive ? 'Aktif' : 'Nonaktif',
    product.description || '',
  ]);

  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanStoreName = storeName.replace(/[^a-zA-Z0-9]/g, '_');
  downloadCsv(`Katalog_Stok_Snack_${cleanStoreName}_${dateStr}.csv`, headers, rows);
}

/**
 * Generates and downloads full JSON backup of the store.
 */
export function downloadStoreBackupJson(
  products: Product[],
  orders: Order[],
  settings: StoreSettings
) {
  const backupData = {
    exportedAt: new Date().toISOString(),
    store: {
      name: settings.storeName,
      address: settings.address,
      phone: settings.phone,
      tagline: settings.tagline,
      googleSpreadsheetId: settings.googleSpreadsheetId,
      googleSpreadsheetUrl: settings.googleSpreadsheetUrl,
    },
    totalProducts: products.length,
    totalOrders: orders.length,
    products,
    orders,
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanStoreName = settings.storeName.replace(/[^a-zA-Z0-9]/g, '_');
  triggerFileDownload(
    jsonString,
    `Backup_Data_${cleanStoreName}_${dateStr}.json`,
    'application/json;charset=utf-8;'
  );
}
