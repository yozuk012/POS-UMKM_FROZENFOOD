// src/app/transection/components/TransactionFilters.jsx
import { FiSearch, FiTag, FiChevronDown } from 'react-icons/fi';
import { MdStore, MdPublic } from 'react-icons/md';

export default function TransactionFilters({ 
  search, 
  setSearch, 
  channel, 
  setChannel, 
  categories = [], // Daftar kategori dari database
  categoryId, 
  setCategoryId,
  pagination, 
  setPage 
}) {
  // Helper untuk generate nomor halaman
  const getPageNumbers = () => {
    const { currentPage, totalPages } = pagination;
    const pages = [];
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (endPage - startPage < 4) {
      if (startPage === 1) endPage = Math.min(totalPages, startPage + 4);
      else startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="bg-white p-4 shadow-sm border-b border-gray-200">
      {/* Baris 1: Search & Kategori */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk atau SKU..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors outline-none"
          />
        </div>

        {/* Dropdown Kategori */}
        <div className="relative sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiTag className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1); // Reset ke halaman 1 saat ganti kategori
            }}
            className="block w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors outline-none appearance-none cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {/* Custom Arrow Icon for Select */}
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <FiChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Baris 2: Channel Toggle Buttons */}
      <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
        <button
          onClick={() => {
            setChannel('offline');
            setPage(1);
          }}
          className={`flex-1 px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
            channel === 'offline'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <MdStore className="w-4 h-4" /> Offline
        </button>
        <button
          onClick={() => {
            setChannel('online');
            setPage(1);
          }}
          className={`flex-1 px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
            channel === 'online'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <MdPublic className="w-4 h-4" /> Online
        </button>
      </div>

      {/* Baris 3: Pagination & Info Data */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-gray-100">
        {/* Info Data */}
        <div className="text-sm text-gray-600 text-center sm:text-left">
          Menampilkan <span className="font-semibold text-gray-800">
            {pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * 10 + 1}
          </span> - <span className="font-semibold text-gray-800">
            {Math.min(pagination.currentPage * 10, pagination.totalItems)}
          </span> dari <span className="font-semibold text-gray-800">{pagination.totalItems}</span> produk
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          
          {getPageNumbers().map((num) => (
            <button
              key={num}
              onClick={() => setPage(num)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                pagination.currentPage === num
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setPage(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}