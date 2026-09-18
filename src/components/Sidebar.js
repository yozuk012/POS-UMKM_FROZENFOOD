// src/components/Sidebar.js
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AiFillHome } from "react-icons/ai";
import { FaShoppingCart, FaCashRegister } from "react-icons/fa";
import { TbReportAnalytics } from "react-icons/tb";
import { FaCalculator } from "react-icons/fa6";
import { MdHistory } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { FiLogOut, FiX } from "react-icons/fi"; // Tambahkan FiX untuk tombol close mobile
import { BiCategory } from "react-icons/bi";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { name: "Beranda", href: "/", icon: AiFillHome },
  { name: "Produk", href: "/product", icon: FaShoppingCart },
  { name: "Kategori", href: "/category", icon: BiCategory },
  { name: "Transaksi", href: "/transection", icon: FaCashRegister },
  { name: "Laporan", href: "/report", icon: TbReportAnalytics },
  { name: "Hitung HPP", href: "/hpp", icon: FaCalculator },
  { name: "Histori", href: "/history", icon: MdHistory },
  { name: "Pengaturan", href: "/settings", icon: IoMdSettings },
];

// Terima props isOpen dan setIsOpen untuk kontrol responsive
export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { user, merchant, logout, loading } = useAuth();

  // Fungsi handle logout
  const handleLogout = async () => {
    // Panggil fungsi logout dari useAuth (ini otomatis clear token Supabase & redirect)
    await logout();
  };

  return (
    <>
      {/* Overlay Gelap untuk Mobile (klik di luar sidebar akan menutup sidebar) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50
          transition-transform duration-300 ease-in-out shadow-lg md:shadow-none
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 md:static md:inset-auto
        `}
      >
        {/* Header / Logo Brand */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              ABERCIO<span className="text-blue-600">-POS</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">Frozen Food</p>
          </div>
          {/* Tombol Close (Hanya muncul di mobile) */}
          <button 
            onClick={() => setIsOpen(false)} 
            className="md:hidden p-1 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Navigasi Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`text-xl ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Profil User & Logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          {loading ? (
            <div className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                {merchant?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {merchant?.full_name || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {merchant?.store_name || "Toko"}
                </p>
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <FiLogOut className="text-xl" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}