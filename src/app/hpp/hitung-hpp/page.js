'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';

// 1. Import Hook (HANYA Bahan Baku, Operasional sudah dipisah)
import useHppBahanBaku from '@/hooks/useHppBahanBaku';

// 2. Import Komponen UI (Hanya 2 Step)
import StepIndicator from './components/StepIndicator';
import Step1BahanBaku from './components/Step1BahanBaku';
import Step2Hasil from './components/Step2Hasil';
import { getRecommendedPrice } from '@/lib/productUtils';

export default function HitungHPPPage() {
  const router = useRouter();
  
  // Hook: Khusus Bahan Baku & Resep
  const { 
    rawMaterials, 
    categories, 
    isLoading: isLoadingBahan, 
    isSubmitting: isSubmittingBahan, 
    error: errorBahan, 
    submitHPP 
  } = useHppBahanBaku();

  // --- STATE GLOBAL ---
  const [currentStep, setCurrentStep] = useState(1);
  
  const [namaProduk, setNamaProduk] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [jumlahProduk, setJumlahProduk] = useState('');
  const [satuanProduk, setSatuanProduk] = useState('pack');

  // --- MODE INPUT HPP ---
  // 'detail' = bahan baku diinput 1 per 1 (resep rinci)
  // 'cepat'  = akumulasi modal -> HPP = Total Modal : Jumlah Hasil
  const [modeInput, setModeInput] = useState('detail');
  const [totalModalCepat, setTotalModalCepat] = useState('');
  const [catatanHpp, setCatatanHpp] = useState('');

  const [bahanBakuList, setBahanBakuList] = useState([
    { 
      id: Date.now(), 
      raw_material_id: '', 
      namaBahan: '', 
      satuanBeli: '', 
      satuan: 'gram', 
      qty_needed: '', 
      cost_per_unit: 0, 
      hargaBeli: '0' 
    }
  ]);

  // Ambil nama produk dari URL params (jika ada)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('namaProduk')) {
      setNamaProduk(params.get('namaProduk'));
    }
  }, []);

  // --- PERHITUNGAN OTOMATIS (Derived State) ---
  const totalPembelianBahan = bahanBakuList.reduce((sum, item) => sum + (parseFloat(item.hargaBeli) || 0), 0);

  // Mode cepat (akumulasi): total modal diinput langsung sebagai 1 angka, bukan dihitung dari daftar bahan.
  const totalModalCepatNum = parseFloat(totalModalCepat) || 0;
  const totalModalBatch = modeInput === 'cepat' ? totalModalCepatNum : totalPembelianBahan;

  const jumlahProdukNum = parseFloat(jumlahProduk) || 0;
  // Rumus inti kedua mode: Total Modal : Jumlah yang Dihasilkan
  const hppBahanPerProduk = jumlahProdukNum > 0 ? (totalModalBatch / jumlahProdukNum) : 0;

  // --- NAVIGASI ---
  const handleNext = () => setCurrentStep(prev => prev + 1);
  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
    else router.back();
  };

  // --- HANDLE SUBMIT FINAL (HANYA SIMPAN BAHAN BAKU & RESEP) ---
  const handleSubmitFinal = async () => {
    try {
      // 1. Siapkan Payload Bahan Baku
      const payloadBahan = {
        namaProduk: namaProduk.trim(),
        categoryId: categoryId ? parseInt(categoryId, 10) : null,
        jumlahProduk: jumlahProdukNum,
        satuanProduk: satuanProduk,
        hppPerProduk: hppBahanPerProduk, // Murni bahan baku / modal akumulasi
        hargaRekomendasi: getRecommendedPrice(hppBahanPerProduk),
        totalBiayaOperasional: 0,        // 0 karena operasional dicatat terpisah
        modeInput: modeInput,            // 'detail' atau 'cepat'
        catatanResep: catatanHpp.trim(),
        // Mode cepat (akumulasi) tidak menyimpan rincian bahan baku.
        bahanBakuList: modeInput === 'cepat'
          ? []
          : bahanBakuList.map(b => ({
              raw_material_id: parseInt(b.raw_material_id, 10),
              qty_needed: parseFloat(b.qty_needed),
              unit: b.satuan
            }))
      };

      // 2. Eksekusi Simpan Bahan Baku & Resep
      const resultBahan = await submitHPP(payloadBahan);
      if (!resultBahan.success) throw new Error(resultBahan.message);

      // 3. Sukses - Tampilkan pesan & redirect
      const pesanSukses = modeInput === 'cepat'
        ? '✅ Produk & HPP (mode cepat/akumulasi) berhasil disimpan!'
        : '✅ Produk dan Resep berhasil disimpan!';
      alert(`${pesanSukses}\n\n💡 Jangan lupa catat biaya operasional (gas, listrik, kemasan) di halaman Pengeluaran agar laporan laba rugi akurat.`);
      router.push('/hpp/hppproduk');

    } catch (err) {
      console.error('Error saat submit final:', err);
      alert(`❌ Gagal menyimpan data: ${err.message}`);
    }
  };

  // --- TAMPILAN LOADING & ERROR ---
  if (isLoadingBahan) {
    return (
      <PageLayout title="Hitung HPP">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300 -mx-4 -mt-4 md:-mx-6 md:-mt-6">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="font-semibold">Memuat data referensi...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (errorBahan && rawMaterials.length === 0) {
    return (
      <PageLayout title="Hitung HPP">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300 -mx-4 -mt-4 md:-mx-6 md:-mt-6">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-sm mx-4">
            <p className="text-red-600 mb-4 font-medium">{errorBahan}</p>
            <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">
              Coba Lagi
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // --- RENDER UTAMA ---
  return (
    <PageLayout title="Hitung HPP">
      <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300 -mx-4 -mt-4 md:-mx-6 md:-mt-6 pb-10">
        
        <StepIndicator currentStep={currentStep} onBack={handleBack} />

        {currentStep === 1 && (
          <Step1BahanBaku
            modeInput={modeInput} setModeInput={setModeInput}
            totalModalCepat={totalModalCepat} setTotalModalCepat={setTotalModalCepat}
            namaProduk={namaProduk} setNamaProduk={setNamaProduk}
            categoryId={categoryId} setCategoryId={setCategoryId}
            categories={categories}
            jumlahProduk={jumlahProduk} setJumlahProduk={setJumlahProduk}
            satuanProduk={satuanProduk} setSatuanProduk={setSatuanProduk}
            bahanBakuList={bahanBakuList} setBahanBakuList={setBahanBakuList}
            rawMaterials={rawMaterials}
            totalModalBatch={totalModalBatch}
            catatanHpp={catatanHpp} setCatatanHpp={setCatatanHpp}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <Step2Hasil
            namaProduk={namaProduk}
            modeInput={modeInput}
            jumlahProduk={jumlahProdukNum}
            totalHppBahanBaku={totalModalBatch}
            isSubmitting={isSubmittingBahan}
            onSubmit={handleSubmitFinal}
            onBack={handleBack}
          />
        )}
      </div>
    </PageLayout>
  );
}