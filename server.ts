import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_PRODUCTS, DEFAULT_STORE_SETTINGS } from './src/data/initialData';
import { Product, Order, StoreSettings } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Persistence directory and file
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

interface StoreDatabase {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
}

// In-memory state initialized with defaults or saved file
let db: StoreDatabase = {
  products: [...DEFAULT_PRODUCTS],
  orders: [],
  settings: { ...DEFAULT_STORE_SETTINGS },
};

function loadDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.products && Array.isArray(parsed.products)) {
        db.products = parsed.products.map((p: Product, idx: number) => {
          if (!p.id || !p.id.startsWith('P')) {
            const num = idx + 1;
            return { ...p, id: `P${num.toString().padStart(3, '0')}` };
          }
          return p;
        });
      }
      if (parsed.orders && Array.isArray(parsed.orders)) {
        db.orders = parsed.orders;
      }
      if (parsed.settings) {
        const merged = { ...DEFAULT_STORE_SETTINGS, ...parsed.settings };
        if (merged.adminPin === '1234') {
          merged.adminPin = 'olehbumaryani';
        }
        db.settings = merged;
      }
    }
  } catch (err) {
    console.error('Failed to load database file, using defaults:', err);
  }
}

function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

loadDatabase();

// --- API ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', storeName: db.settings.storeName });
});

// Get all store data (public for catalog, orders filtered if needed)
app.get('/api/store-data', (req, res) => {
  res.json({
    products: db.products,
    settings: {
      ...db.settings,
      // Protect adminPin from public payload
      adminPin: undefined,
      hasAdminPin: Boolean(db.settings.adminPin),
    },
    ordersCount: db.orders.length,
  });
});

// Admin verify PIN
app.post('/api/admin/verify', (req, res) => {
  const { pin } = req.body;
  if (pin === db.settings.adminPin) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'PIN Salah' });
  }
});

// Admin get orders (secured with PIN in header)
app.get('/api/admin/orders', (req, res) => {
  const pin = req.headers['x-admin-pin'];
  if (pin !== db.settings.adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ orders: db.orders });
});

// Customer submit order
app.post('/api/orders', (req, res) => {
  const orderData: Order = req.body;

  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return res.status(400).json({ error: 'Data pesanan tidak lengkap' });
  }

  // Deduct stock for ordered items
  let stockError = '';
  for (const item of orderData.items) {
    const product = db.products.find((p) => p.id === item.productId);
    if (product) {
      if (product.stock < item.quantity) {
        stockError = `Stok ${product.name} tidak mencukupi (sisa ${product.stock})`;
        break;
      }
    }
  }

  if (stockError) {
    return res.status(400).json({ error: stockError });
  }

  // Apply stock deduction
  for (const item of orderData.items) {
    const product = db.products.find((p) => p.id === item.productId);
    if (product) {
      product.stock = Math.max(0, product.stock - item.quantity);
    }
  }

  const newOrder: Order = {
    ...orderData,
    id: orderData.id || `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderNumber: orderData.orderNumber || `${Date.now().toString().slice(-6)}`,
    status: 'menunggu_konfirmasi',
    createdAt: new Date().toISOString(),
  };

  db.orders.unshift(newOrder);
  saveDatabase();

  res.json({ success: true, order: newOrder, remainingProducts: db.products });
});

// Admin update order status
app.put('/api/orders/:id/status', (req, res) => {
  const pin = req.headers['x-admin-pin'];
  if (pin !== db.settings.adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  const { status } = req.body;

  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.status = status;
  saveDatabase();
  res.json({ success: true, order });
});

// Helper to calculate next P001-style ID in server
function getNextServerProductId(products: Product[]): string {
  let maxNum = 0;
  for (const p of products) {
    const match = p.id.match(/(\d+)/);
    if (match && match[1]) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  const nextNum = maxNum + 1;
  return `P${nextNum.toString().padStart(3, '0')}`;
}

// Admin add product
app.post('/api/products', (req, res) => {
  const pin = req.headers['x-admin-pin'];
  if (pin !== db.settings.adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const assignedId = req.body.id && req.body.id.startsWith('P')
    ? req.body.id
    : getNextServerProductId(db.products);

  const newProduct: Product = {
    ...req.body,
    id: assignedId,
    createdAt: new Date().toISOString(),
    isActive: req.body.isActive !== false,
  };

  db.products.push(newProduct);
  saveDatabase();
  res.json({ success: true, product: newProduct });
});

// Admin edit product (stock, price, photo, custom ID, etc.)
app.put('/api/products/:id', (req, res) => {
  const pin = req.headers['x-admin-pin'];
  if (pin !== db.settings.adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const newId = req.body.id ? String(req.body.id).trim() : id;

  db.products[index] = {
    ...db.products[index],
    ...req.body,
    id: newId || id,
  };

  saveDatabase();
  res.json({ success: true, product: db.products[index] });
});

// Admin delete product
app.delete('/api/products/:id', (req, res) => {
  const pin = req.headers['x-admin-pin'];
  if (pin !== db.settings.adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  db.products = db.products.filter((p) => p.id !== id);
  saveDatabase();
  res.json({ success: true });
});

// Admin update settings
app.put('/api/settings', (req, res) => {
  const pin = req.headers['x-admin-pin'];
  if (pin !== db.settings.adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.settings = {
    ...db.settings,
    ...req.body,
  };

  saveDatabase();
  res.json({ success: true, settings: db.settings });
});

// Reset demo data
app.post('/api/admin/reset-demo', (req, res) => {
  const pin = req.headers['x-admin-pin'];
  if (pin !== db.settings.adminPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.products = [...DEFAULT_PRODUCTS];
  db.orders = [];
  db.settings = { ...DEFAULT_STORE_SETTINGS };
  saveDatabase();
  res.json({ success: true });
});

// Clear / Nol-kan semua transaksi & pesanan untuk pembukuan baru
app.post('/api/admin/clear-orders', (req, res) => {
  const pin = req.headers['x-admin-pin'];
  const ownerPinHeader = req.headers['x-owner-pin'];
  const currentAdminPin = db.settings.adminPin;
  const currentOwnerPin = db.settings.ownerPin || '1802';

  // Allow if admin pin OR owner pin is provided
  if (pin !== currentAdminPin && ownerPinHeader !== currentOwnerPin && pin !== currentOwnerPin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.orders = [];
  saveDatabase();
  res.json({ success: true, message: 'Semua riwayat transaksi & pesanan berhasil dinolkan.' });
});

// --- VITE / STATIC MIDDLEWARE ---
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (
            filePath.endsWith('index.html') ||
            filePath.endsWith('sw.js') ||
            filePath.endsWith('manifest.webmanifest')
          ) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Toko Oleh Oleh Bu Maryani server running on http://0.0.0.0:${PORT}`);
  });
}

start();
