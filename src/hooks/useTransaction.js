import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { ACTIVE_STORE_EVENT, getActiveStoreId, isMainStore, resolveActiveStore } from '@/lib/activeStore';
import { clampQuickDiscount } from '@/lib/productUtils';

export default function useTransaction() {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState('');
  // Diskon Cepat (nominal Rp) hanya boleh dipakai di cabang utama.
  const [isMainBranch, setIsMainBranch] = useState(false);
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('offline'); 
  const [categoryId, setCategoryId] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20; 

  // Cart & Checkout
  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0); 
  
  // UI States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [storeQrisUrl, setStoreQrisUrl] = useState(null);

  // State Modul Struk
  const [storeInfo, setStoreInfo] = useState({
    name: 'Toko Saya',
    logo_url: null,
    address: null,
    phone: null,
    bank_name: null,
    account_number: null,
    account_name: null
  });
  const [receiptData, setReceiptData] = useState(null); 

  // ==========================================
  // 2. FETCH CATEGORIES & STORE INFO
  // ==========================================
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user?.id) {
        setStoreId(null);
        setStoreName('');
        setIsMainBranch(false);
        setProducts([]);
        setCategories([]);
        setCartItems([]);
        return;
      }

      const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('id, name, logo_url, address, qris_code_url, qris_merchant_id, bank_name, account_number, account_name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('id', { ascending: true });

      const storeData = resolveActiveStore(stores);

      if (storeError || !storeData) {
        setStoreId(null);
        setStoreName('');
        setIsMainBranch(false);
        setCategories([]);
        setProducts([]);
        setCartItems([]);
        return;
      }

      setStoreId(storeData.id);
      setStoreName(storeData.name || '');
      setIsMainBranch(isMainStore(storeData, stores));

      const { data: merchantData } = await supabase
        .from('merchants')
        .select('phone')
        .eq('id', user.id)
        .maybeSingle();

      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', storeData.id)
        .order('name', { ascending: true });
      
      setCategories(catData || []);

      if (storeData.qris_code_url) {
        const cleanUrl = storeData.qris_code_url.replace(/^(https?:\/\/)+/i, 'https://');
        setStoreQrisUrl(cleanUrl);
      }
      setStoreInfo({
        name: storeData.name || 'Toko Saya',
        logo_url: storeData.logo_url || null,
        address: storeData.address || null,
        phone: merchantData?.phone || null,
        bank_name: storeData.bank_name || null,
        account_number: storeData.account_number || null,
        account_name: storeData.account_name || null
      });
    };

    fetchInitialData();

    const handleStoreChange = () => {
      // KETIKA SWITCH TOKO: TRANSAKSI KOSONG, PRODUK KOSONG, KATEGORI KOSONG
      setCartItems([]);
      setDiscount(0);
      setCustomerName('');
      setReceiptData(null);
      setIsPaymentModalOpen(false);
      setProducts([]);
      setCategories([]);
      setTotalItems(0);
      setCategoryId('all');
      setSearch('');
      fetchInitialData();
    };

    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, [user?.id]);

  // ==========================================
  // 3. FETCH PRODUCTS (DENGAN DATA STOK)
  // ==========================================
  const fetchProducts = useCallback(async () => {
    if (!storeId) {
      setProducts([]);
      setTotalItems(0);
      return;
    }

    setIsLoadingProducts(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          id, name, sku, unit, base_price, hpp, image_url, is_active, store_id, category_id, discount_pct,
          categories (name),
          product_prices (channel, price, platform_fee_pct),
          inventory (qty_on_hand) 
        `, { count: 'exact' })
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      if (categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // PERBAIKAN 1: Mapping data agar properti 'stock' mudah diakses
      let filteredData = (data || []).map(p => ({
        ...p,
        stock: Array.isArray(p.inventory) 
          ? (p.inventory[0]?.qty_on_hand || 0) 
          : (p.inventory?.qty_on_hand || 0)
      }));
      
      if (channel === 'online') {
        const onlineChannels = ['online', 'shopee', 'tokopedia', 'grabmart', 'gojek'];
        filteredData = filteredData.filter(product => 
          product.product_prices?.some(p => onlineChannels.includes(p.channel.toLowerCase()))
        );
      } 

      const totalFiltered = filteredData.length;
      const from = (currentPage - 1) * limit;
      const to = from + limit;
      const paginatedData = filteredData.slice(from, to);

      setProducts(paginatedData);
      setTotalItems(totalFiltered);
      
    } catch (error) {
      console.error('❌ Error fetching products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [currentPage, search, channel, categoryId, storeId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ==========================================
  // 4. CART LOGIC (DENGAN VALIDASI STOK)
  // ==========================================
  const addToCart = (product) => {
    const availableStock = product.stock || 0;

    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      const currentQtyInCart = existingItem ? existingItem.qty : 0;

      // PERBAIKAN 2: Validasi saat menambah 1 item
      if (currentQtyInCart + 1 > availableStock) {
        alert(`⚠️ Stok tidak mencukupi!\nStok tersedia hanya ${availableStock} ${product.unit}.`);
        return prev; // Batalkan penambahan
      }

      const targetChannel = channel;
      const priceData = product.product_prices?.find(p => p.channel.toLowerCase() === targetChannel);
      
      const basePrice = priceData ? Number(priceData.price) : Number(product.base_price);
      const platformFeePct = priceData ? Number(priceData.platform_fee_pct) : 0;
      const discountPct = Number(product.discount_pct) || 0;
      // Harga normal = harga channel (offline/online) setelah diskon persen produk.
      // Diskon Cepat kasir (nominal Rp) dipotong dari harga normal ini.
      const normalUnitPrice = Math.round(basePrice - (basePrice * (discountPct / 100)));
      const unitPrice = normalUnitPrice;
      const hpp = Number(product.hpp) || 0;
      
      if (existingItem) {
        return prev.map(item => {
          if (item.id !== product.id) return item;

          const nextQty = item.qty + 1;
          const normalLineTotal = item.base_unit_price * nextQty;
          const discount = clampQuickDiscount(item.quick_discount, normalLineTotal);
          const lineTotal = normalLineTotal - discount;

          return {
            ...item,
            qty: nextQty,
            unit_price: nextQty > 0 ? lineTotal / nextQty : 0,
            line_total: Math.round(lineTotal),
          };
        });
      }
      
      return [...prev, {
        id: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        hpp: hpp,
        qty: 1,
        unit_price: unitPrice, 
        original_price: basePrice, 
        discount_pct: discountPct,
        // Harga normal per unit sebelum Diskon Cepat (acuan validasi & tampilan)
        base_unit_price: normalUnitPrice,
        quick_discount: 0,
        platform_fee_pct: platformFeePct,
        line_total: unitPrice,
        category_name: product.categories?.name || 'Umum',
        channel: targetChannel 
      }];
    });
  };

  // ==========================================
  // 4b. DISKON CEPAT (NOMINAL Rp) — KHUSUS CABANG UTAMA
  // Kasir langsung mengetik nominal potongan (mis. 5.000) atau harga jual akhir
  // (mis. 25.000) untuk total satu baris produk. Nilai potongan "dibakar" ke unit_price
  // persis seperti perilaku discount_pct produk, sehingga subtotal, grandTotal,
  // laporan, dan struk tetap konsisten (subtotal - discount = grand_total).
  // ==========================================
  const applyItemDiscount = (productId, discountAmount) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.id !== productId) return item;

        const normalUnitPrice = Number(item.base_unit_price) || Number(item.unit_price) || 0;
        const normalLineTotal = normalUnitPrice * item.qty;
        const discount = clampQuickDiscount(discountAmount, normalLineTotal);
        const lineTotal = normalLineTotal - discount;
        const unitPrice = item.qty > 0 ? lineTotal / item.qty : 0;

        return {
          ...item,
          quick_discount: discount,
          unit_price: unitPrice,
          line_total: Math.round(lineTotal)
        };
      })
    );
  };

  const clearItemDiscount = (productId) => applyItemDiscount(productId, 0);

  const updateQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeItem(productId);
      return;
    }

    // PERBAIKAN 3: Validasi saat mengubah jumlah secara manual
    const originalProduct = products.find(p => p.id === productId);
    const availableStock = originalProduct?.stock || 0;

    if (newQty > availableStock) {
      alert(`⚠️ Stok tidak mencukupi!\nMaksimal jumlah yang bisa dimasukkan adalah ${availableStock}.`);
      return; // Batalkan update, kembalikan ke nilai lama (tidak di-set)
    }

    setCartItems(prev =>
      prev.map(item => {
        if (item.id !== productId) return item;

        const normalUnitPrice = Number(item.base_unit_price) || Number(item.unit_price) || 0;
        const normalLineTotal = normalUnitPrice * newQty;
        const discount = clampQuickDiscount(item.quick_discount, normalLineTotal);
        const lineTotal = normalLineTotal - discount;

        return {
          ...item,
          qty: newQty,
          unit_price: newQty > 0 ? lineTotal / newQty : 0,
          line_total: Math.round(lineTotal),
        };
      })
    );
  };

  const removeItem = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscount(0);
    setCustomerName('');
  };

  // ==========================================
  // 5. CALCULATIONS (PERHITUNGAN)
  // ==========================================
  const subtotal = Math.round(cartItems.reduce((sum, item) => sum + item.line_total, 0));
  // Total Diskon Cepat yang diberikan kasir (nominal total per baris).
  const itemDiscountTotal = Math.round(cartItems.reduce((sum, item) => {
    return sum + (Number(item.quick_discount) || 0);
  }, 0));
  // Subtotal "harga normal" sebelum Diskon Cepat (untuk tampilan di keranjang).
  const subtotalBeforeDiscount = subtotal + itemDiscountTotal;
  const platformFee = Math.round(cartItems.reduce((sum, item) => {
    return sum + ((item.line_total * item.platform_fee_pct) / 100);
  }, 0));
  const grandTotal = Math.max(0, subtotal - discount);
  // Hemat pelanggan = Diskon Cepat per item + diskon level transaksi (kalau ada).
  const totalSavings = itemDiscountTotal + discount;

  // ==========================================
  // 6. CHECKOUT & DATABASE INSERT
  // ==========================================
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    if (!isProcessing) {
      setIsPaymentModalOpen(false);
      setReceiptData(null); 
    }
  };

  const confirmPayment = async (paymentData) => {
    setIsProcessing(true);
    try {
      const finalChannel = channel;
      const amountPaid = Number(paymentData.amount_paid) || grandTotal;
      const change = Math.max(0, amountPaid - grandTotal);

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          store_id: storeId,
          sale_date: new Date().toISOString(),
          channel: finalChannel,
          payment_method: paymentData.payment_method,
          subtotal: subtotal,
          discount: discount,
          platform_fee: platformFee,
          grand_total: grandTotal,
          notes: customerName ? `Customer: ${customerName}` : 'Umum',
          qris_reference: paymentData.reference_number || null,
          qris_status: paymentData.qris_status || null,
          qris_paid_at: paymentData.qris_paid_at || null
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      const itemsToInsert = cartItems.map(item => ({
        sale_id: saleData.id,
        product_id: item.id,
        qty: item.qty,
        unit_price: item.unit_price,
        hpp_snapshot: item.hpp, 
        line_total: item.line_total
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // Update Stok (Inventory)
      for (const item of cartItems) {
        const { data: currentStock } = await supabase
          .from('inventory')
          .select('qty_on_hand')
          .eq('store_id', storeId)
          .eq('product_id', item.id)
          .single();

        const currentQty = currentStock?.qty_on_hand || 0;
        const newQty = Math.max(0, currentQty - item.qty);

        await supabase
          .from('inventory')
          .update({ qty_on_hand: newQty, last_updated: new Date().toISOString() })
          .eq('store_id', storeId)
          .eq('product_id', item.id);
      }

      const newReceiptData = {
        store: storeInfo,
        transaction_id: `TRX-${saleData.id}`, 
        date: new Date(saleData.sale_date).toLocaleString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        customer_name: customerName.trim() !== '' ? customerName : '-',
        items: cartItems.map(item => ({
          name: item.name,
          qty: item.qty,
          unit_price: item.unit_price,
          line_total: item.line_total,
          // Info Diskon Cepat: harga normal per unit & total potongan baris ini
          original_unit_price: Number(item.base_unit_price) || Number(item.unit_price) || 0,
          discount_amount: Number(item.quick_discount) || 0
        })),
        subtotal: subtotal,
        discount: discount,
        grand_total: grandTotal,
        amount_paid: amountPaid,
        // Diskon Cepat sudah "dibakar" ke unit_price, jadi sales.discount tetap
        // diskon level transaksi. Dua baris ini hanya info tambahan untuk struk.
        item_discount_total: itemDiscountTotal,
        total_savings: totalSavings,
        change: change,
        payment_method: paymentData.payment_method
      };

      setIsPaymentModalOpen(false);
      setReceiptData(newReceiptData);
      clearCart();
      fetchProducts(); 

    } catch (error) {
      console.error('❌ Error saat checkout:', error);
      alert('Gagal memproses transaksi: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const finishReceipt = () => {
    setReceiptData(null);
    setIsPaymentModalOpen(false);
  };

  return {
    products,
    categories,
    isLoadingProducts,
    search,
    setSearch,
    channel,
    setChannel,
    categoryId,
    setCategoryId,
    pagination: {
      currentPage,
      totalPages: Math.ceil(totalItems / limit) || 1,
      totalItems
    },
    setPage: setCurrentPage,
    cartItems,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
    customerName,
    setCustomerName,
    isMainBranch,
    storeName,
    applyItemDiscount,
    clearItemDiscount,
    itemDiscountTotal,
    subtotalBeforeDiscount,
    totalSavings,
    discount,
    setDiscount,
    subtotal,
    platformFee, 
    grandTotal,
    isPaymentModalOpen,
    handleCheckout,
    closePaymentModal,
    confirmPayment,
    isProcessing,
    storeQrisUrl,
    storeInfo,
    receiptData,
    finishReceipt
  };
}