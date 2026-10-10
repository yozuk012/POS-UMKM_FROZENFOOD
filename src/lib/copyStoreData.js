// src/lib/copyStoreData.js
import { supabase } from '@/lib/supabase';

/**
 * Mengambil daftar data dari toko tertentu untuk keperluan modal Salin Data
 * @param {'categories' | 'raw_materials' | 'products'} type 
 * @param {string|number} storeId 
 */
export async function fetchItemsForCopy(type, storeId) {
  if (!storeId) return [];

  try {
    if (type === 'categories') {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, created_at')
        .eq('store_id', storeId)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        subtitle: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-',
      }));
    }

    if (type === 'raw_materials') {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('id, name, unit, cost_per_unit, purchase_unit, purchase_price, created_at')
        .eq('store_id', storeId)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        subtitle: `Satuan: ${item.unit || item.purchase_unit || '-'} | Harga: Rp ${Number(item.purchase_price || item.cost_per_unit || 0).toLocaleString('id-ID')}`,
      }));
    }

    if (type === 'products') {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, sku, unit, base_price, hpp,
          categories ( name ),
          recipes (
            id, total_hpp,
            recipe_ingredients ( id )
          )
        `)
        .eq('store_id', storeId)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map((item) => {
        const recipe = Array.isArray(item.recipes) ? item.recipes[0] : item.recipes;
        const ingredientCount = recipe?.recipe_ingredients?.length || 0;
        const hasRecipe = ingredientCount > 0;

        return {
          id: item.id,
          name: item.name,
          subtitle: `Kategori: ${item.categories?.name || '-'} | Harga: Rp ${Number(item.base_price || 0).toLocaleString('id-ID')}`,
          hasRecipe,
          recipeBadge: hasRecipe ? `Resep (${ingredientCount} Bahan)` : 'Tanpa Resep',
        };
      });
    }

    return [];
  } catch (err) {
    console.error(`Error fetching items for copy (${type}):`, err);
    throw err;
  }
}

/**
 * Menyalin kategori yang dipilih ke cabang tujuan
 */
export async function copyCategories(sourceStoreId, targetStoreId, categoryIds) {
  if (!categoryIds || categoryIds.length === 0) return { success: true, count: 0 };

  const { data: sourceCategories, error: fetchErr } = await supabase
    .from('categories')
    .select('id, name')
    .eq('store_id', sourceStoreId)
    .in('id', categoryIds);

  if (fetchErr) throw fetchErr;

  const { data: targetCategories, error: targetErr } = await supabase
    .from('categories')
    .select('id, name')
    .eq('store_id', targetStoreId);

  if (targetErr) throw targetErr;

  const targetNameSet = new Set((targetCategories || []).map((c) => c.name.toLowerCase().trim()));
  const toInsert = [];

  for (const cat of sourceCategories || []) {
    const trimmed = cat.name.trim();
    if (!targetNameSet.has(trimmed.toLowerCase())) {
      toInsert.push({
        store_id: parseInt(targetStoreId, 10),
        name: trimmed,
      });
      targetNameSet.add(trimmed.toLowerCase());
    }
  }

  if (toInsert.length > 0) {
    const { error: insertErr } = await supabase.from('categories').insert(toInsert);
    if (insertErr) throw insertErr;
  }

  return { success: true, count: toInsert.length, totalSelected: categoryIds.length };
}

/**
 * Menyalin bahan baku yang dipilih ke cabang tujuan
 */
export async function copyRawMaterials(sourceStoreId, targetStoreId, rawMaterialIds) {
  if (!rawMaterialIds || rawMaterialIds.length === 0) return { success: true, count: 0 };

  const { data: sourceMaterials, error: fetchErr } = await supabase
    .from('raw_materials')
    .select('*')
    .eq('store_id', sourceStoreId)
    .in('id', rawMaterialIds);

  if (fetchErr) throw fetchErr;

  const { data: targetMaterials, error: targetErr } = await supabase
    .from('raw_materials')
    .select('id, name')
    .eq('store_id', targetStoreId);

  if (targetErr) throw targetErr;

  const targetNameSet = new Set((targetMaterials || []).map((m) => m.name.toLowerCase().trim()));
  let insertedCount = 0;

  for (const rm of sourceMaterials || []) {
    const trimmed = rm.name.trim();
    if (targetNameSet.has(trimmed.toLowerCase())) continue;

    const payload = {
      store_id: parseInt(targetStoreId, 10),
      name: trimmed,
      unit: rm.unit || 'gram',
      cost_per_unit: rm.cost_per_unit || 0,
      purchase_unit: rm.purchase_unit || rm.unit || 'gram',
      purchase_quantity: rm.purchase_quantity || 1,
      purchase_price: rm.purchase_price || 0,
      is_perishable: rm.is_perishable ?? true,
      shelf_life_days: rm.shelf_life_days ?? 7,
    };

    const { data: newRm, error: insertErr } = await supabase
      .from('raw_materials')
      .insert(payload)
      .select('id')
      .single();

    if (insertErr) throw insertErr;

    // Inisialisasi inventory bahan baku
    await supabase.from('inventory').insert({
      store_id: parseInt(targetStoreId, 10),
      raw_material_id: newRm.id,
      product_id: null,
      qty_on_hand: 0,
      last_updated: new Date().toISOString(),
    });

    targetNameSet.add(trimmed.toLowerCase());
    insertedCount++;
  }

  return { success: true, count: insertedCount, totalSelected: rawMaterialIds.length };
}

/**
 * Menyalin produk yang dipilih ke cabang tujuan BESERTA RECIPES & RECIPE_INGREDIENTS
 */
export async function copyProducts(sourceStoreId, targetStoreId, productIds) {
  if (!productIds || productIds.length === 0) return { success: true, count: 0 };

  // 1. Ambil data produk lengkap beserta resep, bahan resep, kategori, dan harga multi-channel
  const { data: sourceProducts, error: fetchErr } = await supabase
    .from('products')
    .select(`
      *,
      categories ( id, name ),
      product_prices ( channel, price, platform_fee_pct ),
      recipes (
        id, total_hpp, yield_qty, total_yield, effective_date, notes,
        recipe_ingredients (
          id, raw_material_id, qty_needed, unit,
          raw_materials ( id, name, unit, cost_per_unit, purchase_unit, purchase_quantity, purchase_price, is_perishable, shelf_life_days )
        )
      )
    `)
    .eq('store_id', sourceStoreId)
    .in('id', productIds);

  if (fetchErr) throw fetchErr;

  // 2. Ambil data kategori yang sudah ada di toko target
  const { data: targetCategories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('store_id', targetStoreId);

  const targetCategoryMap = new Map();
  (targetCategories || []).forEach((c) => targetCategoryMap.set(c.name.toLowerCase().trim(), c.id));

  // 3. Ambil data bahan baku yang sudah ada di toko target
  const { data: targetRawMaterials } = await supabase
    .from('raw_materials')
    .select('id, name')
    .eq('store_id', targetStoreId);

  const targetRawMaterialMap = new Map();
  (targetRawMaterials || []).forEach((rm) => targetRawMaterialMap.set(rm.name.toLowerCase().trim(), rm.id));

  let copiedCount = 0;

  for (const prod of sourceProducts || []) {
    // 4a. Tangani Kategori: Jika belum ada di toko target, otomatis buatkan kategori dengan nama yang sama
    let targetCategoryId = null;
    if (prod.categories?.name) {
      const catName = prod.categories.name.trim();
      const existingCatId = targetCategoryMap.get(catName.toLowerCase());

      if (existingCatId) {
        targetCategoryId = existingCatId;
      } else {
        const { data: newCat, error: catInsertErr } = await supabase
          .from('categories')
          .insert({ store_id: parseInt(targetStoreId, 10), name: catName })
          .select('id')
          .single();

        if (!catInsertErr && newCat) {
          targetCategoryId = newCat.id;
          targetCategoryMap.set(catName.toLowerCase(), newCat.id);
        }
      }
    }

    // 4b. Buat SKU unik untuk cabang target
    let targetSku = prod.sku ? `${prod.sku}` : `SKU-${Date.now()}`;
    const { data: existingSku } = await supabase
      .from('products')
      .select('id')
      .eq('sku', targetSku)
      .maybeSingle();

    if (existingSku) {
      targetSku = `${prod.sku || 'PROD'}-T${targetStoreId}-${Date.now().toString().slice(-4)}`;
    }

    // 4c. Insert Produk ke Toko Target
    const productPayload = {
      store_id: parseInt(targetStoreId, 10),
      category_id: targetCategoryId,
      name: prod.name.trim(),
      sku: targetSku,
      type: prod.type || 'finished_good',
      unit: prod.unit || 'pcs',
      base_price: prod.base_price || 0,
      hpp: prod.hpp || 0,
      image_url: prod.image_url || null,
      is_active: prod.is_active !== false,
      discount_pct: prod.discount_pct || 0,
      online_markup_pct: prod.online_markup_pct || 0,
    };

    const { data: newProd, error: prodErr } = await supabase
      .from('products')
      .insert(productPayload)
      .select('id')
      .single();

    if (prodErr) throw prodErr;
    const newProductId = newProd.id;

    // 4d. Salin Product Prices (Multi-channel)
    if (prod.product_prices && prod.product_prices.length > 0) {
      const pricesToInsert = prod.product_prices.map((pp) => ({
        product_id: newProductId,
        channel: pp.channel,
        price: pp.price,
        platform_fee_pct: pp.platform_fee_pct || 0,
      }));
      await supabase.from('product_prices').insert(pricesToInsert);
    }

    // 4e. Inisialisasi Inventory Produk
    await supabase.from('inventory').insert({
      store_id: parseInt(targetStoreId, 10),
      product_id: newProductId,
      raw_material_id: null,
      qty_on_hand: 0,
      last_updated: new Date().toISOString(),
    });

    // 4f. Salin Resep (recipes) dan Bahan Resep (recipe_ingredients)
    const sourceRecipe = Array.isArray(prod.recipes) ? prod.recipes[0] : prod.recipes;
    if (sourceRecipe) {
      const sourceIngredients = sourceRecipe.recipe_ingredients || [];
      const resolvedIngredients = [];

      for (const ing of sourceIngredients) {
        const sourceRm = ing.raw_materials;
        if (!sourceRm) continue;

        const rmName = sourceRm.name.trim();
        let targetRmId = targetRawMaterialMap.get(rmName.toLowerCase());

        // Jika bahan baku penyusun resep belum ada di toko target, otomatis salin bahan bakunya
        if (!targetRmId) {
          const { data: newRm, error: rmErr } = await supabase
            .from('raw_materials')
            .insert({
              store_id: parseInt(targetStoreId, 10),
              name: rmName,
              unit: sourceRm.unit || 'gram',
              cost_per_unit: sourceRm.cost_per_unit || 0,
              purchase_unit: sourceRm.purchase_unit || sourceRm.unit || 'gram',
              purchase_quantity: sourceRm.purchase_quantity || 1,
              purchase_price: sourceRm.purchase_price || 0,
              is_perishable: sourceRm.is_perishable ?? true,
              shelf_life_days: sourceRm.shelf_life_days ?? 7,
            })
            .select('id')
            .single();

          if (!rmErr && newRm) {
            targetRmId = newRm.id;
            targetRawMaterialMap.set(rmName.toLowerCase(), newRm.id);

            // Inisialisasi inventory bahan baku baru
            await supabase.from('inventory').insert({
              store_id: parseInt(targetStoreId, 10),
              raw_material_id: newRm.id,
              product_id: null,
              qty_on_hand: 0,
              last_updated: new Date().toISOString(),
            });
          }
        }

        if (targetRmId) {
          resolvedIngredients.push({
            raw_material_id: targetRmId,
            qty_needed: ing.qty_needed,
            unit: ing.unit,
          });
        }
      }

      // Buat resep baru di toko target
      const { data: newRecipe, error: recipeErr } = await supabase
        .from('recipes')
        .insert({
          product_id: newProductId,
          total_hpp: sourceRecipe.total_hpp || 0,
          yield_qty: sourceRecipe.yield_qty || 1,
          total_yield: sourceRecipe.total_yield || 1,
          effective_date: sourceRecipe.effective_date || new Date().toISOString().split('T')[0],
          notes: sourceRecipe.notes || 'Resep disalin dari cabang lain',
        })
        .select('id')
        .single();

      if (!recipeErr && newRecipe && resolvedIngredients.length > 0) {
        const ingredientsPayload = resolvedIngredients.map((ing) => ({
          recipe_id: newRecipe.id,
          raw_material_id: ing.raw_material_id,
          qty_needed: ing.qty_needed,
          unit: ing.unit,
        }));
        await supabase.from('recipe_ingredients').insert(ingredientsPayload);
      }
    }

    copiedCount++;
  }

  return { success: true, count: copiedCount, totalSelected: productIds.length };
}

/**
 * Dispatcher umum untuk menjalankan copy berdasarkan jenis entity
 */
export async function executeCopyStoreData(type, sourceStoreId, targetStoreId, selectedIds) {
  if (type === 'categories') {
    return await copyCategories(sourceStoreId, targetStoreId, selectedIds);
  }
  if (type === 'raw_materials') {
    return await copyRawMaterials(sourceStoreId, targetStoreId, selectedIds);
  }
  if (type === 'products') {
    return await copyProducts(sourceStoreId, targetStoreId, selectedIds);
  }
  throw new Error(`Tipe copy tidak dikenal: ${type}`);
}
