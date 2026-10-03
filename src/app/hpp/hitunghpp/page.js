// src/app/hpp/hitunghpp/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import useHitungHpp from '@/hooks/useHitungHpp';

// Import Komponen UI yang sudah kita buat
import StepIndicator from './components/StepIndicator';
import Step1BahanBaku from './components/Step1BahanBaku';
import Step2Operasional from './components/Step2Operasional';
import Step3Hasil from './components/Step3Hasil';

export default function HitungHPPPage() {
  const router = useRouter();
  
  // 1. Panggil Hook untuk Logic & Database
  const { 
    rawMaterials, 
    categories, 
    isLoading, 
    isSubmitting, 
    error, 
    submitHPP 
  } = useHitungHpp();

  // 2. State Global untuk Form
  const [currentStep, setCurrentStep] = useState(1);
  const [namaProduk, setNamaProduk] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [jumlahProduk, setJumlahProduk] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNamaProduk(params.get('namaProduk') || '');
  }, []);
  
  const [bahanBakuList, setBahanBakuList] = useState([
    { id: Date.now(), raw_material_id: '', namaBahan: '', satuan: '', qty_needed: 1, hargaBeli: '' }
  ]);

  const [biayaOperasional, setBiayaOperasional] = useState({
    tenagaKerja: '',
    overhead: '',
  });

  // 3. Perhitungan Otomatis (Derived State - Tanpa useEffect)
  const totalPembelianBahan = bahanBakuList.reduce((sum, item) => {
    return sum + (parseFloat(item.hargaBeli) || 0);
  }, 0);

  const tenagaKerja = parseFloat(biayaOperasional.tenagaKerja) || 0;
  const overhead = parseFloat(biayaOperasional.overhead) || 0;
  const totalBiayaLain = tenagaKerja + overhead;

  const biayaProduksiTotal = totalPembelianBahan + totalBiayaLain;
  const jumlahProdukNum = parseFloat(jumlahProduk) || 0;
  const hppPerProduk = jumlahProdukNum > 0 ? biayaProduksiTotal / jumlahProdukNum : 0;

  const calculateMargin = (margin) => {
    const hargaJual = hppPerProduk + (hppPerProduk * margin / 100);
    const profitPerProduk = hargaJual - hppPerProduk;
    const totalProfit = profitPerProduk * jumlahProdukNum;
    return { hargaJual, profitPerProduk, totalProfit };
  };

  const saranHargaJual = {
    margin25: calculateMargin(25),
    margin35: calculateMargin(35),
    margin50: calculateMargin(50),
  };

  // 4. Navigasi Antar Step
  const handleNext = () => setCurrentStep(prev => prev + 1);
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.back();
    }
  };

  // 5. Handle Submit Final ke Database
  const handleSubmitFinal = async () => {
    // Persiapkan payload sesuai format yang diharapkan oleh useHitungHpp
    const payload = {
      namaProduk: namaProduk.trim(),
      categoryId: parseInt(selectedCategoryId),
      jumlahProduk: jumlahProdukNum,
      hppPerProduk: hppPerProduk,
      totalBiayaLain: totalBiayaLain,
      bahanBakuList: bahanBakuList.map(b => ({
        raw_material_id: parseInt(b.raw_material_id),
        qty_needed: parseFloat(b.qty_needed),
        unit: b.satuan
      }))
    };

    // Panggil fungsi submit dari hook
    const result = await submitHPP(payload);

    if (result.success) {
      alert(result.message);
      router.push('/hpp/hppproduk'); // Redirect ke halaman daftar HPP
    } else {
      alert(`Gagal menyimpan: ${result.message}`);
    }
  };

  // 6. Tampilan Loading Awal (Saat fetch data referensi dari Supabase)
  if (isLoading) {
    return (
      <PageLayout title="Hitung HPP">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300 -mx-4 -mt-4 md:-mx-6 md:-mt-6">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="font-semibold">Memuat data bahan baku...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Tampilkan error jika fetch data gagal
  if (error && rawMaterials.length === 0) {
    return (
      <PageLayout title="Hitung HPP">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300 -mx-4 -mt-4 md:-mx-6 md:-mt-6">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-sm">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              Coba Lagi
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // 7. Render Utama
  return (
    <PageLayout title="Hitung HPP">
      {/* Background Gradient */}
      <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300 -mx-4 -mt-4 md:-mx-6 md:-mt-6">
        
        {/* Header & Progress Indicator */}
        <StepIndicator currentStep={currentStep} onBack={handleBack} />

        {/* Render Step yang Aktif */}
        {currentStep === 1 && (
          <Step1BahanBaku
            namaProduk={namaProduk}
            setNamaProduk={setNamaProduk}
            bahanBakuList={bahanBakuList}
            setBahanBakuList={setBahanBakuList}
            rawMaterials={rawMaterials}
            totalPembelianBahan={totalPembelianBahan}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <Step2Operasional
            jumlahProduk={jumlahProduk}
            setJumlahProduk={setJumlahProduk}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            categories={categories}
            biayaOperasional={biayaOperasional}
            setBiayaOperasional={setBiayaOperasional}
            onNext={handleNext}
          />
        )}

        {currentStep === 3 && (
          <Step3Hasil
            namaProduk={namaProduk}
            jumlahProduk={jumlahProdukNum}
            totalPembelianBahan={totalPembelianBahan}
            totalBiayaLain={totalBiayaLain}
            biayaProduksiTotal={biayaProduksiTotal}
            hppPerProduk={hppPerProduk}
            saranHargaJual={saranHargaJual}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmitFinal}
            onBack={handleBack}
          />
        )}
      </div>
    </PageLayout>
  );
}