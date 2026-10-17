'use client';

import { useState, useEffect } from 'react';
import { FiLoader } from 'react-icons/fi';
import {
  MdChevronLeft,
  MdExpandLess,
  MdExpandMore,
  MdFileDownload,
  MdInventory2,
  MdLockOutline,
  MdOutlineEdit,
  MdPercent,
  MdPerson,
  MdSettings,
  MdStorefront,
  MdSync,
} from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useActiveStore } from '@/lib/activeStore';
import PageLayout from '../../../components/PageLayout'; // Path sesuai kode teman Anda

export default function ProfilePage() {
  const router = useRouter();
  const { storeId } = useActiveStore();
  
  // 1. STATE UNTUK DATA REAL (Menggantikan hardcoded)
  const [businessName, setBusinessName] = useState('Memuat...');
  const [userName, setUserName] = useState('Memuat...');
  const [logoUrl, setLogoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State dropdown menu pengaturan (default tertutup, seperti dropdown lain di aplikasi)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 2. FETCH DATA PROFIL DAN TOKO AKTIF
  useEffect(() => {
    async function fetchProfile() {
      try {
        // Ambil user yang sedang login
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const [{ data: merchant, error: merchantError }, { data: store, error: storeError }] = await Promise.all([
          supabase
            .from('merchants')
            .select('full_name, store_name, store_logo_url')
            .eq('id', user.id)
            .single(),
          storeId
            ? supabase
                .from('stores')
                .select('name, logo_url')
                .eq('id', storeId)
                .eq('user_id', user.id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (merchantError) throw merchantError;
        if (storeError) throw storeError;

        if (merchant) {
          setUserName(merchant.full_name || 'Pengguna');
          setBusinessName(store?.name || merchant.store_name || 'Nama Toko');
          setLogoUrl(store?.logo_url || merchant.store_logo_url || null);
        }
      } catch (err) {
        console.error('Gagal memuat profil:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [router, storeId]);

  // Menu utama di dalam dropdown "Setting"
  const menuItems = [
    { label: 'Edit Profile', icon: MdOutlineEdit, href: '/settings/profile/edit-profile' },
    { label: 'Change Password', icon: MdLockOutline, href: '/settings/profile/change-password' },
    { label: 'Persentase Online', icon: MdPercent, href: '/settings/profile/persentase-online' },
    { label: 'Switch Store', icon: MdSync, href: '/settings/profile/stores' },
    { label: 'Export Data', icon: MdFileDownload, href: '/settings/profile/export-data' },
  ];

  // Sub-menu "More" - item Logout sengaja dihapus dari halaman ini
  const moreItems = [
    { label: 'Seed Data Produk', icon: MdInventory2, href: '/settings/profile/seed-data' },
  ];

  const handleMenuClick = (href) => {
    router.push(href);
  };

  // Catatan: tombol Logout sudah dihapus dari halaman Setting.
  // Logout tetap tersedia lewat tombol di footer Sidebar.

  // Tampilkan loading spinner jika data belum siap (opsional, tapi menjaga UX tetap baik)
  if (isLoading) {
    return (
      <PageLayout title="Setting">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <FiLoader className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-gray-600">Memuat profil...</p>
        </div>
      </PageLayout>
    );
  }

  // ==========================================
  // RENDER UI (100% SAMA DENGAN KODE TEMAN ANDA)
  // ==========================================
  return (
    <PageLayout title="Setting">
      <div className="relative">
        {/* Profile Header Section */}
        {/* Negative margin digunakan agar header menempel di tepi, mengimbangi padding dari PageLayout */}
        <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6">
          <header className="bg-gradient-to-b from-blue-600 to-blue-500 text-white px-4 py-6 md:px-6 md:py-8 rounded-b-2xl shadow-sm">
            <div className="flex flex-col items-center py-4">
              {/* Avatar (Ditambahkan kondisi untuk menampilkan logo jika ada, tanpa merusak layout) */}
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4 border-4 border-white/30 shadow-md overflow-hidden">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Logo Toko" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MdPerson className="w-12 h-12 text-gray-500" />
                )}
              </div>
              
              {/* Business Name & User (Sekarang menggunakan data real dari database) */}
              <h2 className="text-xl font-bold text-white text-center">
                {businessName}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {userName}
              </p>
            </div>
          </header>
        </div>

        {/* Dropdown Menu Setting */}
        <div className="py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tombol pembuka dropdown */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-expanded={isMenuOpen}
              aria-controls="settings-dropdown"
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <MdSettings className="w-5 h-5" />
                </span>
                <span className="text-left">
                  <span className="block font-semibold text-gray-800">Setting</span>
                  <span className="block text-xs text-gray-500">
                    {isMenuOpen
                      ? `${menuItems.length + moreItems.length} menu pengaturan`
                      : 'Ketuk untuk melihat menu pengaturan'}
                  </span>
                </span>
              </div>
              {isMenuOpen ? (
                <MdExpandLess className="w-5 h-5 text-gray-400 shrink-0" />
              ) : (
                <MdExpandMore className="w-5 h-5 text-gray-400 shrink-0" />
              )}
            </button>

            {/* Isi dropdown */}
            {isMenuOpen && (
              <div
                id="settings-dropdown"
                className="border-t border-gray-100 divide-y divide-gray-100 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                {menuItems.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleMenuClick(item.href)}
                    className="w-full px-4 py-4 flex items-center justify-between text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">{item.label}</span>
                    </span>
                    <MdChevronLeft className="w-4 h-4 text-gray-400" />
                  </button>
                ))}

                {/* Sub-menu More (tanpa Logout) */}
                <div className="bg-gray-50/60">
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <MdStorefront className="w-4 h-4 text-gray-400" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      More
                    </p>
                  </div>
                  {moreItems.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleMenuClick(item.href)}
                      className="w-full px-4 py-4 flex items-center justify-between text-gray-700 hover:bg-white transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">{item.label}</span>
                      </span>
                      <MdChevronLeft className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Spacer */}
        <div className="h-20" />
      </div>
    </PageLayout>
  );
}
