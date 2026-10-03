// src/app/history/page.js
"use client";

import React from "react";
import PageLayout from "@/components/PageLayout";
import HistoryFilters from "./components/HistoryFilters";
import HistoryList from "./components/HistoryList";
import useHistory from "@/hooks/useHistory";

export default function HistoryPage() {
  // Ambil semua state & data dari hook
  const {
    paginatedData,
    periods,
    activePeriodIndex,
    setActivePeriodIndex,
    filterChannel,
    setFilterChannel,
    loading,
    error,
  } = useHistory();

  return (
    <PageLayout title="Riwayat Transaksi">
      <div className="flex flex-col w-full max-w-full overflow-x-hidden">
        
        {/* Banner Error (jika gagal memuat data) */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* 1. Filter Channel & Navigasi Periode 3 Bulanan */}
        <HistoryFilters
          filterChannel={filterChannel}
          setFilterChannel={setFilterChannel}
          periods={periods}
          activePeriodIndex={activePeriodIndex}
          setActivePeriodIndex={setActivePeriodIndex}
        />

        {/* 2. List Transaksi yang Dikelompokkan per Bulan */}
        <HistoryList 
          paginatedData={paginatedData} 
          loading={loading} 
        />
        
      </div>
    </PageLayout>
  );
}