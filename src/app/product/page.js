"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import useProducts from "@/hooks/useProducts";
import CopyDataModal from "@/components/CopyDataModal";

// Import semua komponen yang sudah dipecah
import ProductHeader from "./components/ProductHeader";
import ProductFilters from "./components/ProductFilters";
import ProductList from "./components/ProductList";
import ProductPagination from "./components/ProductPagination";
import ProductFormModal from "./components/ProductFormModal";

export default function ProductsPage() {
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  // Semua state dan handler tetap di-handle oleh custom hook
  const {
    stores, categories, products, loading,
    formData, editingId, error, isSubmitting, isModalOpen,
    handleChange, handleFileChange, handleSubmit, deleteProduct, toggleProductStatus,
    openAddModal, openEditModal, closeModal,
    searchQuery, setSearchQuery,
    filterCategory, setFilterCategory,
    filterChannel, setFilterChannel,
    filterStatus, setFilterStatus,
    currentPage, setCurrentPage,
    totalItems, itemsPerPage,
    refetch, fetchCategories
  } = useProducts();

  return (
    <PageLayout title="Manajemen Produk">
      {/* 1. Header Halaman */}
      <ProductHeader
        openAddModal={openAddModal}
        onOpenCopyModal={() => setIsCopyModalOpen(true)}
      />

      {/* 2. Filter & Search */}
      <ProductFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterChannel={filterChannel}
        setFilterChannel={setFilterChannel}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        categories={categories}
      />

      {/* 3. Daftar Produk (Mobile & Desktop) */}
      <ProductList
        loading={loading}
        products={products}
        searchQuery={searchQuery}
        filterCategory={filterCategory}
        filterChannel={filterChannel}
        filterStatus={filterStatus}
        openEditModal={openEditModal}
        toggleProductStatus={toggleProductStatus}
        deleteProduct={deleteProduct}
        onOpenCopyModal={() => setIsCopyModalOpen(true)}
        openAddModal={openAddModal}
      />

      {/* 4. Pagination */}
      <ProductPagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        loading={loading}
        displayedCount={products.length}
      />

      {/* 5. Modal Form (Tambah/Edit) */}
      <ProductFormModal
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        editingId={editingId}
        handleSubmit={handleSubmit}
        error={error}
        isSubmitting={isSubmitting}
        formData={formData}
        handleChange={handleChange}
        handleFileChange={handleFileChange}
        stores={stores}
        categories={categories}
      />

      {/* 6. Modal Salin Produk */}
      <CopyDataModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        type="products"
        title="Produk"
        onCopySuccess={() => {
          refetch();
          if (fetchCategories) fetchCategories();
        }}
      />
    </PageLayout>
  );
}