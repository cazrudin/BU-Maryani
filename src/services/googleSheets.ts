import { Order, Product, StoreSettings } from '../types';
import { formatDateIndo } from '../utils/formatters';

export interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SheetSyncResult {
  success: boolean;
  message: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  count?: number;
}

export const ORDER_SHEET_TITLE = 'Pesanan Masuk';
export const PRODUCT_SHEET_TITLE = 'Katalog & Stok Snack';

export const ORDER_HEADERS = [
  'ID Pesanan',
  'No. Pesanan',
  'Tanggal & Waktu',
  'Nama Pelanggan',
  'No. WhatsApp',
  'Metode Pengiriman',
  'Alamat Pengiriman',
  'Catatan Pembeli',
  'Daftar Item Snack',
  'Total Item',
  'Total Bayar (Rp)',
  'Status Pesanan',
];

export const PRODUCT_HEADERS = [
  'ID Produk',
  'Nama Snack',
  'Kategori',
  'Harga (Rp)',
  'Satuan',
  'Stok',
  'Berat (gram)',
  'Status Aktif (TRUE/FALSE)',
  'Deskripsi',
];

/**
 * Extract spreadsheetId if user inputs a full Google Sheets URL
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Format order to row array
 */
export function orderToRow(order: Order): (string | number)[] {
  const itemsSummary = order.items
    .map((item) => `${item.productName} (${item.quantity} ${item.unit})`)
    .join('; ');

  return [
    order.id,
    order.orderNumber,
    formatDateIndo(order.createdAt),
    order.customer.name,
    order.customer.phone,
    order.customer.deliveryMethod === 'ambil_toko' ? 'Ambil di Toko Klaten' : 'Kirim ke Alamat',
    order.customer.address || '-',
    order.customer.notes || '-',
    itemsSummary,
    order.totalItems,
    order.totalAmount,
    order.status,
  ];
}

/**
 * Format product to row array
 */
export function productToRow(product: Product): (string | number | boolean)[] {
  return [
    product.id,
    product.name,
    product.category,
    product.price,
    product.unit,
    product.stock,
    product.weightGram || 250,
    product.isActive ? 'TRUE' : 'FALSE',
    product.description || '',
  ];
}

/**
 * List user's Google Spreadsheets from Google Drive
 */
export async function listUserSpreadsheets(accessToken: string): Promise<GoogleDriveFile[]> {
  try {
    const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime%20desc&pageSize=30&fields=${fields}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gagal mengambil daftar spreadsheet: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (err: unknown) {
    console.error('listUserSpreadsheets error:', err);
    throw err;
  }
}

/**
 * Create a new, professionally formatted Google Spreadsheet for Toko Oleh Oleh Bu Maryani
 */
export async function createStoreSpreadsheet(
  accessToken: string,
  storeSettings: StoreSettings,
  products: Product[],
  orders: Order[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const title = `Toko Oleh Oleh ${storeSettings.storeName || 'Bu Maryani'} - Pembukuan & Pesanan`;

  // Payload for initial spreadsheet creation
  const createPayload = {
    properties: {
      title,
      locale: 'id_ID',
      timeZone: 'Asia/Jakarta',
    },
    sheets: [
      {
        properties: {
          title: ORDER_SHEET_TITLE,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: Math.max(100, orders.length + 20),
            columnCount: ORDER_HEADERS.length + 2,
          },
        },
      },
      {
        properties: {
          title: PRODUCT_SHEET_TITLE,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: Math.max(100, products.length + 20),
            columnCount: PRODUCT_HEADERS.length + 2,
          },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Populate data into both sheets
  const orderRows = [ORDER_HEADERS, ...orders.map(orderToRow)];
  const productRows = [PRODUCT_HEADERS, ...products.map(productToRow)];

  const batchUpdateValuesPayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: `'${ORDER_SHEET_TITLE}'!A1`,
        values: orderRows,
      },
      {
        range: `'${PRODUCT_SHEET_TITLE}'!A1`,
        values: productRows,
      },
    ],
  };

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(batchUpdateValuesPayload),
  });

  // Apply visual styling (amber header background `#78350F`, bold white text)
  try {
    const orderSheetId = sheetData.sheets?.[0]?.properties?.sheetId ?? 0;
    const productSheetId = sheetData.sheets?.[1]?.properties?.sheetId ?? 1;

    const styleRequests = [
      {
        repeatCell: {
          range: {
            sheetId: orderSheetId,
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.47, green: 0.21, blue: 0.06 }, // Amber-900
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: true,
                fontSize: 10,
              },
              horizontalAlignment: 'CENTER',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
        },
      },
      {
        repeatCell: {
          range: {
            sheetId: productSheetId,
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.12, green: 0.35, blue: 0.22 }, // Emerald dark
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: true,
                fontSize: 10,
              },
              horizontalAlignment: 'CENTER',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
        },
      },
    ];

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: styleRequests }),
    });
  } catch (e) {
    console.warn('Styling header error:', e);
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Check if the required sheets exist; if missing, create them
 */
export async function ensureTabsExist(accessToken: string, spreadsheetId: string): Promise<void> {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Spreadsheet tidak dapat diakses.');
  }

  const meta = await metaRes.json();
  const existingSheetTitles: string[] = (meta.sheets || []).map(
    (s: { properties?: { title?: string } }) => s.properties?.title || ''
  );

  const requests: any[] = [];

  if (!existingSheetTitles.includes(ORDER_SHEET_TITLE)) {
    requests.push({
      addSheet: {
        properties: {
          title: ORDER_SHEET_TITLE,
          gridProperties: { frozenRowCount: 1 },
        },
      },
    });
  }

  if (!existingSheetTitles.includes(PRODUCT_SHEET_TITLE)) {
    requests.push({
      addSheet: {
        properties: {
          title: PRODUCT_SHEET_TITLE,
          gridProperties: { frozenRowCount: 1 },
        },
      },
    });
  }

  if (requests.length > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });
  }
}

