// src/components/PageLayout.js
"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { FiMenu } from "react-icons/fi";

export default function PageLayout({ children, title = "Dashboard" }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* 1. Sidebar (Responsive) */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* 2. Area Konten Utama */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-300">
        
        {/* Header Mobile (Hanya muncul di layar kecil) */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Buka menu"
          >
            <FiMenu size={24} />
          </button>
          
          <h1 className="text-lg font-bold text-gray-800">{title}</h1>
          
          {/* Spacer agar judul tetap di tengah */}
          <div className="w-10" /> 
        </header>

        {/* Konten Halaman */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}