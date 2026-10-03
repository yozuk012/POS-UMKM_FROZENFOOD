'use client';

import { useState } from 'react';
import { 
  FiUser, 
  FiEdit, 
  FiLock, 
  FiPercent, 
  FiRefreshCw, 
  FiLogOut,
  FiShield
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import PageLayout from '../../../components/PageLayout'; // Pastikan path ini sesuai dengan struktur folder Anda

export default function ProfilePage() {
  const router = useRouter();
  const [businessName] = useState('ABERCIO FROZEN FOOD');
  const [userName] = useState('Admin');

  const menuItems = [
    {
      section: 'Account',
      icon: FiUser,
      items: [
        { label: 'Edit Profile', icon: FiEdit, href: '/settings/profile/edit-profile' },
        { label: 'Change Password', icon: FiLock, href: '/settings/profile/Change-Password' },
        { label: 'Persentase Online', icon: FiPercent, href: '/settings/profile/Persentase-Online' },
      ]
    },
    {
      section: 'More',
      icon: FiShield,
      items: [
        { label: 'Switch Account', icon: FiRefreshCw, href: '/settings/profile/switch-account' },
        { label: 'Logout', icon: FiLogOut, href: '/auth/login', isDanger: true },
      ]
    }
  ];

  const handleMenuClick = (href) => {
    router.push(href);
  };

  const handleLogout = () => {
    // TODO: Tambahkan logika logout Anda di sini (misal: hapus token dari localStorage/cookies)
    console.log('Logging out...');
    
    // Contoh: localStorage.removeItem('auth_token');
    
    // Redirect ke halaman login setelah logout
    router.push('/auth/login');
  };

  return (
    <PageLayout title="Setting">
      <div className="relative">
        {/* Profile Header Section */}
        {/* Negative margin digunakan agar header menempel di tepi, mengimbangi padding dari PageLayout */}
        <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6">
          <header className="bg-gradient-to-b from-blue-600 to-blue-500 text-white px-4 py-6 md:px-6 md:py-8 rounded-b-2xl shadow-sm">
            <div className="flex flex-col items-center py-4">
              {/* Avatar */}
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4 border-4 border-white/30 shadow-md">
                <FiUser className="w-12 h-12 text-gray-500" />
              </div>
              
              {/* Business Name & User */}
              <h2 className="text-xl font-bold text-white text-center">
                {businessName}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {userName}
              </p>
            </div>
          </header>
        </div>

        {/* Menu Sections */}
        <div className="px-0 md:px-0 py-6 space-y-6">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Section Header */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-gray-700" />
                  <h3 className="font-semibold text-gray-800">{section.section}</h3>
                </div>
              </div>

              {/* Menu Items */}
              <div className="divide-y divide-gray-100">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={() => item.isDanger ? handleLogout() : handleMenuClick(item.href)}
                    className={`w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      item.isDanger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.isDanger ? (
                        <div className="w-6 h-6 flex items-center justify-center">
                          <FiLogOut className="w-5 h-5" />
                        </div>
                      ) : (
                        <svg 
                          className="w-5 h-5 text-gray-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 5l7 7-7 7" 
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Navigation Spacer */}
        <div className="h-20" />
      </div>
    </PageLayout>
  );
}