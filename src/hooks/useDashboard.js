import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase'; // Sesuaikan dengan path supabase client kamu

export function useDashboard(storeId, userId, dateRange) {
  const [metrics, setMetrics] = useState({
    totalPenjualan: 0,
    totalPengeluaran: 0,
    labaKotor: 0,
    labaBersih: 0,
  });
  const [monthlyPerformance, setMonthlyPerformance] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!userId && !/^\d+$/.test(String(storeId || ''))) return;
    setIsLoading(true);
    setError(null);

    try {
      let resolvedStoreId = storeId;

      // Store IDs are bigint. Ignore stale UUID values and resolve the user's store instead.
      if (!/^\d+$/.test(String(resolvedStoreId || ''))) {
        const { data: stores, error: storesError } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('id', { ascending: true });

        if (storesError) throw storesError;
        resolvedStoreId = stores?.[0]?.id;
      }

      if (!resolvedStoreId) return;
      const today = new Date();
      const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
        .toLocaleDateString('sv-SE');
      const defaultEnd = today.toLocaleDateString('sv-SE');
      const startDate = dateRange?.start || defaultStart;
      const endDate = dateRange?.end || defaultEnd;

      if (startDate > endDate) {
        throw new Error('Tanggal mulai harus sama atau sebelum tanggal selesai.');
      }

      const startOfPeriod = `${startDate}T00:00:00.000`;
      const endOfPeriod = `${endDate}T23:59:59.999`;

      // ==========================================
      // 1. AMBIL DATA PENJUALAN BULAN INI (Untuk Metrik & Top Produk)
      // ==========================================
      const { data: currentSales, error: salesError } = await supabase
        .from('sales')
        .select('id, grand_total, discount, platform_fee')
        .eq('store_id', resolvedStoreId)
        .gte('sale_date', startOfPeriod)
        .lte('sale_date', endOfPeriod);

      if (salesError) throw salesError;

      const currentSalesIds = currentSales.map(s => s.id);

      // ==========================================
      // 2. AMBIL DETAIL ITEM PENJUALAN (Untuk Laba Kotor & Top Produk)
      // ==========================================
      let currentSaleItems = [];
      if (currentSalesIds.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from('sale_items')
          .select(`
            product_id,
            qty,
            unit_price,
            hpp_snapshot,
            line_total,
            products ( name, image_url )
          `)
          .in('sale_id', currentSalesIds);
        
        if (itemsError) throw itemsError;
        currentSaleItems = items || [];
      }

      // ==========================================
      // 3. AMBIL PENGELUARAN OPERASIONAL BULAN INI
      // ==========================================
      const { data: currentExpenses, error: expensesError } = await supabase
        .from('operational_expenses')
        .select('amount')
        .eq('store_id', resolvedStoreId)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

      if (expensesError) throw expensesError;

      // ==========================================
      // 4. HITUNG METRIK KEUANGAN (Laba Kotor, Bersih, dll)
      // ==========================================
      const totalPenjualan = currentSales.reduce((sum, sale) => sum + (Number(sale.grand_total) || 0), 0);
      const totalPengeluaran = currentExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      
      // Laba Kotor = Total Pendapatan dari Item - Total HPP dari Item yang terjual
      const totalRevenueFromItems = currentSaleItems.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0);
      const totalHppFromItems = currentSaleItems.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.hpp_snapshot) || 0)), 0);
      const labaKotor = totalRevenueFromItems - totalHppFromItems;
      
      const labaBersih = labaKotor - totalPengeluaran;

      setMetrics({
        totalPenjualan,
        totalPengeluaran,
        labaKotor,
        labaBersih,
      });

      // ==========================================
      // 5. HITUNG TOP PRODUK TERLARIS (Bulan Ini)
      // ==========================================
      const productSalesMap = {};
      currentSaleItems.forEach(item => {
        if (!productSalesMap[item.product_id]) {
          productSalesMap[item.product_id] = {
            name: item.products?.name || 'Produk Tidak Diketahui',
            image_url: item.products?.image_url || null,
            totalQty: 0,
            totalRevenue: 0
          };
        }
        productSalesMap[item.product_id].totalQty += Number(item.qty) || 0;
        productSalesMap[item.product_id].totalRevenue += Number(item.line_total) || 0;
      });

      const sortedTopProducts = Object.values(productSalesMap)
        .sort((a, b) => b.totalQty - a.totalQty) // Urutkan berdasarkan qty terbesar
        .slice(0, 5); // Ambil 5 teratas

      setTopProducts(sortedTopProducts);

      // ==========================================
      // 6. AMBIL 5 RIWAYAT PENJUALAN TERAKHIR (Global)
      // ==========================================
      const { data: recentSalesData, error: recentSalesError } = await supabase
        .from('sales')
        .select(`
          id,
          sale_date,
          channel,
          payment_method,
          grand_total,
          qris_status
        `)
        .eq('store_id', resolvedStoreId)
        .gte('sale_date', startOfPeriod)
        .lte('sale_date', endOfPeriod)
        .order('sale_date', { ascending: false })
        .limit(5);

      if (recentSalesError) throw recentSalesError;
      setRecentSales(recentSalesData || []);

      // ==========================================
      // 7. AMBIL DATA PERFORMA BULANAN (5 Bulan Terakhir)
      // ==========================================
      const { data: historicalSales, error: histSalesError } = await supabase
        .from('sales')
        .select('sale_date, grand_total')
        .eq('store_id', resolvedStoreId)
        .gte('sale_date', startOfPeriod)
        .lte('sale_date', endOfPeriod);

      if (histSalesError) throw histSalesError;

      const { data: historicalExpenses, error: histExpError } = await supabase
        .from('operational_expenses')
        .select('expense_date, amount')
        .eq('store_id', resolvedStoreId)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

      if (histExpError) throw histExpError;

      // Proses data menjadi format per bulan untuk Grafik (Recharts)
      const monthlyDataMap = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      // Inisialisasi setiap bulan yang masuk dalam rentang pilihan.
      const startMonth = new Date(`${startDate}T00:00:00`);
      const endMonth = new Date(`${endDate}T00:00:00`);
      for (let d = new Date(startMonth.getFullYear(), startMonth.getMonth(), 1);
        d <= endMonth;
        d.setMonth(d.getMonth() + 1)) {
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyDataMap[monthKey] = { 
          month: monthNames[d.getMonth()], 
          sales: 0, 
          expenses: 0,
          profit: 0
        };
      }

      // Akumulasi Penjualan
      historicalSales?.forEach(sale => {
        const date = new Date(sale.sale_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyDataMap[monthKey]) {
          monthlyDataMap[monthKey].sales += Number(sale.grand_total) || 0;
        }
      });

      // Akumulasi Pengeluaran
      historicalExpenses?.forEach(exp => {
        const date = new Date(exp.expense_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyDataMap[monthKey]) {
          monthlyDataMap[monthKey].expenses += Number(exp.amount) || 0;
        }
      });

      // Hitung Profit per bulan & ubah ke array
      const chartData = Object.values(monthlyDataMap).map(data => ({
        ...data,
        profit: data.sales - data.expenses
      }));

      setMonthlyPerformance(chartData);

    } catch (err) {
      setError('Gagal memuat data dashboard: ' + err.message);
      console.error('Dashboard Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storeId, userId, dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    metrics,
    monthlyPerformance,
    recentSales,
    topProducts,
    isLoading,
    error,
    refetch: fetchDashboardData
  };
}