/**
 * Append a single order to the active spreadsheet
 */
export async function appendOrderToSheet(
  accessToken: string,
  spreadsheetId: string,
  order: Order
): Promise<boolean> {
  try {
    const row = orderToRow(order);
    const range = encodeURIComponent(`'${ORDER_SHEET_TITLE}'!A:L`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('appendOrderToSheet error:', err);
    return false;
  }
}

/**
 * Export all current orders to Google Sheets
 */
export async function exportAllOrdersToSheet(
  accessToken: string,
  spreadsheetId: string,
  orders: Order[]
): Promise<SheetSyncResult> {
  try {
    await ensureTabsExist(accessToken, spreadsheetId);

    // Clear previous rows from A2 onwards
    try {
      const clearRange = encodeURIComponent(`'${ORDER_SHEET_TITLE}'!A2:L1000`);
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch {
      // non-fatal
    }

    // Prepare rows: Headers at row 1, orders starting row 2
    const rows = [ORDER_HEADERS, ...orders.map(orderToRow)];
    const range = encodeURIComponent(`'${ORDER_SHEET_TITLE}'!A1`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    return {
      success: true,
      message: `Berhasil mengekspor ${orders.length} pesanan ke sheet "${ORDER_SHEET_TITLE}".`,
      count: orders.length,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengekspor pesanan.';
    return { success: false, message: msg };
  }
}

/**
 * Export all products & stock to Google Sheets
 */
export async function exportProductsToSheet(
  accessToken: string,
  spreadsheetId: string,
  products: Product[]
): Promise<SheetSyncResult> {
  try {
    await ensureTabsExist(accessToken, spreadsheetId);

    // Clear previous rows
    try {
      const clearRange = encodeURIComponent(`'${PRODUCT_SHEET_TITLE}'!A2:I500`);
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch {
      // non-fatal
    }

    const rows = [PRODUCT_HEADERS, ...products.map(productToRow)];
    const range = encodeURIComponent(`'${PRODUCT_SHEET_TITLE}'!A1`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    return {
      success: true,
      message: `Berhasil mengekspor ${products.length} produk & stok ke sheet "${PRODUCT_SHEET_TITLE}".`,
      count: products.length,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengekspor produk.';
    return { success: false, message: msg };
  }
}

/**
 * Import and update products stock and prices from Google Sheets
 */
export async function importProductsFromSheet(
  accessToken: string,
  spreadsheetId: string,
  currentProducts: Product[]
): Promise<{
  success: boolean;
  message: string;
  updatedProducts?: Product[];
  changesCount?: number;
}> {
  try {
    const range = encodeURIComponent(`'${PRODUCT_SHEET_TITLE}'!A2:I200`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.error?.message ||
          `Sheet "${PRODUCT_SHEET_TITLE}" tidak ditemukan. Pastikan sudah melakukan ekspor katalog terlebih dahulu.`
      );
    }

    const data = await res.json();
    const rows: string[][] = data.values || [];

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Tidak ada data produk di sheet. Pastikan sheet berisi data di bawah header baris ke-1.',
      };
    }

    let changesCount = 0;
    const productMap = new Map<string, Product>();
    currentProducts.forEach((p) => productMap.set(p.id, { ...p }));

    for (const row of rows) {
      const [id, name, category, priceStr, unit, stockStr, weightStr, activeStr, desc] = row;
      if (!id || !name) continue;

      const existing = productMap.get(id);
      const parsedPrice = parseInt(String(priceStr).replace(/[^0-9]/g, ''), 10) || (existing?.price ?? 25000);
      const parsedStock = parseInt(String(stockStr).replace(/[^0-9]/g, ''), 10) || 0;
      const parsedWeight = parseInt(String(weightStr).replace(/[^0-9]/g, ''), 10) || (existing?.weightGram ?? 250);
      const parsedActive = String(activeStr).trim().toUpperCase() !== 'FALSE';

      if (existing) {
        const hasDiff =
          existing.price !== parsedPrice ||
          existing.stock !== parsedStock ||
          existing.name !== name ||
          existing.unit !== (unit || existing.unit) ||
          existing.isActive !== parsedActive;

        if (hasDiff) changesCount++;

        productMap.set(id, {
          ...existing,
          name: name || existing.name,
          category: (category as any) || existing.category,
          price: parsedPrice,
          unit: unit || existing.unit,
          stock: parsedStock,
          weightGram: parsedWeight,
          isActive: parsedActive,
          description: desc || existing.description,
        });
      } else {
        // New product found in sheet
        changesCount++;
        const newProd: Product = {
          id: id.startsWith('prod-') ? id : `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name,
          category: (category as any) || 'keripik',
          price: parsedPrice,
          unit: unit || 'bungkus',
          stock: parsedStock,
          weightGram: parsedWeight,
          isActive: parsedActive,
          description: desc || 'Snack khas Klaten',
          image:
            'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80',
          createdAt: new Date().toISOString(),
        };
        productMap.set(newProd.id, newProd);
      }
    }

    const updatedProducts = Array.from(productMap.values());
    return {
      success: true,
      message: `Sinkronisasi selesai! ${changesCount} perubahan harga/stok berhasil diperbarui dari Google Sheets.`,
      updatedProducts,
      changesCount,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal membaca data dari Google Sheets.';
    return { success: false, message: msg };
  }
}
