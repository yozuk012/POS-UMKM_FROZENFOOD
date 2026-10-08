// src/app/report/page.js
"use client";

import React, { useState, useMemo } from "react";
import PageLayout from "@/components/PageLayout";
import ReportFilters from "./components/ReportFilters";
import ReportSummaryCards from "./components/ReportSummaryCards";
import ReportTable from "./components/ReportTable";
import useReport from "@/hooks/useReport";

export default function ReportPage() {
  // State untuk Filter
  const [filterChannel, setFilterChannel] = useState("all"); // 'all', 'online', 'offline'
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  // Mengambil data dari hook
  const { reports, operationalExpenses, loading } = useReport();

  // Logika Filtering Data berdasarkan Channel dan Tanggal
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // 1. Filter Channel
      const channelMatch = 
        filterChannel === "all" || 
        report.channel.toLowerCase() === filterChannel.toLowerCase();

      // 2. Filter Tanggal
      let dateMatch = true;
      if (dateRange.start || dateRange.end) {
        const reportDate = new Date(report.dateTime);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;

        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        if (startDate && reportDate < startDate) dateMatch = false;
        if (endDate && reportDate > endDate) dateMatch = false;
      }

      return channelMatch && dateMatch;
    });
  }, [reports, filterChannel, dateRange]);

  // Kalkulasi ulang Summary berdasarkan data yang sudah difilter
  const filteredSummary = useMemo(() => {
    const totalSales = filteredReports.reduce((sum, r) => sum + r.totalSales, 0);
    const totalHpp = filteredReports.reduce((sum, r) => sum + r.totalHpp, 0);
    const totalOps = operationalExpenses
      .filter((expense) => {
        if (!dateRange.start && !dateRange.end) return true;

        const expenseDate = new Date(`${expense.expense_date}T00:00:00`);
        const startDate = dateRange.start ? new Date(`${dateRange.start}T00:00:00`) : null;
        const endDate = dateRange.end ? new Date(`${dateRange.end}T23:59:59.999`) : null;

        return (!startDate || expenseDate >= startDate) && (!endDate || expenseDate <= endDate);
      })
      .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const totalProducts = filteredReports.reduce((sum, r) => sum + r.totalProducts, 0);

    return {
      totalSales,
      totalHpp,
      totalOps,
      grossProfit: totalSales - totalHpp,
      netProfit: totalSales - totalHpp - totalOps,
      totalTransactions: filteredReports.length,
      totalProducts,
    };
  }, [filteredReports, operationalExpenses, dateRange]);

  return (
    <PageLayout title="Laporan">
      {/* 
        Wrapper dengan overflow-x-hidden untuk mencegah horizontal scroll
        dan max-w-full untuk memastikan tidak melebihi lebar container
      */}
      <div className="flex flex-col w-full max-w-full overflow-x-hidden">
        
        {/* 1. Filters */}
        <ReportFilters 
          filterChannel={filterChannel} 
          setFilterChannel={setFilterChannel} 
          dateRange={dateRange} 
          setDateRange={setDateRange} 
        />

        {/* 2. Summary Cards */}
        <ReportSummaryCards summary={filteredSummary} />

        {/* 3. Table & Download Button */}
        <ReportTable reports={filteredReports} loading={loading} />
        
      </div>
    </PageLayout>
  );
}