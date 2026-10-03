'use client';

import { useState } from 'react';
import { 
  FiArrowLeft, 
  FiUser, 
  FiPlus, 
  FiX
} from 'react-icons/fi';
import { MdStore } from 'react-icons/md';
import { useRouter } from 'next/navigation';

export default function SwitchAccountPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      name: 'Frozen Food',
      avatar: null,
      isActive: true,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk Add Account Modal
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [addAccountLoading, setAddAccountLoading] = useState(false);
  const [addAccountError, setAddAccountError] = useState('');

  const handleSwitchAccount = (accountId) => {
    setIsLoading(true);
    
    // Update active account
    setAccounts(prev => prev.map(acc => ({
      ...acc,
      isActive: acc.id === accountId
    })));

    // TODO: Add your API call here to switch account
    console.log('Switching to account:', accountId);

    setTimeout(() => {
      setIsLoading(false);
      // Redirect to dashboard or refresh
      router.push('/dashboard');
    }, 500);
  };

  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();
    setAddAccountError('');
    setAddAccountLoading(true);

    // Validation
    if (!storeName.trim()) {
      setAddAccountError('Nama toko harus diisi.');
      setAddAccountLoading(false);
      return;
    }

    if (storeName.trim().length < 3) {
      setAddAccountError('Nama toko minimal 3 karakter.');
      setAddAccountLoading(false);
      return;
    }

    try {
      // TODO: Add your API call here to add new account
      console.log('Adding new account:', storeName);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add new account to list
      const newAccount = {
        id: accounts.length + 1,
        name: storeName.trim(),
        avatar: null,
        isActive: false,
      };

      setAccounts(prev => [...prev, newAccount]);
      
      // Close modal and reset form
      setShowAddAccountModal(false);
      setStoreName('');
      
      // Show success message
      alert('Account berhasil ditambahkan!');
      
    } catch (err) {
      console.error('Error adding account:', err);
      setAddAccountError('Gagal menambahkan account. Silakan coba lagi.');
    } finally {
      setAddAccountLoading(false);
    }
  };

  const closeAddAccountModal = () => {
    setShowAddAccountModal(false);
    setAddAccountError('');
    setStoreName('');
  };

  const handleAddAccount = () => {
    setShowAddAccountModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300">
      {/* Header */}
      <header className="px-4 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white">SETTING</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center py-4">
          {/* Avatar */}
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-3 border-4 border-white/30">
            <FiUser className="w-10 h-10 text-gray-500" />
          </div>
          
          {/* Business Name */}
          <h2 className="text-lg font-bold text-white">
            ABERCIO FROZEN FOOD
          </h2>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-6">
        {/* Account Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h3 className="text-white text-sm font-medium mb-3">Account</h3>
          
          {/* Accounts List */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleSwitchAccount(account.id)}
                className={`w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  account.isActive ? 'bg-blue-50' : ''
                }`}
              >
                {/* Account Avatar */}
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                  {account.avatar ? (
                    <img 
                      src={account.avatar} 
                      alt={account.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {account.name.charAt(0)}
                    </span>
                  )}
                </div>
                
                {/* Account Name */}
                <span className="font-medium text-gray-800 flex-1 text-left">
                  {account.name}
                </span>

                {/* Active Indicator */}
                {account.isActive && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </button>
            ))}

            {/* Add Account Button */}
            <button
              onClick={handleAddAccount}
              className="w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <FiPlus className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-800">
                Add Account
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-4 flex items-center justify-between">
              <button
                onClick={closeAddAccountModal}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <FiArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold text-white text-center flex-1">
                ADD ACCOUNT
              </h2>
              <button
                onClick={closeAddAccountModal}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-4 py-8">
              <form onSubmit={handleAddAccountSubmit} className="space-y-6">
                {/* Store Name Input */}
                <div>
                  <label className="block text-white text-sm font-bold mb-2 tracking-wide">
                    NAMA TOKO
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <MdStore className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => {
                        setStoreName(e.target.value);
                        setAddAccountError('');
                      }}
                      placeholder="Masukkan nama toko"
                      className="w-full pl-12 pr-4 py-4 rounded-full border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      required
                    />
                  </div>
                </div>

                {/* Error Message */}
                {addAccountError && (
                  <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                    {addAccountError}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={addAccountLoading}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addAccountLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Memproses...
                      </span>
                    ) : (
                      'TAMBAHKAN'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}