import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocFromServer,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Order, StoreSettings } from '../types';
import { DEFAULT_PRODUCTS, DEFAULT_STORE_SETTINGS } from '../data/initialData';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Explicitly connect to the project's provisioned named database
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || 'ai-studio-tokooleholehbuma-9a80e67f-28b9-4a21-9404-03117683e2fd'
);

// Error logging helper as mandated by skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
}

// Quick connection tester
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
    return false;
  }
}

// Real-time listener for Store Settings
export function subscribeToStoreSettings(
  callback: (settings: StoreSettings) => void
): Unsubscribe {
  const path = 'settings/store';
  return onSnapshot(
    doc(db, 'settings', 'store'),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as StoreSettings);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

// Real-time listener for Products
export function subscribeToProducts(
  callback: (products: Product[]) => void
): Unsubscribe {
  const path = 'products';
  return onSnapshot(
    collection(db, 'products'),
    (snap) => {
      if (!snap.empty) {
        const list: Product[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
        });
        callback(list);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

// Real-time listener for Orders
export function subscribeToOrders(
  callback: (orders: Order[]) => void
): Unsubscribe {
  const path = 'orders';
  return onSnapshot(
    collection(db, 'orders'),
    (snap) => {
      const orders: Order[] = [];
      snap.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) });
      });
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(orders);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

// PRODUCTS
export async function fetchFirestoreProducts(): Promise<Product[]> {
  try {
    const colRef = collection(db, 'products');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
      });
      return list;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'products');
  }
  return [];
}

export async function saveFirestoreProduct(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  try {
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, product, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteFirestoreProduct(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

// STORE SETTINGS
export async function fetchFirestoreSettings(): Promise<StoreSettings | null> {
  const path = 'settings/store';
  try {
    const docRef = doc(db, 'settings', 'store');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as StoreSettings;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
  return null;
}

export async function saveFirestoreSettings(settings: StoreSettings): Promise<void> {
  const path = 'settings/store';
  try {
    const docRef = doc(db, 'settings', 'store');
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

// ORDERS
export async function fetchFirestoreOrders(): Promise<Order[]> {
  const path = 'orders';
  try {
    const colRef = collection(db, 'orders');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const orders: Order[] = [];
    snapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) });
    });
    return orders;
  } catch (err) {
    try {
      const colRef = collection(db, 'orders');
      const snapshot = await getDocs(colRef);
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) });
      });
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return orders;
    } catch (innerErr) {
      handleFirestoreError(innerErr, OperationType.LIST, path);
    }
  }
  return [];
}

export async function saveFirestoreOrder(order: Order): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, order);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function updateFirestoreOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

// Clear all orders from Firestore (for reset / starting clean bookkeeping from 0)
export async function clearAllFirestoreOrders(): Promise<void> {
  const path = 'orders';
  try {
    const colRef = collection(db, 'orders');
    const snapshot = await getDocs(colRef);
    const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(doc(db, 'orders', docSnap.id)));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Error clearing firestore orders:', err);
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Seed initial data to Firestore if empty
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    // 1. Check settings
    const settingsSnap = await getDoc(doc(db, 'settings', 'store'));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, 'settings', 'store'), DEFAULT_STORE_SETTINGS);
    }

    // 2. Check products
    const prodSnap = await getDocs(collection(db, 'products'));
    if (prodSnap.empty) {
      for (const prod of DEFAULT_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
    }
  } catch (err) {
    console.warn('Firestore seed warning (proceeding with local/memory):', err);
  }
}
