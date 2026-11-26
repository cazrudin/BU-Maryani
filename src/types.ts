export interface Product {
  id: string;
  name: string;
  category: 'keripik' | 'manis' | 'tradisional' | 'paket' | string;
  price: number;
  unit: string; // 'bungkus' | 'kg' | 'pcs' | 'toples' | 'besek' | 'box'
  stock: number;
  minOrder?: number;
  weightGram?: number;
  image: string;
  description: string;
  isPopular?: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  deliveryMethod: 'kirim' | 'ambil_toko';
  address?: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  unit: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItem[];
  totalAmount: number;
  totalItems: number;
  status: 'menunggu_konfirmasi' | 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
  createdAt: string;
  whatsappSent: boolean;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  phone: string; // WhatsApp number (e.g. 628123456789)
  address: string;
  city: string;
  openingHours: string;
  bankInfo: string;
  adminPin: string;
  ownerPin?: string;
  notificationSoundEnabled: boolean;
  welcomeMessage: string;
  googleSpreadsheetId?: string;
  googleSpreadsheetUrl?: string;
  googleSpreadsheetName?: string;
  googleSheetsAutoSync?: boolean;
  googleSheetsLastSync?: string;
}
