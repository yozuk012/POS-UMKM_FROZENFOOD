"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AiFillHome } from "react-icons/ai";
import { FaShoppingCart, FaCashRegister } from "react-icons/fa";
import { TbReportAnalytics } from "react-icons/tb";
import { FaCalculator } from "react-icons/fa6";
import { MdHistory } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { FiLogOut, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { BiCategory } from "react-icons/bi";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { name: "Beranda", href: "/", icon: AiFillHome },
  { name: "Produk", href: "/product", icon: FaShoppingCart },
  { name: "Kategori", href: "/category", icon: BiCategory },
  { name: "Transaksi", href: "/transection", icon: FaCashRegister },
  { name: "Laporan", href: "/report", icon: TbReportAnalytics },
  {name: "Bahan Baku", href: "/bahan-baku", icon: FaShoppingCart},
  {name: "Pengeluaran", href: "/pengeluaran", icon: FaCashRegister},
  { 
    name: "HPP", 
    icon: FaCalculator,
    children: [
      {name: "Hitung Hpp", href:"/hpp/hitung-hpp"},
      { name: "HPP Produk", href: "/hpp/hppproduk" }, // Sesuaikan dengan route folder Anda
    ]
  },
  { name: "Histori", href: "/history", icon: MdHistory },
  { name: "Pengaturan", href: "/settings/profile", icon: IoMdSettings },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { user, merchant, logout, loading } = useAuth();
  
  // State untuk mengontrol dropdown HPP
  const [isHppOpen, setIsHppOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  // Fungsi helper untuk mengecek apakah menu utama atau anaknya sedang aktif
  const isMenuActive = (item) => {
    if (item.href && (pathname === item.href || pathname.startsWith(item.href + "/"))) {
      return true;
    }
    if (item.children) {
      return item.children.some(child => pathname === child.href || pathname.startsWith(child.href + "/"));
    }
    return false;
  };

  return (
    <>
      {/* Overlay Gelap untuk Mobile */}
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
            const isActive = isMenuActive(item);
            const Icon = item.icon;
            
            // Jika item memiliki children (Dropdown)
            if (item.children) {
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => setIsHppOpen(!isHppOpen)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`text-xl ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                      <span>{item.name}</span>
                    </div>
                    {isHppOpen ? (
                      <FiChevronUp className="text-gray-400 shrink-0" />
                    ) : (
                      <FiChevronDown className="text-gray-400 shrink-0" />
                    )}
                  </button>

                  {/* Children Items (Dropdown Content) */}
                  {isHppOpen && (
                    <div className="space-y-1 pl-4 border-l-2 border-gray-100 ml-4">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href || pathname.startsWith(child.href + "/");
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => setIsOpen(false)} // Tutup sidebar di mobile saat link diklik
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isChildActive
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                          >
                            {/* Indikator bullet kecil untuk child menu */}
                            <span className={`w-1.5 h-1.5 rounded-full ${isChildActive ? "bg-blue-600" : "bg-gray-400"}`}></span>
                            <span>{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Item biasa (tanpa children)
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