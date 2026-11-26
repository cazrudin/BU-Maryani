import { Product, Order, StoreSettings } from '../types';
import { DEFAULT_PRODUCTS, DEFAULT_STORE_SETTINGS } from '../data/initialData';
import { getNextProductId } from '../utils/formatters';
import {
  fetchFirestoreProducts,
  saveFirestoreProduct,
  deleteFirestoreProduct,
  fetchFirestoreSettings,
  saveFirestoreSettings,
  fetchFirestoreOrders,
  saveFirestoreOrder,
  updateFirestoreOrderStatus,
  clearAllFirestoreOrders,
  seedInitialFirestoreData,
} from './firestoreService';

const STORAGE_KEYS = {
  PRODUCTS: 'bu_maryani_products_v1',
  SETTINGS: 'bu_maryani_settings_v1',
  ORDERS: 'bu_maryani_orders_v1',
  CART: 'bu_maryani_cart_v1',
  ADMIN_PIN: 'bu_maryani_admin_pin_v1',
};

// Local storage fallback helpers
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors
  }
}

// Initial seed trigger
seedInitialFirestoreData().catch(() => {});

export const api = {
  // Fetch products and settings from Firestore cloud database first
  async getStoreData(): Promise<{ products: Product[]; settings: StoreSettings }> {
    let cloudProducts: Product[] = [];
    let cloudSettings: StoreSettings | null = null;

    try {
      cloudProducts = await fetchFirestoreProducts();
      cloudSettings = await fetchFirestoreSettings();
    } catch (e) {
      console.warn('Firestore direct fetch warning:', e);
    }

    // If Firestore has data, it is the absolute source of truth
    if (cloudProducts.length > 0 && cloudSettings) {
      setLocal(STORAGE_KEYS.PRODUCTS, cloudProducts);
      setLocal(STORAGE_KEYS.SETTINGS, cloudSettings);
      return { products: cloudProducts, settings: cloudSettings };
    }

    if (cloudProducts.length > 0 && !cloudSettings) {
      const localSettings = getLocal<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_STORE_SETTINGS);
      return { products: cloudProducts, settings: localSettings };
    }

    if (cloudProducts.length === 0 && cloudSettings) {
      const localProducts = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      return { products: localProducts, settings: cloudSettings };
    }

    // Only fallback to Express API if Firestore returned nothing (e.g. offline)
    try {
      const res = await fetch('/api/store-data');
      if (res.ok) {
        const data = await res.json();
        const finalProds = data.products && data.products.length > 0 ? data.products : DEFAULT_PRODUCTS;
        const finalSettings = data.settings || DEFAULT_STORE_SETTINGS;
        setLocal(STORAGE_KEYS.PRODUCTS, finalProds);
        setLocal(STORAGE_KEYS.SETTINGS, finalSettings);
        return { products: finalProds, settings: finalSettings };
      }
    } catch (err) {
      console.warn('API store-data unavailable:', err);
    }

    const localProducts = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    const localSettings = getLocal<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_STORE_SETTINGS);
    if (localSettings.storeName === 'Toko Oleh Oleh Bu Maryani') {
      localSettings.storeName = 'Bu Maryani';
      setLocal(STORAGE_KEYS.SETTINGS, localSettings);
    }
    return { products: localProducts, settings: localSettings };
  },

  // Submit new customer order
  async submitOrder(order: Order): Promise<{ success: boolean; order: Order; remainingProducts?: Product[] }> {
    // 1. Save directly to Firestore Cloud Database
    try {
      await saveFirestoreOrder(order);
    } catch (e) {
      console.warn('Could not save order directly to Firestore:', e);
    }

    // 2. Also send to Express backend
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      if (res.ok) {
        const data = await res.json();
        const orders = getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
        orders.unshift(data.order);
        setLocal(STORAGE_KEYS.ORDERS, orders);

        if (data.remainingProducts) {
          setLocal(STORAGE_KEYS.PRODUCTS, data.remainingProducts);
          // Sync remaining product stocks to Firestore
          for (const p of data.remainingProducts) {
            saveFirestoreProduct(p).catch(() => {});
          }
        }
        return data;
      }
    } catch (err) {
      console.warn('Backend order submission fallback to local:', err);
    }

    // Fallback: update local products stock & save local order
    const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    for (const item of order.items) {
      const p = products.find((prod) => prod.id === item.productId);
      if (p) {
        p.stock = Math.max(0, p.stock - item.quantity);
        saveFirestoreProduct(p).catch(() => {});
      }
    }
    setLocal(STORAGE_KEYS.PRODUCTS, products);

    const orders = getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
    orders.unshift(order);
    setLocal(STORAGE_KEYS.ORDERS, orders);

    return { success: true, order, remainingProducts: products };
  },

  // Admin fetch orders
  async getAdminOrders(adminPin: string): Promise<Order[]> {
    try {
      const firestoreOrders = await fetchFirestoreOrders();
      if (firestoreOrders && firestoreOrders.length > 0) {
        setLocal(STORAGE_KEYS.ORDERS, firestoreOrders);
        return firestoreOrders;
      }
    } catch (e) {
      console.warn('Firestore orders fetch warning:', e);
    }

    try {
      const res = await fetch('/api/admin/orders', {
        headers: { 'x-admin-pin': adminPin },
      });
      if (res.ok) {
        const data = await res.json();
        setLocal(STORAGE_KEYS.ORDERS, data.orders);
        return data.orders;
      }
    } catch (err) {
      console.warn('Failed to fetch admin orders from server:', err);
    }

    return getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
  },

  // Admin update order status
  async updateOrderStatus(orderId: string, status: Order['status'], adminPin: string): Promise<boolean> {
    try {
      await updateFirestoreOrderStatus(orderId, status);
    } catch (e) {
      console.warn('Firestore update order status warning:', e);
    }

    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.warn('Failed to update status on server:', err);
    }

    const orders = getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
    const o = orders.find((ord) => ord.id === orderId);
    if (o) {
      o.status = status;
      setLocal(STORAGE_KEYS.ORDERS, orders);
    }
    return true;
  },

  // Admin / Owner clear & reset all orders to 0 (for clean bookkeeping / chart)
  async clearAllOrders(adminPin: string): Promise<boolean> {
    try {
      await clearAllFirestoreOrders();
    } catch (e) {
      console.warn('Firestore clear orders warning:', e);
    }

    try {
      await fetch('/api/admin/clear-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
      });
    } catch (err) {
      console.warn('Failed to clear orders on server:', err);
    }

    setLocal(STORAGE_KEYS.ORDERS, []);
    return true;
  },

  // Admin update product (stock, price, photo, custom ID, etc.)
  async updateProduct(product: Product, adminPin: string, oldProductId?: string): Promise<boolean> {
    const prevId = oldProductId && oldProductId !== product.id ? oldProductId : product.id;

    // 1. Immediately save to Firestore Cloud Database
    try {
      if (oldProductId && oldProductId !== product.id) {
        // ID changed: save new document first, then delete old document
        await saveFirestoreProduct(product);
        try {
          await deleteFirestoreProduct(oldProductId);
        } catch (delErr) {
          console.warn('Old firestore product deletion notice:', delErr);
        }
      } else {
        await saveFirestoreProduct(product);
      }
    } catch (e) {
      console.error('Failed to save product to Firestore cloud:', e);
    }

    // 2. Also send to Express backend
    try {
      await fetch(`/api/products/${prevId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify(product),
      });
    } catch (err) {
      console.warn('Failed to update product on server:', err);
    }

    const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    const index = products.findIndex((p) => p.id === prevId);
    if (index !== -1) {
      products[index] = product;
    } else {
      products.push(product);
    }
    setLocal(STORAGE_KEYS.PRODUCTS, products);

    return true;
  },

  // Admin add product with auto-incrementing or custom ID Produk (P001, P002, ...)
  async addProduct(product: Omit<Product, 'createdAt'> & { id?: string }, adminPin: string): Promise<Product> {
    const currentProducts = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    const assignedId = (product.id && product.id.trim()) || getNextProductId(currentProducts);

    const newProduct: Product = {
      ...product,
      id: assignedId,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveFirestoreProduct(newProduct);
    } catch (e) {
      console.error('Firestore add product error:', e);
    }

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify(newProduct),
      });
    } catch (err) {
      console.warn('Failed to add product on server:', err);
    }

    currentProducts.push(newProduct);
    setLocal(STORAGE_KEYS.PRODUCTS, currentProducts);
    return newProduct;
  },

  // Admin delete product
  async deleteProduct(productId: string, adminPin: string): Promise<boolean> {
    try {
      await deleteFirestoreProduct(productId);
    } catch (e) {
      console.error('Firestore delete product error:', e);
    }

    try {
      await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin },
      });
    } catch (err) {
      console.warn('Failed to delete product on server:', err);
    }

    let products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    products = products.filter((p) => p.id !== productId);
    setLocal(STORAGE_KEYS.PRODUCTS, products);
    return true;
  },

  // Admin update store settings
  async updateSettings(settings: StoreSettings, adminPin: string): Promise<boolean> {
    // 1. Immediately save to Firestore Cloud Database
    try {
      await saveFirestoreSettings(settings);
    } catch (e) {
      console.error('Firestore save settings error:', e);
    }

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify(settings),
      });
    } catch (err) {
      console.warn('Failed to update settings on server:', err);
    }

    setLocal(STORAGE_KEYS.SETTINGS, settings);
    return true;
  },

  // Verify PIN
  async verifyPin(enteredPin: string, currentPin: string): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: enteredPin }),
      });
      if (res.ok) return true;
    } catch {
      // Fallback local
    }
    return enteredPin === currentPin;
  },
};
