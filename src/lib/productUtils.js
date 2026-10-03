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