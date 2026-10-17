const UNIT_DEFINITIONS = {
  kg: { baseUnit: 'gram', factor: 1000 },
  gram: { baseUnit: 'gram', factor: 1 },
  g: { baseUnit: 'gram', factor: 1 },
  liter: { baseUnit: 'ml', factor: 1000 },
  ltr: { baseUnit: 'ml', factor: 1000 },
  l: { baseUnit: 'ml', factor: 1000 },
  ml: { baseUnit: 'ml', factor: 1 },
  pack: { baseUnit: 'pack', factor: 1 },
  bungkus: { baseUnit: 'pack', factor: 1 },
  pcs: { baseUnit: 'pcs', factor: 1 },
  lembar: { baseUnit: 'lembar', factor: 1 }
};

export function getUnitDefinition(unit) {
  const normalizedUnit = String(unit || '').toLowerCase().trim();
  return UNIT_DEFINITIONS[normalizedUnit] || {
    baseUnit: normalizedUnit || 'pcs',
    factor: 1
  };
}

export function convertPurchaseToBase({ quantity, unit, totalPrice }) {
  const purchaseQuantity = Number(quantity);
  const purchasePrice = Number(totalPrice);
  const { baseUnit, factor } = getUnitDefinition(unit);

  if (!Number.isFinite(purchaseQuantity) || purchaseQuantity <= 0) {
    throw new Error('Jumlah beli harus lebih dari 0.');
  }
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
    throw new Error('Harga beli harus berupa angka yang valid.');
  }

  const baseQuantity = purchaseQuantity * factor;
  return {
    baseUnit,
    costPerBaseUnit: purchasePrice / baseQuantity,
    purchaseUnit: String(unit).toLowerCase().trim(),
    purchaseQuantity,
    purchasePrice,
    factor
  };
}

export function convertToBaseQuantity(quantity, unit) {
  return (Number(quantity) || 0) * getUnitDefinition(unit).factor;
}

export function getPurchaseDisplay(material) {
  const storedUnit = material.purchase_unit || material.unit;
  const storedQuantity = Number(material.purchase_quantity) || 1;
  const storedFactor = getUnitDefinition(storedUnit).factor;
  const baseQuantity = storedQuantity * storedFactor;
  const unit = getDisplayUnit(storedUnit, baseQuantity);
  const factor = getUnitDefinition(unit).factor;
  const price = Number(material.purchase_price);

  return {
    unit,
    quantity: baseQuantity / factor,
    price: Number.isFinite(price) ? price : Number(material.cost_per_unit || 0) * factor,
    stock: Number(material.qty_on_hand || 0) / factor
  };
}

function getDisplayUnit(storedUnit, baseQuantity) {
  const normalizedUnit = String(storedUnit || '').toLowerCase().trim();

  if (normalizedUnit === 'kg' || normalizedUnit === 'gram' || normalizedUnit === 'g') {
    return baseQuantity >= 1000 ? 'kg' : 'gram';
  }
  if (normalizedUnit === 'liter' || normalizedUnit === 'ltr' || normalizedUnit === 'l' || normalizedUnit === 'ml') {
    return baseQuantity >= 1000 ? 'liter' : 'ml';
  }

  return normalizedUnit;
}

export function formatCompactRupiah(value) {
  const amount = Number(value) || 0;
  if (amount >= 1000 && amount % 1000 === 0) {
    return `${amount / 1000}rb`;
  }
  return `Rp${amount.toLocaleString('id-ID')}`;
}

export function getPurchaseEditValues(material) {
  const unit = material.purchase_unit || material.unit;
  const quantity = Number(material.purchase_quantity) || 1;
  const factor = getUnitDefinition(unit).factor;
  const price = Number(material.purchase_price);

  return {
    unit,
    quantity,
    price: Number.isFinite(price) ? price : Number(material.cost_per_unit || 0) * factor,
    stock: Number(material.qty_on_hand || 0) / factor
  };
}

/**
 * Validasi nama bahan baku untuk mencegah input Script (XSS/HTML) dan perintah SQL (SQL Injection).
 * @param {string} name
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateRawMaterialName(name) {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Nama bahan baku wajib diisi.' };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Nama bahan baku minimal 2 karakter.' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Nama bahan baku maksimal 100 karakter.' };
  }

  // 1. Cek Script / HTML Tags Injection (XSS)
  const scriptPattern = /<[^>]*>|<\/?[a-z][\s\S]*>|javascript\s*:|\bon\w+\s*=/i;
  if (scriptPattern.test(trimmed) || /[<>]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Nama bahan baku tidak boleh mengandung tag HTML, script, atau simbol < >.'
    };
  }

  // 2. Cek Karakter dan Komentar SQL
  const sqlCommentsOrSeparators = /(--|\/\*|\*\/|;|#)/;
  if (sqlCommentsOrSeparators.test(trimmed)) {
    return {
      isValid: false,
      error: 'Nama bahan baku tidak boleh mengandung simbol SQL (; -- /* */ #).'
    };
  }

  // Cek Pola SQL Injection umum (misal: ' OR '1'='1 atau ' OR 1=1)
  const sqlInjectionPattern = /\b(or|and)\s+['"\d\w]+\s*=\s*['"\d\w]+/i;
  if (sqlInjectionPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Nama bahan baku terdeteksi mengandung pola SQL injection.'
    };
  }

  // Cek Perintah / Keyword SQL berbahaya
  const sqlKeywords = /\b(select|insert|update|delete|drop|truncate|alter|create|table|database|union|exec|execute|declare|grant|revoke)\b/i;
  if (sqlKeywords.test(trimmed)) {
    return {
      isValid: false,
      error: 'Nama bahan baku tidak boleh mengandung perintah SQL (SELECT, DROP, INSERT, dll).'
    };
  }

  // 3. Cek Karakter berbahaya lainnya
  const unsafeChars = /[`"\$\^\\\{\}\[\]~|]/;
  if (unsafeChars.test(trimmed)) {
    return {
      isValid: false,
      error: 'Nama bahan baku mengandung karakter khusus yang tidak diizinkan.'
    };
  }

  return { isValid: true };
}