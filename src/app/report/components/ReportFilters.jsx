"use client";

import React from "react";

export default function ReportFilters({ 
  filterChannel, 
  setFilterChannel, 
  dateRange, 
  setDateRange 
}) {
  
  return (
    <div className="px-4 sm:px-6 py-4 bg-white border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
      
      {/* Toggle Channel: Semua, Online & Offline */}
      <div className="flex items-center gap-2 w-full md:w-auto pb-1 md:pb-0 overflow-x-auto">
        <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">Tipe Laporan:</span>
        
        <button
          onClick={() => setFilterChannel("all")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap flex-1 md:flex-none ${
            filterChannel === "all" 
              ? "bg-blue-800 text-white shadow-md shadow-blue-800/20" 
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          }`}
        >
          SEMUA
        </button>

        <button
          onClick={() => setFilterChannel("online")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap flex-1 md:flex-none ${
            filterChannel === "online" 
              ? "bg-blue-800 text-white shadow-md shadow-blue-800/20" 
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          }`}
        >
          ONLINE
        </button>
        
        <button
          onClick={() => setFilterChannel("offline")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap flex-1 md:flex-none ${
            filterChannel === "offline" 
              ? "bg-blue-800 text-white shadow-md shadow-blue-800/20" 
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          }`}
        >
          OFFLINE
        </button>
      </div>

      {/* Filter Tanggal */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 w-full md:w-auto">
        <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">
          Periode:
        </label>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="flex-1 sm:w-36 border border-gray-200 bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
          
          <span className="text-xs text-gray-400 font-medium">s/d</span>
          
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="flex-1 sm:w-36 border border-gray-200 bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>
      </div>
      
    </div>
  );
}