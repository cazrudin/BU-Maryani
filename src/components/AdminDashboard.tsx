import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Calendar,
  BarChart3,
  PieChart as PieIcon,
  Truck,
  ArrowUpRight,
  Sparkles,
  Key,
  Lock,
  RotateCcw,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Order, Product } from '../types';
import { formatRupiah } from '../utils/formatters';

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
  currentOwnerPin: string;
  onNavigateToOrders?: () => void;
  onClearOrders?: () => Promise<void>;
  onUpdateOwnerPin?: (newPin: string) => Promise<boolean>;
  onLockOwner?: () => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const STATUS_COLORS: Record<string, string> = {
  selesai: '#10b981', // emerald
  diproses: '#3b82f6', // blue
  menunggu_konfirmasi: '#f59e0b', // amber
  dibatalkan: '#ef4444', // red
  dikirim: '#8b5cf6', // purple
};

const STATUS_LABELS: Record<string, string> = {
  selesai: 'Selesai',
  diproses: 'Diproses',
  menunggu_konfirmasi: 'Menunggu',
  dikirim: 'Dikirim',
  dibatalkan: 'Dibatalkan',
};

// Historical baseline points (optional toggle for previewing chart layout)
const BASELINE_MONTHLY_DATA = [
  { monthKey: '2026-03', monthName: 'Mar 2026', omzet: 2450000, pesanan: 18, itemsSold: 64 },
  { monthKey: '2026-04', monthName: 'Apr 2026', omzet: 3820000, pesanan: 27, itemsSold: 96 },
  { monthKey: '2026-05', monthName: 'Mei 2026', omzet: 4150000, pesanan: 31, itemsSold: 112 },
  { monthKey: '2026-06', monthName: 'Jun 2026', omzet: 3900000, pesanan: 29, itemsSold: 104 },
  { monthKey: '2026-07', monthName: 'Jul 2026', omzet: 5200000, pesanan: 38, itemsSold: 142 },
  { monthKey: '2026-08', monthName: 'Agu 2026', omzet: 6100000, pesanan: 45, itemsSold: 168 },
  { monthKey: '2026-09', monthName: 'Sep 2026', omzet: 4850000, pesanan: 36, itemsSold: 130 },
];

