// src/app/history/components/HistoryFilters.jsx
"use client";

import React from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

export default function HistoryFilters({ 
  filterChannel, 
  setFilterChannel,
  periods,
  activePeriodIndex,
  setActivePeriodIndex
}) {
  
  const handleChannelChange = (channel) => {
    setFilterChannel(filterChannel === channel ? "all" : channel);
  };

  const handlePrevPeriod = () => {
    if (activePeriodIndex < periods.length - 1) {
      setActivePeriodIndex(activePeriodIndex + 1);
    }
  };

  const handleNextPeriod = () => {
    if (activePeriodIndex > 0) {
      setActivePeriodIndex(activePeriodIndex - 1);
    }
  };

  const currentPeriod = periods[activePeriodIndex];

  return (
    <div className="bg-white border-b border-gray-200">
      
      {/* Toggle Channel */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 mr-1 whitespace-nowrap">Filter:</span>
          <button
            onClick={() => handleChannelChange("online")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filterChannel === "online" 
                ? "bg-blue-800 text-white shadow-sm" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ONLINE
          </button>
          <button
            onClick={() => handleChannelChange("offline")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filterChannel === "offline" 
                ? "bg-blue-800 text-white shadow-sm" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            OFFLINE
          </button>
          {filterChannel !== "all" && (
            <button
              onClick={() => setFilterChannel("all")}
              className="text-xs text-red-600 hover:text-red-800 ml-1"
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* Navigasi Periode 3 Bulanan */}
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={handlePrevPeriod}
          disabled={activePeriodIndex >= periods.length - 1}
          className={`p-2 rounded-full transition-colors ${
            activePeriodIndex >= periods.length - 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          aria-label="Periode sebelumnya"
        >
          <HiChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Periode</span>
          <span className="text-sm font-bold text-gray-800">
            {currentPeriod?.label || "Loading..."}
          </span>
        </div>

        <button
          onClick={handleNextPeriod}
          disabled={activePeriodIndex === 0}
          className={`p-2 rounded-full transition-colors ${
            activePeriodIndex === 0
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          aria-label="Periode selanjutnya"
        >
          <HiChevronRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}