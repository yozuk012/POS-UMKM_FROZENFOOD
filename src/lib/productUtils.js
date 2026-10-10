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