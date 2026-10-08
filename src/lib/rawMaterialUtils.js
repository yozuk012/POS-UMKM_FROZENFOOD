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