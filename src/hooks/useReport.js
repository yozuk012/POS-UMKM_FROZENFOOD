// src/hooks/useReport.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function useReport() {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalHpp: 0,
    totalOps: 0,
    grossProfit: 0,
    netProfit: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Mengambil data sales beserta detail sale_items-nya
      const { data, error: fetchError } = await supabase
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
        .order('sale_date', { ascending: false });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('Raw data from Supabase:', data);

      // Transformasi data sesuai kebutuhan UI
      const transformedData = (data || []).map((sale) => {
        // 1. Logika Nama Customer
        const customerName = sale.notes && sale.notes.trim() !== '' 
          ? sale.notes 
          : 'Pelanggan Umum';

        // 2. Logika Status Pembayaran
        let statusText = sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1);
        if (sale.payment_method === 'qris') {
          const qrisStatusMap = {
            success: 'Selesai',
            failed: 'Gagal',
            pending: 'Pending'
          };
          statusText += ` (${qrisStatusMap[sale.qris_status] || 'Pending'})`;
        } else {
          statusText += ' (Selesai)';
        }

        // 3. Kalkulasi Item & Total Penjualan
        const saleItems = sale.sale_items || [];
        const totalProducts = saleItems.reduce((sum, item) => {
          const qty = parseFloat(item.qty) || 0;
          return sum + qty;
        }, 0);
        
        const totalSales = parseFloat(sale.grand_total) || 0;
        
        // 4. PERBAIKAN: Kalkulasi HPP Transaksi secara AKURAT
        // Debug log untuk melihat data
        console.log(`Sale ID ${sale.id} items:`, saleItems);
        
        const totalHpp = saleItems.reduce((sum, item) => {
          const qty = parseFloat(item.qty) || 0;
          const hpp = parseFloat(item.hpp_snapshot) || 0;
          const itemHpp = qty * hpp;
          console.log(`  - Qty: ${qty}, HPP: ${hpp}, Total: ${itemHpp}`);
          return sum + itemHpp;
        }, 0);

        console.log(`Total HPP for Sale ${sale.id}:`, totalHpp);

        // Biaya operasional
        const totalOps = 0; 

        // 5. Kalkulasi Laba
        const grossProfit = totalSales - totalHpp;
        const netProfit = grossProfit - totalOps;

        return {
          orderId: sale.id,
          customerName,
          dateTime: sale.sale_date,
          status: statusText,
          channel: sale.channel === 'offline' ? 'Offline' : 'Online',
          totalProducts,
          totalSales,
          totalHpp,
          totalOps,
          grossProfit,
          netProfit,
        };
      });

      console.log('Transformed reports:', transformedData);
      setReports(transformedData);

      // Kalkulasi Summary Keseluruhan
      const totalSalesSum = transformedData.reduce((sum, r) => sum + (r.totalSales || 0), 0);
      const totalHppSum = transformedData.reduce((sum, r) => sum + (r.totalHpp || 0), 0);
      const totalOpsSum = transformedData.reduce((sum, r) => sum + (r.totalOps || 0), 0);

      console.log('Summary:', {
        totalSales: totalSalesSum,
        totalHpp: totalHppSum,
        grossProfit: totalSalesSum - totalHppSum,
      });

      setSummary({
        totalSales: totalSalesSum,
        totalHpp: totalHppSum,
        totalOps: totalOpsSum,
        grossProfit: totalSalesSum - totalHppSum,
        netProfit: totalSalesSum - totalHppSum - totalOpsSum,
        totalTransactions: transformedData.length,
      });

    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    summary,
    loading,
    error,
    refetch: fetchReports,
  };
}