export function AdminDashboard({
  orders,
  products,
  currentOwnerPin,
  onNavigateToOrders,
  onClearOrders,
  onUpdateOwnerPin,
  onLockOwner,
}: AdminDashboardProps) {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | '6m' | '12m' | 'custom' | 'all'>('6m');
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid_only'>('all');
  // Default to FALSE so new bookkeeping starts clean from 0
  const [includeBaseline, setIncludeBaseline] = useState<boolean>(false);

  // Custom date range state (Tanggal Awal & Tanggal Akhir acak)
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Modal States
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isResetOrdersModalOpen, setIsResetOrdersModalOpen] = useState(false);
  const [isClearingOrders, setIsClearingOrders] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Change PIN form state
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [pinChangeError, setPinChangeError] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Filter orders based on status choice
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'valid_only') {
      return orders.filter((o) => o.status !== 'dibatalkan');
    }
    return orders;
  }, [orders, statusFilter]);

  // Aggregate performance from orders based on chosen timeRange (Harian, Mingguan, Bulanan, 6 Bulan, 1 Tahun, Semua)
  const monthlyData = useMemo(() => {
    const grouped: Record<
      string,
      {
        monthKey: string;
        periodLabel: string;
        monthName: string;
        omzet: number;
        pesanan: number;
        itemsSold: number;
        completedCount: number;
      }
    > = {};

    const now = new Date();

    if (timeRange === 'daily') {
      // 1. HARIAN (Daily aggregation - Last 14 days)
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const y = d.getFullYear();
        const m = d.getMonth();
        const dateNum = d.getDate();
        const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
        const label = `${dateNum} ${MONTH_NAMES[m]}`;
        grouped[key] = {
          monthKey: key,
          periodLabel: label,
          monthName: label,
          omzet: includeBaseline ? Math.round(150000 + ((i * 37) % 250000)) : 0,
          pesanan: includeBaseline ? Math.max(1, Math.round(2 + ((i * 3) % 5))) : 0,
          itemsSold: includeBaseline ? Math.max(2, Math.round(5 + ((i * 7) % 12))) : 0,
          completedCount: includeBaseline ? 1 : 0,
        };
      }

      filteredOrders.forEach((order) => {
        try {
          const d = new Date(order.createdAt);
          if (isNaN(d.getTime())) return;
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const label = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;

          const isCancelled = order.status === 'dibatalkan';
          const orderOmzet = isCancelled ? 0 : order.totalAmount || 0;
          const orderItems = isCancelled
            ? 0
            : (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

          if (!grouped[key]) {
            grouped[key] = {
              monthKey: key,
              periodLabel: label,
              monthName: label,
              omzet: 0,
              pesanan: 0,
              itemsSold: 0,
              completedCount: 0,
            };
          }

          grouped[key].omzet += orderOmzet;
          grouped[key].pesanan += 1;
          grouped[key].itemsSold += orderItems;
          if (order.status === 'selesai') {
            grouped[key].completedCount += 1;
          }
        } catch (err) {
          console.warn('Error parsing daily order date:', err);
        }
      });

      return Object.values(grouped).sort((a, b) => a.monthKey.localeCompare(b.monthKey)).slice(-14);
    } else if (timeRange === 'weekly') {
      // 2. MINGGUAN (Weekly aggregation - Last 8 weeks)
      const getMonday = (d: Date) => {
        const dt = new Date(d);
        const day = dt.getDay();
        const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
        dt.setDate(diff);
        dt.setHours(0, 0, 0, 0);
        return dt;
      };

      const currentMonday = getMonday(now);
      for (let i = 7; i >= 0; i--) {
        const wDate = new Date(currentMonday);
        wDate.setDate(currentMonday.getDate() - i * 7);
        const y = wDate.getFullYear();
        const m = wDate.getMonth();
        const dateNum = wDate.getDate();
        const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
        const label = `Mgg ${dateNum} ${MONTH_NAMES[m]}`;
        grouped[key] = {
          monthKey: key,
          periodLabel: label,
          monthName: label,
          omzet: includeBaseline ? Math.round(950000 + ((i * 123) % 800000)) : 0,
          pesanan: includeBaseline ? Math.max(2, Math.round(8 + ((i * 5) % 15))) : 0,
          itemsSold: includeBaseline ? Math.max(5, Math.round(25 + ((i * 12) % 40))) : 0,
          completedCount: includeBaseline ? 7 : 0,
        };
      }

      filteredOrders.forEach((order) => {
        try {
          const d = new Date(order.createdAt);
          if (isNaN(d.getTime())) return;
          const mon = getMonday(d);
          const key = `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
          const label = `Mgg ${mon.getDate()} ${MONTH_NAMES[mon.getMonth()]}`;

          const isCancelled = order.status === 'dibatalkan';
          const orderOmzet = isCancelled ? 0 : order.totalAmount || 0;
          const orderItems = isCancelled
            ? 0
            : (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

          if (!grouped[key]) {
            grouped[key] = {
              monthKey: key,
              periodLabel: label,
              monthName: label,
              omzet: 0,
              pesanan: 0,
              itemsSold: 0,
              completedCount: 0,
            };
          }

          grouped[key].omzet += orderOmzet;
          grouped[key].pesanan += 1;
          grouped[key].itemsSold += orderItems;
          if (order.status === 'selesai') {
            grouped[key].completedCount += 1;
          }
        } catch (err) {
          console.warn('Error parsing weekly order date:', err);
        }
      });

      return Object.values(grouped).sort((a, b) => a.monthKey.localeCompare(b.monthKey)).slice(-8);
    } else if (timeRange === 'custom') {
      // 3. RENTANG KUSTOM (Pilihan tanggal awal & tanggal akhir bebas)
      const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : now;

      const validStart = isNaN(start.getTime()) ? new Date(now.getFullYear(), now.getMonth(), 1) : start;
      const validEnd = isNaN(end.getTime()) || end < validStart ? validStart : end;

      const diffDays = Math.max(1, Math.ceil((validEnd.getTime() - validStart.getTime()) / (1000 * 60 * 60 * 24)));

      if (diffDays <= 31) {
        // Rentang harian (≤ 31 hari): kelompokkan per hari
        const curr = new Date(validStart);
        while (curr <= validEnd) {
          const y = curr.getFullYear();
          const m = curr.getMonth();
          const dateNum = curr.getDate();
          const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
          const label = `${dateNum} ${MONTH_NAMES[m]}`;
          grouped[key] = {
            monthKey: key,
            periodLabel: label,
            monthName: label,
            omzet: 0,
            pesanan: 0,
            itemsSold: 0,
            completedCount: 0,
          };
          curr.setDate(curr.getDate() + 1);
        }

        filteredOrders.forEach((order) => {
          try {
            const d = new Date(order.createdAt);
            if (isNaN(d.getTime()) || d < validStart || d > validEnd) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const label = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;

            const isCancelled = order.status === 'dibatalkan';
            const orderOmzet = isCancelled ? 0 : order.totalAmount || 0;
            const orderItems = isCancelled
              ? 0
              : (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

            if (!grouped[key]) {
              grouped[key] = {
                monthKey: key,
                periodLabel: label,
                monthName: label,
                omzet: 0,
                pesanan: 0,
                itemsSold: 0,
                completedCount: 0,
              };
            }

            grouped[key].omzet += orderOmzet;
            grouped[key].pesanan += 1;
            grouped[key].itemsSold += orderItems;
            if (order.status === 'selesai') {
              grouped[key].completedCount += 1;
            }
          } catch (err) {
            console.warn('Error parsing custom order date:', err);
          }
        });

        return Object.values(grouped).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
      } else {
        // Rentang > 31 hari: kelompokkan per bulan
        const curr = new Date(validStart.getFullYear(), validStart.getMonth(), 1);
        while (curr <= validEnd) {
          const y = curr.getFullYear();
          const m = curr.getMonth();
          const key = `${y}-${String(m + 1).padStart(2, '0')}`;
          const label = `${MONTH_NAMES[m]} ${y}`;
          grouped[key] = {
            monthKey: key,
            periodLabel: label,
            monthName: label,
            omzet: 0,
            pesanan: 0,
            itemsSold: 0,
            completedCount: 0,
          };
          curr.setMonth(curr.getMonth() + 1);
        }

        filteredOrders.forEach((order) => {
          try {
            const d = new Date(order.createdAt);
            if (isNaN(d.getTime()) || d < validStart || d > validEnd) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

            const isCancelled = order.status === 'dibatalkan';
            const orderOmzet = isCancelled ? 0 : order.totalAmount || 0;
            const orderItems = isCancelled
              ? 0
              : (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

            if (!grouped[key]) {
              grouped[key] = {
                monthKey: key,
                periodLabel: label,
                monthName: label,
                omzet: 0,
                pesanan: 0,
                itemsSold: 0,
                completedCount: 0,
              };
            }

            grouped[key].omzet += orderOmzet;
            grouped[key].pesanan += 1;
            grouped[key].itemsSold += orderItems;
            if (order.status === 'selesai') {
              grouped[key].completedCount += 1;
            }
          } catch (err) {
            console.warn('Error parsing custom order date:', err);
          }
        });

        return Object.values(grouped).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
      }
    } else {
      // 4. BULANAN, 6 BULAN, 1 TAHUN, SEMUA (Monthly aggregations)
      if (includeBaseline) {
        BASELINE_MONTHLY_DATA.forEach((b) => {
          grouped[b.monthKey] = {
            monthKey: b.monthKey,
            periodLabel: b.monthName,
            monthName: b.monthName,
            omzet: b.omzet,
            pesanan: b.pesanan,
            itemsSold: b.itemsSold,
            completedCount: Math.round(b.pesanan * 0.9),
          };
        });
      }

      filteredOrders.forEach((order) => {
        try {
          const d = new Date(order.createdAt);
          if (isNaN(d.getTime())) return;
          const year = d.getFullYear();
          const monthNum = d.getMonth();
          const monthKey = `${year}-${String(monthNum + 1).padStart(2, '0')}`;
          const monthName = `${MONTH_NAMES[monthNum]} ${year}`;

          const isCancelled = order.status === 'dibatalkan';
          const orderOmzet = isCancelled ? 0 : order.totalAmount || 0;
          const orderItems = isCancelled
            ? 0
            : (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

          if (!grouped[monthKey]) {
            grouped[monthKey] = {
              monthKey,
              periodLabel: monthName,
              monthName,
              omzet: 0,
              pesanan: 0,
              itemsSold: 0,
              completedCount: 0,
            };
          }

          grouped[monthKey].omzet += orderOmzet;
          grouped[monthKey].pesanan += 1;
          grouped[monthKey].itemsSold += orderItems;
          if (order.status === 'selesai') {
            grouped[monthKey].completedCount += 1;
          }
        } catch (err) {
          console.warn('Error parsing order date for dashboard:', err);
        }
      });

      // If no data exists, generate past 6 calendar months with 0
      if (Object.keys(grouped).length === 0) {
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const y = d.getFullYear();
          const m = d.getMonth();
          const key = `${y}-${String(m + 1).padStart(2, '0')}`;
          const label = `${MONTH_NAMES[m]} ${y}`;
          grouped[key] = {
            monthKey: key,
            periodLabel: label,
            monthName: label,
            omzet: 0,
            pesanan: 0,
            itemsSold: 0,
            completedCount: 0,
          };
        }
      }

      const sorted = Object.values(grouped).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

      if (timeRange === 'monthly') {
        return sorted.slice(-4);
      } else if (timeRange === '6m') {
        return sorted.slice(-6);
      } else if (timeRange === '12m') {
        return sorted.slice(-12);
      }
      return sorted;
    }
  }, [filteredOrders, includeBaseline, timeRange]);

  // Overall KPI statistics
  const kpiStats = useMemo(() => {
    const totalOmzet = monthlyData.reduce((sum, item) => sum + item.omzet, 0);
    const totalOrders = monthlyData.reduce((sum, item) => sum + item.pesanan, 0);
    const totalItems = monthlyData.reduce((sum, item) => sum + item.itemsSold, 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalOmzet / totalOrders) : 0;

    // Current month comparison
    const currentMonthData = monthlyData[monthlyData.length - 1];
    const prevMonthData = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

    let growthPct = 0;
    if (prevMonthData && prevMonthData.omzet > 0 && currentMonthData) {
      growthPct = Math.round(((currentMonthData.omzet - prevMonthData.omzet) / prevMonthData.omzet) * 100);
    }

    return {
      totalOmzet,
      totalOrders,
      totalItems,
      avgOrderValue,
      currentMonthOrders: currentMonthData?.pesanan || 0,
      growthPct,
    };
  }, [monthlyData]);

  // Status breakdown for Pie Chart
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      selesai: 0,
      diproses: 0,
      menunggu_konfirmasi: 0,
      dikirim: 0,
      dibatalkan: 0,
    };

    orders.forEach((o) => {
      const s = o.status || 'menunggu_konfirmasi';
      counts[s] = (counts[s] || 0) + 1;
    });

    const activeList = Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([key, value]) => ({
        name: STATUS_LABELS[key] || key,
        key,
        value,
        color: STATUS_COLORS[key] || '#94a3b8',
      }));

    if (activeList.length === 0 && includeBaseline) {
      return [
        { name: 'Selesai', value: 24, key: 'selesai', color: STATUS_COLORS.selesai },
        { name: 'Diproses', value: 5, key: 'diproses', color: STATUS_COLORS.diproses },
        { name: 'Menunggu', value: 3, key: 'menunggu_konfirmasi', color: STATUS_COLORS.menunggu_konfirmasi },
      ];
    }

    return activeList;
  }, [orders, includeBaseline]);

  // Delivery Method Breakdown
  const deliveryDistribution = useMemo(() => {
    let kirimCount = 0;
    let ambilTokoCount = 0;

    orders.forEach((o) => {
      if (o.customer?.deliveryMethod === 'ambil_toko') {
        ambilTokoCount++;
      } else {
        kirimCount++;
      }
    });

    if (kirimCount === 0 && ambilTokoCount === 0 && includeBaseline) {
      kirimCount = 19;
      ambilTokoCount = 11;
    }

    return [
      { name: 'Kirim Ekspedisi', value: kirimCount, color: '#d97706' },
      { name: 'Ambil di Toko', value: ambilTokoCount, color: '#059669' },
    ];
  }, [orders, includeBaseline]);

  // Top Selling Products
  const topSellingProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    orders.forEach((order) => {
      if (order.status === 'dibatalkan') return;
      (order.items || []).forEach((item) => {
        const key = item.productId || item.productName;
        if (!productSales[key]) {
          productSales[key] = {
            name: item.productName || 'Snack',
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[key].quantity += item.quantity || 1;
        productSales[key].revenue += item.subtotal || ((item.price || 0) * (item.quantity || 1));
      });
    });

    const list = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);

    if (list.length === 0 && includeBaseline && products.length > 0) {
      return products.slice(0, 5).map((p, idx) => ({
        name: p.name,
        quantity: Math.max(10, 48 - idx * 8),
        revenue: Math.max(10, 48 - idx * 8) * p.price,
      }));
    }

    return list.slice(0, 5);
  }, [orders, products, includeBaseline]);

  // Y-Axis currency formatter
  const formatYAxisCurrency = (value: number) => {
    if (value >= 1000000) {
      const millions = value / 1000000;
      return `Rp ${millions % 1 === 0 ? millions : millions.toFixed(1)} jt`;
    }
    if (value >= 1000) {
      return `Rp ${Math.round(value / 1000)} rb`;
    }
    return `Rp ${value}`;
  };

  // Handler: Change Owner PIN
  const handleChangeOwnerPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError('');
    setPinChangeSuccess('');

    if (oldPinInput.trim() !== currentOwnerPin) {
      setPinChangeError('Sandi Owner saat ini tidak cocok!');
      return;
    }

    if (newPinInput.trim().length < 4) {
      setPinChangeError('Sandi baru minimal 4 karakter!');
      return;
    }

    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setPinChangeError('Konfirmasi sandi baru tidak sesuai!');
      return;
    }

    setIsSavingPin(true);
    try {
      if (onUpdateOwnerPin) {
        const ok = await onUpdateOwnerPin(newPinInput.trim());
        if (ok) {
          setPinChangeSuccess('Kata sandi Owner berhasil diperbarui! Simpan sandi baru Anda untuk login berikutnya.');
          setTimeout(() => {
            setIsChangePinOpen(false);
            setOldPinInput('');
            setNewPinInput('');
            setConfirmPinInput('');
            setPinChangeSuccess('');
          }, 1800);
        } else {
          setPinChangeError('Gagal menyimpan sandi baru. Silakan coba lagi.');
        }
      }
    } catch (err) {
      setPinChangeError('Terjadi kesalahan saat mengganti sandi.');
    } finally {
      setIsSavingPin(false);
    }
  };

  // Handler: Confirm Reset/Zero-out all Orders
  const handleExecuteClearOrders = async () => {
    setIsClearingOrders(true);
    try {
      if (onClearOrders) {
        await onClearOrders();
      }
      setResetSuccessMessage('Semua data transaksi berhasil dinolkan. Pembukuan baru telah aktif.');
      setTimeout(() => {
        setIsResetOrdersModalOpen(false);
        setResetSuccessMessage('');
      }, 1500);
    } catch (err) {
      console.error('Failed to clear orders:', err);
    } finally {
      setIsClearingOrders(false);
    }
  };

  const isStoreClean = orders.length === 0 && !includeBaseline;

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-neutral-100">
      {/* Top Banner / Owner Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-sm sm:text-base text-neutral-900 tracking-tight flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 shrink-0" />
              <span>Dashboard &amp; Grafik Penjualan</span>
            </h3>
            <span className="text-[10px] bg-amber-100 text-amber-950 font-bold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-800" />
              <span>Akses Terproteksi</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Laporan omzet, intensitas transaksi, dan rekap pembukuan otomatis Toko Bu Maryani Klaten.
          </p>
        </div>

        {/* Owner Action Buttons: Change PIN & Reset Bookkeeping */}
        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto">
          {/* Change PIN button */}
          <button
            id="btn-owner-change-pin"
            onClick={() => {
              setPinChangeError('');
              setPinChangeSuccess('');
              setIsChangePinOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Ganti kata sandi login secara rutin"
          >
            <Key className="w-3.5 h-3.5 text-amber-700" />
            <span>Ganti Sandi</span>
          </button>

          {/* Reset/Zero out button */}
          <button
            id="btn-owner-reset-orders"
            onClick={() => setIsResetOrdersModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Nol-kan semua transaksi dan pesanan untuk memulai awal pembukuan baru"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-700" />
            <span>Nol-kan Transaksi (Reset Pembukuan)</span>
          </button>

          {/* Lock Owner Mode button */}
          {onLockOwner && (
            <button
              onClick={onLockOwner}
              className="px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer"
              title="Kunci kembali Dashboard"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kunci</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean Slate / Zero State Notification */}
      {isStoreClean && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <h5 className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
              <span>Pembukuan Baru Aktif (0 Transaksi)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Bersih &amp; Siap Pakai
              </span>
            </h5>
            <p className="text-neutral-600 mt-1 leading-relaxed">
              Seluruh data transaksi saat ini bernilai <b>Rp 0</b>. Setiap pesanan baru dari pelanggan yang masuk melalui keranjang atau WhatsApp akan langsung tercatat dan diplotkan ke dalam grafik ini secara real-time.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Chart Type Controls */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-neutral-200 shadow-xs space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 text-neutral-600 font-medium">
            <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className="shrink-0 font-semibold text-neutral-800">Rentang Waktu:</span>
            <div className="flex flex-wrap items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 font-semibold gap-0.5">
              {[
                { id: 'daily', label: 'Harian' },
                { id: 'weekly', label: 'Mingguan' },
                { id: 'monthly', label: 'Bulanan' },
                { id: '6m', label: '6 Bulan' },
                { id: '12m', label: '1 Tahun' },
                { id: 'custom', label: '📅 Pilih Tanggal' },
                { id: 'all', label: 'Semua' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                    timeRange === range.id
                      ? 'bg-red-600 text-white shadow-xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 font-semibold">
              <button
                onClick={() => setChartType('area')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartType === 'area' ? 'bg-red-600 text-white shadow-xs font-bold' : 'text-neutral-600'
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartType === 'bar' ? 'bg-red-600 text-white shadow-xs font-bold' : 'text-neutral-600'
                }`}
              >
                Batang
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartType === 'line' ? 'bg-red-600 text-white shadow-xs font-bold' : 'text-neutral-600'
                }`}
              >
                Garis
              </button>
            </div>

            {/* Toggle sample preview if owner wants to see populated graph */}
            <button
              onClick={() => setIncludeBaseline(!includeBaseline)}
              className={`px-2.5 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                includeBaseline
                  ? 'bg-red-50 border-red-300 text-red-900 font-bold'
                  : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
              }`}
              title="Pratinjau grafik dengan sampel data toko jika pesanan live masih kosong"
            >
              <Sparkles className="w-3 h-3 text-red-600" />
              <span>Sampel Demo: {includeBaseline ? 'Aktif' : 'Mati'}</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker Box when 'custom' is active */}
        {timeRange === 'custom' && (
          <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/70 p-2.5 rounded-xl border">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-neutral-700 text-[11px]">Tanggal Awal:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-medium text-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 shadow-2xs"
                />
              </div>

              <span className="text-neutral-400 font-bold hidden sm:inline">&rarr;</span>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-neutral-700 text-[11px]">Tanggal Akhir:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-medium text-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Quick Presets for custom date */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-neutral-400 font-medium">Pintas:</span>
              <button
                type="button"
                onClick={() => {
                  const nowStr = new Date().toISOString().split('T')[0];
                  setCustomStartDate(nowStr);
                  setCustomEndDate(nowStr);
                }}
                className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-600 hover:text-red-700 hover:border-red-300 text-[11px] font-medium transition-colors"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  const endStr = d.toISOString().split('T')[0];
                  d.setDate(d.getDate() - 7);
                  const startStr = d.toISOString().split('T')[0];
                  setCustomStartDate(startStr);
                  setCustomEndDate(endStr);
                }}
                className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-600 hover:text-red-700 hover:border-red-300 text-[11px] font-medium transition-colors"
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  const endStr = d.toISOString().split('T')[0];
                  d.setDate(d.getDate() - 30);
                  const startStr = d.toISOString().split('T')[0];
                  setCustomStartDate(startStr);
                  setCustomEndDate(endStr);
                }}
                className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-600 hover:text-red-700 hover:border-red-300 text-[11px] font-medium transition-colors"
              >
                30 Hari
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                  setCustomStartDate(start);
                  setCustomEndDate(end);
                }}
                className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-600 hover:text-red-700 hover:border-red-300 text-[11px] font-medium transition-colors"
              >
                Bulan Ini
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4 Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Omzet */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-neutral-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Total Omzet Penjualan</span>
            <div className="w-7 h-7 rounded-xl bg-red-100 flex items-center justify-center text-red-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-xl font-black text-neutral-900 tracking-tight block">
              {formatRupiah(kpiStats.totalOmzet)}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-neutral-500 font-medium">
              {kpiStats.totalOmzet === 0 ? (
                <span>Mulai dari Rp 0</span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {kpiStats.growthPct >= 0 ? `+${kpiStats.growthPct}%` : `${kpiStats.growthPct}%`} {
                    timeRange === 'daily'
                      ? 'vs kemarin'
                      : timeRange === 'weekly'
                      ? 'vs mgg lalu'
                      : timeRange === 'monthly' || timeRange === '6m'
                      ? 'vs bln lalu'
                      : 'vs periode lalu'
                  }
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Total Pesanan */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-neutral-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Total Transaksi</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-xl font-black text-neutral-900 tracking-tight block">
              {kpiStats.totalOrders} <span className="text-xs font-normal text-neutral-500">Pesanan</span>
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-neutral-500">
              <span>Periode aktif: <b>{kpiStats.currentMonthOrders} order</b></span>
            </div>
          </div>
        </div>

        {/* Card 3: Rata-rata Belanja (AOV) */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-neutral-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Rata-rata Keranjang</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-xl font-black text-neutral-900 tracking-tight block">
              {formatRupiah(kpiStats.avgOrderValue)}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-neutral-500">
              <span>Per transaksi belanja</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Snack Terjual */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-neutral-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Total Snack Terjual</span>
            <div className="w-7 h-7 rounded-xl bg-red-100 flex items-center justify-center text-red-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-xl font-black text-neutral-900 tracking-tight block">
              {kpiStats.totalItems} <span className="text-xs font-normal text-neutral-500">bungkus</span>
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-neutral-500">
              <span>Katalog: {products.length} produk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Monthly Sales Recharts Container */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
              <span>
                Grafik Omzet &amp; Pesanan{' '}
                {timeRange === 'daily'
                  ? 'Harian'
                  : timeRange === 'weekly'
                  ? 'Mingguan'
                  : timeRange === 'monthly'
                  ? 'Bulanan'
                  : timeRange === '6m'
                  ? '6 Bulan'
                  : timeRange === '12m'
                  ? '1 Tahun'
                  : timeRange === 'custom'
                  ? `Rentang Kustom (${customStartDate} s/d ${customEndDate})`
                  : 'Semua Waktu'}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-50 text-red-900 border border-red-200">
                {monthlyData.length} Periode
              </span>
            </h4>
            <p className="text-xs text-neutral-500">
              Sumbu kiri: Pendapatan (IDR) &bull; Sumbu kanan: Jumlah pesanan
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-red-700">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
              Omzet (IDR)
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
              Jumlah Order
            </span>
          </div>
        </div>

        {/* Responsive Recharts Display */}
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="periodLabel"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxisCurrency}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val} order`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-neutral-900 text-white p-3 rounded-xl shadow-xl text-xs border border-neutral-800">
                          <p className="font-bold text-yellow-300 text-sm mb-1">{data.periodLabel || label}</p>
                          <div className="space-y-1">
                            <p className="flex justify-between gap-4">
                              <span className="text-neutral-400">Total Omzet:</span>
                              <span className="font-bold text-white">{formatRupiah(data.omzet)}</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-neutral-400">Jumlah Pesanan:</span>
                              <span className="font-bold text-emerald-400">{data.pesanan} Order</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-neutral-400">Snack Terjual:</span>
                              <span className="font-bold text-yellow-200">{data.itemsSold} bungkus</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="omzet"
                  name="Omzet"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorOmzet)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="pesanan"
                  name="Pesanan"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                />
              </AreaChart>
            ) : chartType === 'bar' ? (
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="periodLabel"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxisCurrency}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val} order`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-neutral-900 text-white p-3 rounded-xl shadow-xl text-xs border border-neutral-800">
                          <p className="font-bold text-yellow-300 text-sm mb-1">{data.periodLabel || label}</p>
                          <div className="space-y-1">
                            <p className="flex justify-between gap-4">
                              <span className="text-neutral-400">Total Omzet:</span>
                              <span className="font-bold text-white">{formatRupiah(data.omzet)}</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-neutral-400">Jumlah Pesanan:</span>
                              <span className="font-bold text-emerald-400">{data.pesanan} Order</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar yAxisId="left" dataKey="omzet" name="Omzet" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar yAxisId="right" dataKey="pesanan" name="Pesanan" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={30} />
              </BarChart>
            ) : (
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="periodLabel"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxisCurrency}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val} order`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-neutral-900 text-white p-3 rounded-xl shadow-xl text-xs border border-neutral-800">
                          <p className="font-bold text-yellow-300 text-sm mb-1">{data.periodLabel || label}</p>
                          <div className="space-y-1">
                            <p className="flex justify-between gap-4">
                              <span className="text-neutral-400">Total Omzet:</span>
                              <span className="font-bold text-white">{formatRupiah(data.omzet)}</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-neutral-400">Jumlah Pesanan:</span>
                              <span className="font-bold text-emerald-400">{data.pesanan} Order</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="omzet"
                  name="Omzet"
                  stroke="#dc2626"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#dc2626' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pesanan"
                  name="Pesanan"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#16a34a' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Status Breakdown & Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Left: Status & Metode Distribusi */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-amber-700" />
                <span>Distribusi Status Pesanan</span>
              </h4>
              {onNavigateToOrders && (
                <button
                  onClick={onNavigateToOrders}
                  className="text-xs text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Pesanan</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Donut Chart or Clean Placeholder */}
            {statusDistribution.length > 0 ? (
              <>
                <div className="h-44 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number, name: string) => [`${val} pesanan`, name]}
                        contentStyle={{ borderRadius: '12px', fontSize: '12px', backgroundColor: '#171717', color: '#fff', border: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Legend Pills */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {statusDistribution.map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-neutral-700">{item.name}</span>
                      </div>
                      <span className="font-bold text-neutral-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                <Info className="w-6 h-6 text-neutral-400 mb-1" />
                <p className="text-xs font-semibold text-neutral-700">Belum Ada Transaksi</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Distribusi status akan muncul setelah ada pesanan masuk.
                </p>
              </div>
            )}
          </div>

          {/* Delivery Method Summary */}
          <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-neutral-600">
              <Truck className="w-4 h-4 text-amber-700" />
              <span>Metode Pengiriman:</span>
            </div>
            <div className="flex items-center gap-3 font-semibold">
              <span className="text-amber-900">🚚 Kirim ({deliveryDistribution[0].value})</span>
              <span className="text-emerald-800">🏬 Ambil Toko ({deliveryDistribution[1].value})</span>
            </div>
          </div>
        </div>

        {/* Card Right: Top Selling Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-700" />
                <span>Snack Paling Diminati (Top 5)</span>
              </h4>
              <span className="text-[11px] text-neutral-500">Berdasarkan volume</span>
            </div>

            {topSellingProducts.length > 0 ? (
              <div className="space-y-2.5">
                {topSellingProducts.map((prod, index) => {
                  const maxQty = topSellingProducts[0]?.quantity || 1;
                  const pct = Math.round((prod.quantity / maxQty) * 100);

                  return (
                    <div key={index} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-neutral-800 truncate max-w-[200px]">
                          {index + 1}. {prod.name}
                        </span>
                        <div className="text-right">
                          <span className="font-black text-amber-900">{prod.quantity} bungkus</span>
                          <span className="text-[10px] text-neutral-400 block font-normal">
                            {formatRupiah(prod.revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                <Package className="w-6 h-6 text-neutral-400 mb-1" />
                <p className="text-xs font-semibold text-neutral-700">Belum Ada Penjualan Produk</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Peringkat produk terlaris akan dihitung otomatis dari transaksi belanja.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Katalog Aktif: <b>{products.filter((p) => p.isActive).length} item</b></span>
            <span>Total Stok: <b>{products.reduce((acc, p) => acc + p.stock, 0)} pcs</b></span>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Data Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-neutral-900">
              Tabel Rincian Pembukuan ({timeRange === 'daily' ? 'Harian' : timeRange === 'weekly' ? 'Mingguan' : 'Bulanan'})
            </h4>
            <p className="text-xs text-neutral-500">Rekapitulasi omzet dan kuantitas per periode</p>
          </div>
          <span className="text-xs font-semibold bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-lg">
            {monthlyData.length} Periode
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-4">{timeRange === 'daily' ? 'Tanggal' : timeRange === 'weekly' ? 'Minggu' : 'Bulan'}</th>
                <th className="py-2.5 px-4 text-right">Total Omzet</th>
                <th className="py-2.5 px-4 text-center">Jml Pesanan</th>
                <th className="py-2.5 px-4 text-center">Snack Terjual</th>
                <th className="py-2.5 px-4 text-right">Rata-rata Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {monthlyData.map((row, idx) => {
                const aov = row.pesanan > 0 ? Math.round(row.omzet / row.pesanan) : 0;
                return (
                  <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-neutral-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                      <span>{row.periodLabel || row.monthName}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-amber-950">
                      {formatRupiah(row.omzet)}
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-neutral-800">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200">
                        {row.pesanan}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center text-neutral-600 font-medium">
                      {row.itemsSold} bungkus
                    </td>
                    <td className="py-2.5 px-4 text-right text-neutral-700 font-medium">
                      {formatRupiah(aov)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Ganti Kata Sandi */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-900">Ganti Sandi Dashboard</h4>
                  <p className="text-[11px] text-neutral-500">Ubah sandi untuk akses Dashboard secara rutin</p>
                </div>
              </div>
              <button
                onClick={() => setIsChangePinOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {pinChangeError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pinChangeError}</span>
              </div>
            )}

            {pinChangeSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pinChangeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangeOwnerPin} className="space-y-3">
              {/* Old PIN */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Kata Sandi Owner Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showOldPin ? 'text' : 'password'}
                    value={oldPinInput}
                    onChange={(e) => setOldPinInput(e.target.value)}
                    placeholder="Masukkan sandi saat ini (default: 1802)"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPin(!showOldPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showOldPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New PIN */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showNewPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New PIN */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Ulangi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="Ketik ulang sandi baru"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePinOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingPin}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingPin ? 'Menyimpan...' : 'Simpan Sandi Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Konfirmasi Reset/Nol-kan Semua Transaksi */}
      {isResetOrdersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-neutral-900">
                  Nol-kan Semua Transaksi &amp; Pesanan?
                </h4>
                <p className="text-xs text-neutral-500">
                  Memulai dari awal pembukuan toko untuk grafik
                </p>
              </div>
            </div>

            {resetSuccessMessage ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{resetSuccessMessage}</span>
              </div>
            ) : (
              <>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs text-neutral-600 space-y-1.5 leading-relaxed">
                  <p>
                    Tindakan ini akan <b>menghapus seluruh riwayat pesanan &amp; transaksi</b> dari database Toko Bu Maryani.
                  </p>
                  <ul className="list-disc list-inside text-neutral-500 text-[11px] space-y-0.5">
                    <li>Total omzet akan diatur menjadi <b>Rp 0</b>.</li>
                    <li>Jumlah transaksi menjadi <b>0 pesanan</b>.</li>
                    <li>Grafik bulanan akan dimulai bersih dari <b>Rp 0</b>.</li>
                    <li>Katalog produk &amp; data stok tetap tersimpan aman.</li>
                  </ul>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsResetOrdersModalOpen(false)}
                    disabled={isClearingOrders}
                    className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteClearOrders}
                    disabled={isClearingOrders}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isClearingOrders ? 'Mengosongkan...' : 'Ya, Nol-kan Semua Transaksi'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
