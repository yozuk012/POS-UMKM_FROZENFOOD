// Format angka ke Rupiah: 43000 → "Rp 43.000"
export const formatRupiah = (number) => {
  if (number === null || number === undefined || number === "") return "Rp 0";
  return "Rp " + Number(number).toLocaleString("id-ID");
};

// Parse "Rp 43.000" → 43000
export const parseNumberUI = (val) => {
  if (!val) return 0;
  return Number(String(val).replace(/\D/g, "")) || 0;
};

// Hitung harga setelah diskon. Return null kalau tidak ada diskon.
export const getDiscountedPrice = (basePrice, discountPct) => {
  const pct = parseFloat(discountPct) || 0;
  if (pct <= 0) return null;
  return parseFloat(basePrice) - parseFloat(basePrice) * (pct / 100);
};

export const getRecommendedPrice = (hppPerUnit, marginPct = 50) => {
  const hpp = Number(hppPerUnit) || 0;
  const margin = Number(marginPct) || 0;
  const calculatedPrice = hpp * (1 + margin / 100);
  return Math.round(calculatedPrice / 500) * 500;
};

export const getOnlinePrice = (basePrice, markupPct = 0) => {
  const base = Number(basePrice) || 0;
  const markup = Number(markupPct) || 0;
  const calculatedPrice = base * (1 + markup / 100);
  return Math.ceil(calculatedPrice / 1000) * 1000;
};

// ==========================================
// DISKON CEPAT KASIR (NOMINAL Rp, BUKAN PERSEN)
// Dipakai di halaman Transaksi dan hanya berlaku di cabang utama.
//   mode 'potongan' -> kasir mengetik nominal potongan (mis. 5.000)
//   mode 'harga'    -> kasir mengetik harga jual akhir (mis. 25.000)
// ==========================================
export const QUICK_DISCOUNT_MODE = {
  POTONGAN: 'potongan',
  HARGA: 'harga',
};

/**
 * Terjemahkan input kasir menjadi potongan & harga jual per unit.
 * @returns {{normalPrice:number, discount:number, finalPrice:number, isValid:boolean}}
 *          isValid = false kalau input melebihi harga normal (mis. potongan 35.000
 *          pada harga 30.000, atau harga jual 35.000 dari harga normal 30.000).
 */
export const resolveQuickDiscount = ({
  normalPrice = 0,
  mode = QUICK_DISCOUNT_MODE.POTONGAN,
  value = 0,
} = {}) => {
  const normal = Math.max(0, Math.round(Number(normalPrice) || 0));
  const input = Math.max(0, Math.round(Number(value) || 0));
  const isPriceMode = mode === QUICK_DISCOUNT_MODE.HARGA;

  const discount = isPriceMode ? normal - input : input;
  const finalPrice = normal - discount;

  return {
    normalPrice: normal,
    discount,
    finalPrice,
    isValid: discount >= 0 && discount <= normal,
  };
};

// Batasi nominal potongan agar tidak minus dan tidak melebihi harga normal.
export const clampQuickDiscount = (amount, normalPrice) => {
  const normal = Math.max(0, Math.round(Number(normalPrice) || 0));
  const value = Math.round(Number(amount) || 0);
  return Math.min(Math.max(value, 0), normal);
};
