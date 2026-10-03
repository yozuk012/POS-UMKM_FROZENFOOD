// src/hooks/useHistory.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export default function useHistory() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State Filter
  const [filterChannel, setFilterChannel] = useState("all"); // all, online, offline
  const [activePeriodIndex, setActivePeriodIndex] = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Ambil semua transaksi (limit 1000 untuk performa)
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
            qty,
            products ( name )
          )
        `)
        .order('sale_date', { ascending: false })
        .limit(1000);

      if (fetchError) throw fetchError;

      // Transformasi data dasar
      const transformed = (data || []).map((sale) => {
        const saleDate = new Date(sale.sale_date);
        const customerName = sale.notes && sale.notes.trim() !== '' 
          ? sale.notes 
          : 'Pelanggan Umum';

        let statusText = sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1);
        if (sale.payment_method === 'qris') {
          const qrisStatusMap = { success: 'Selesai', failed: 'Gagal', pending: 'Pending' };
          statusText += ` (${qrisStatusMap[sale.qris_status] || 'Pending'})`;
        } else {
          statusText += ' (Selesai)';
        }

        return {
          orderId: sale.id,
          dateTime: sale.sale_date,
          date: saleDate.toLocaleDateString("id-ID", { day: '2-digit', month: '2-digit', year: 'numeric' }),
          time: saleDate.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }),
          customerName,
          items: (sale.sale_items || []).map((item) => ({
            name: item.products?.name || 'Produk tidak ditemukan',
            qty: item.qty,
          })),
          totalAmount: parseFloat(sale.grand_total) || 0,
          status: statusText,
          channel: sale.channel === 'offline' ? 'offline' : 'online',
          month: saleDate.getMonth(),    // 0-11
          year: saleDate.getFullYear(),
        };
      });

      setRawData(transformed);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Gagal memuat riwayat');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 1. Filter berdasarkan channel
  const filteredData = useMemo(() => {
    if (filterChannel === "all") return rawData;
    return rawData.filter(item => item.channel === filterChannel);
  }, [rawData, filterChannel]);

  // 2. Generate Periode 3 Bulanan (dari sekarang ke belakang)
  const periods = useMemo(() => {
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                        "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const result = [];
    let tempMonth = currentMonth;
    let tempYear = currentYear;
    
    // Buat periode 3 bulan ke belakang (misal 8 periode = 2 tahun)
    for (let i = 0; i < 8; i++) {
      const endMonthIdx = tempMonth;
      const startMonthIdx = (tempMonth - 2 + 12) % 12;
      const startYear = tempMonth >= 2 ? tempYear : tempYear - 1;
      
      result.push({
        label: `${monthNames[startMonthIdx]} - ${monthNames[endMonthIdx]} ${tempYear}`,
        months: [
          { month: startMonthIdx, year: startYear },
          { month: (startMonthIdx + 1) % 12, year: startMonthIdx + 1 > 11 ? startYear + 1 : startYear },
          { month: endMonthIdx, year: tempYear },
        ]
      });
      
      // Mundur 3 bulan
      tempMonth -= 3;
      if (tempMonth < 0) {
        tempMonth += 12;
        tempYear -= 1;
      }
    }
    
    return result;
  }, []);

  // 3. Data yang dipaginate per 3 bulan
  const paginatedData = useMemo(() => {
    const activePeriod = periods[activePeriodIndex];
    if (!activePeriod) return {};

    // Filter data yang masuk dalam periode aktif
    const inPeriod = filteredData.filter(item => {
      return activePeriod.months.some(
        p => p.month === item.month && p.year === item.year
      );
    });

    // Grouping berdasarkan Bulan
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                        "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const grouped = {};
    activePeriod.months.forEach(p => {
      grouped[`${monthNames[p.month]} ${p.year}`] = [];
    });

    inPeriod.forEach(item => {
      const key = `${monthNames[item.month]} ${item.year}`;
      if (grouped[key]) {
        grouped[key].push(item);
      }
    });

    return grouped;
  }, [filteredData, activePeriodIndex, periods]);

  return {
    rawData,
    filteredData,
    paginatedData,
    periods,
    activePeriodIndex,
    setActivePeriodIndex,
    filterChannel,
    setFilterChannel,
    loading,
    error,
    refetch: fetchHistory,
  };
}