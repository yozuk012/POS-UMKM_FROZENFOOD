import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { ACTIVE_STORE_EVENT, resolveActiveStore } from '@/lib/activeStore';

export default function useReport() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [operationalExpenses, setOperationalExpenses] = useState([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalHpp: 0,
    totalOps: 0,
    grossProfit: 0,       // Laba Kotor (Penjualan - HPP)
    netProfit: 0,         // Laba Bersih (Laba Kotor - Operasional)
    netProfitMargin: 0,   // Persentase Laba Bersih
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper: Mendapatkan rentang tanggal bulan ini (Format YYYY-MM-DD)
  const getCurrentMonthRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('sv-SE');
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString('sv-SE');
    return { firstDay, lastDay };
  };

  const fetchReports = useCallback(async (startDate = null, endDate = null) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        setReports([]);
        setOperationalExpenses([]);
        setSummary({
          totalSales: 0,
          totalHpp: 0,
          totalOps: 0,
          grossProfit: 0,
          netProfit: 0,
          netProfitMargin: 0,
          totalTransactions: 0,
        });
        return;
      }

      // 1. Ambil Store Aktif
      const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (storeError) throw storeError;
      const store = resolveActiveStore(stores);

      if (!store) {
        setReports([]);
        setOperationalExpenses([]);
        setSummary({
          totalSales: 0,
          totalHpp: 0,
          totalOps: 0,
          grossProfit: 0,
          netProfit: 0,
          netProfitMargin: 0,
          totalTransactions: 0,
        });
        return;
      }

      // Tentukan rentang tanggal (default: bulan ini)
      const { firstDay, lastDay } = getCurrentMonthRange();
      const queryStart = startDate || firstDay;
      const queryEnd = endDate || lastDay;

      // 2. Ambil Data Penjualan & Detail Item (Difilter berdasarkan tanggal)
      let salesQuery = supabase
        .from('sales')
        .select(`
          id,
          sale_date,
          channel,
          payment_method,
          grand_total,
          notes,
          qris_status,
          sale_items (
            id,
            qty,
            unit_price,
            hpp_snapshot,
            line_total
          )
        `)
        .eq('store_id', store.id)
        .gte('sale_date', queryStart)
        .lte('sale_date', queryEnd)
        .order('sale_date', { ascending: false });

      const { data: salesData, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // 3. Ambil Data Pengeluaran Operasional (Difilter berdasarkan tanggal)
      let expensesQuery = supabase
        .from('operational_expenses')
        .select('id, expense_date, category, description, amount')
        .eq('store_id', store.id)
        .gte('expense_date', queryStart)
        .lte('expense_date', queryEnd)
        .order('expense_date', { ascending: false });

      const { data: expenses, error: expensesError } = await expensesQuery;
      if (expensesError) throw expensesError;
      
      setOperationalExpenses(expenses || []);

      // 4. Transformasi Data Penjualan per Transaksi
      const transformedData = (salesData || []).map((sale) => {
        const customerName = sale.notes && sale.notes.trim() !== '' 
          ? sale.notes 
          : 'Pelanggan Umum';

        const paymentMethod = sale.payment_method || 'unknown';
        let statusText = paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);
        
        if (paymentMethod === 'qris') {
          const qrisStatusMap = { success: 'Selesai', failed: 'Gagal', pending: 'Pending' };
          statusText += ` (${qrisStatusMap[sale.qris_status] || 'Pending'})`;
        } else {
          statusText += ' (Selesai)';
        }

        const saleItems = sale.sale_items || [];
        const totalProducts = saleItems.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);
        const totalSales = parseFloat(sale.grand_total) || 0;
        
        // ✅ INI KUNCINYA: HPP dihitung berdasarkan snapshot saat transaksi
        const totalHpp = saleItems.reduce((sum, item) => {
          const qty = parseFloat(item.qty) || 0;
          const hpp = parseFloat(item.hpp_snapshot) || 0;
          return sum + (qty * hpp);
        }, 0);

        // Laba Kotor = Penjualan - HPP (Profit murni dari barang yang LARIS)
        const grossProfit = totalSales - totalHpp;
        const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

        return {
          orderId: sale.id,
          customerName,
          dateTime: sale.sale_date,
          status: statusText,
          channel: sale.channel === 'offline' ? 'Offline' : 'Online',
          totalProducts,
          totalSales,
          totalHpp,
          grossProfit,
          profitMargin,
        };
      });

      setReports(transformedData);

      // 5. Kalkulasi Summary Keseluruhan Periode (Bulan Ini)
      const totalSalesSum = transformedData.reduce((sum, r) => sum + (r.totalSales || 0), 0);
      const totalHppSum = transformedData.reduce((sum, r) => sum + (r.totalHpp || 0), 0);
      const grossProfitSum = totalSalesSum - totalHppSum;
      
      // Total operasional adalah total pengeluaran periode ini
      const totalOpsSum = (expenses || []).reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
      
      // Laba Bersih = Laba Kotor - Pengeluaran Operasional
      const netProfit = grossProfitSum - totalOpsSum;
      const netProfitMargin = totalSalesSum > 0 ? (netProfit / totalSalesSum) * 100 : 0;

      setSummary({
        totalSales: totalSalesSum,
        totalHpp: totalHppSum,
        totalOps: totalOpsSum,
        grossProfit: grossProfitSum,
        netProfit: netProfit,
        netProfitMargin: netProfitMargin,
        totalTransactions: transformedData.length,
      });

    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-fetch saat user login & listen switch store
  useEffect(() => {
    if (user?.id) {
      fetchReports();
    }
    const handleStoreChange = () => {
      // KETIKA SWITCH TOKO: LAPORAN KOSONG
      setReports([]);
      setOperationalExpenses([]);
      setSummary({
        totalSales: 0,
        totalHpp: 0,
        totalOps: 0,
        grossProfit: 0,
        netProfit: 0,
        netProfitMargin: 0,
        totalTransactions: 0,
      });
      fetchReports();
    };
    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, [user, fetchReports]);

  return {
    reports,
    operationalExpenses,
    summary,
    loading,
    error,
    refetch: fetchReports,
  };
}