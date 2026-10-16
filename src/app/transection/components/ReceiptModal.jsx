'use client';

// src/app/transection/components/ReceiptModal.jsx
//
// Modal struk setelah transaksi berhasil. Fitur:
//   1. Preview struk kertas putih dengan ukuran asli (58 mm / 80 mm)
//   2. Cetak lewat dialog browser dengan ukuran kertas struk (@page size)
//   3. Cetak langsung ke printer thermal Bluetooth (Web Bluetooth + ESC/POS),
//      termasuk logo toko versi hitam-putih beresolusi rendah (perintah GS v 0)
//   4. Unduh struk sebagai PNG (bisa langsung dilihat) atau PDF
//   5. Salin teks struk (untuk WhatsApp / aplikasi RawBT)

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  FiAlertCircle,
  FiBluetooth,
  FiCheck,
  FiCheckCircle,
  FiCopy,
  FiFileText,
  FiImage,
  FiLoader,
  FiPrinter,
  FiX,
} from 'react-icons/fi';
import {
  DEFAULT_LOGO_SIZE,
  DEFAULT_PAPER_WIDTH,
  RECEIPT_LOGO_SIZES,
  RECEIPT_PAPER_SIZES,
  buildReceiptLayout,
  getLogoMaxWidthDots,
  getPaperConfig,
  layoutToPlainText,
  toPrintableLines,
} from '@/lib/receiptLayout';
import {
  buildLogoRaster,
  buildReceiptFileName,
  buildReceiptPdfBlob,
  downloadBlob,
  renderReceiptPngBlob,
} from '@/lib/receiptOutput';
import useBluetoothPrinter from '@/hooks/useBluetoothPrinter';

const RECEIPT_FONT_FAMILY = "'Courier New', Courier, monospace";
const MM_PER_PX = 25.4 / 96; // 1 px CSS = 1/96 inch
const RECEIPT_PADDING_PX = 8;
const CHAR_WIDTH_RATIO = 0.6; // lebar karakter Courier = 0.6 x font-size
const PREVIEW_ZOOM = { 58: 1.35, 80: 1 };

// Hitung ukuran font agar tepat `chars` karakter muat dalam lebar kertas struk.
const getReceiptTextStyle = (paperWidth, chars) => {
  const widthPx = paperWidth / MM_PER_PX;
  const fontSize = Math.floor((((widthPx - RECEIPT_PADDING_PX * 2) / chars) / CHAR_WIDTH_RATIO) * 10) / 10;

  return {
    width: `${paperWidth}mm`,
    padding: `${RECEIPT_PADDING_PX}px`,
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontFamily: RECEIPT_FONT_FAMILY,
    fontSize: `${fontSize}px`,
    lineHeight: 1.35,
    color: '#000000',
    backgroundColor: '#ffffff',
  };
};

const BUTTON_BASE =
  'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200 active:scale-95 shadow-sm disabled:cursor-not-allowed disabled:opacity-60';

// Gaya pesan status di bawah tombol aksi.
const FEEDBACK_STYLES = {
  error: { box: 'border-red-200 bg-red-50 text-red-700', Icon: FiAlertCircle },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-700', Icon: FiAlertCircle },
  success: { box: 'border-green-200 bg-green-50 text-green-700', Icon: FiCheckCircle },
};

export default function ReceiptModal({ receiptData, onClose }) {
  const [paperWidth, setPaperWidth] = useState(DEFAULT_PAPER_WIDTH);
  const [busyAction, setBusyAction] = useState(null); // 'png' | 'pdf' | 'logo' | null
  const [feedback, setFeedback] = useState(null); // { type, message }
  const [paperHeight, setPaperHeight] = useState(0);
  const [includeLogoOnThermal, setIncludeLogoOnThermal] = useState(true);
  const [logoSize, setLogoSize] = useState(DEFAULT_LOGO_SIZE);

  const paperRef = useRef(null);

  const {
    isSupported: isBluetoothSupported,
    isConnected: isPrinterConnected,
    isBusy: isPrinterBusy,
    deviceName,
    message: printerMessage,
    connect: connectPrinter,
    disconnect: disconnectPrinter,
    printLayout: printViaBluetooth,
  } = useBluetoothPrinter();

  const layout = useMemo(() => buildReceiptLayout(receiptData, { paperWidth }), [receiptData, paperWidth]);
  const printableLines = useMemo(() => toPrintableLines(layout), [layout]);
  const textStyle = useMemo(() => getReceiptTextStyle(paperWidth, layout.chars), [paperWidth, layout.chars]);
  const zoom = PREVIEW_ZOOM[paperWidth] || 1;

  // Logo thermal: lebar bitmap setelah resolusi diturunkan ke lebar head printer.
  const thermalLogoDots = useMemo(
    () => getLogoMaxWidthDots(paperWidth, RECEIPT_LOGO_SIZES[logoSize]?.ratio),
    [paperWidth, logoSize],
  );
  const paperDots = getPaperConfig(paperWidth).dots;
  const isBluetoothBusy = isPrinterBusy || busyAction === 'logo';

  // Tinggi kertas asli dipakai untuk mengimbangi efek zoom pada preview.
  useLayoutEffect(() => {
    const node = paperRef.current;
    if (!node) return undefined;

    const update = () => setPaperHeight(node.offsetHeight);
    update();

    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [layout, paperWidth]);

  // Ukuran halaman cetak. Descriptor CSS `size` hanya menerima satu/dua nilai
  // <length> atau sebuah keyword (jadi "58mm auto" tidak valid dan diabaikan
  // browser), maka tinggi halaman dihitung dari tinggi struk yang sudah terukur
  // (dibulatkan ke atas + 4 mm ruang aman agar tidak tumpah ke halaman kedua).
  const pageHeightMm = paperHeight > 0 ? Math.ceil(paperHeight * MM_PER_PX) + 4 : 0;

  const printPageStyle = useMemo(
    () => `
      @page { size: ${paperWidth}mm ${pageHeightMm > 0 ? `${pageHeightMm}mm` : 'auto'}; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .receipt-paper { box-shadow: none !important; border-radius: 0 !important; margin: 0 !important; }
    `,
    [paperWidth, pageHeightMm],
  );

  // Cetak via dialog browser: ukuran kertas struk, margin 0, selalu putih.
  const handlePrint = useReactToPrint({
    contentRef: paperRef,
    documentTitle: `Struk-${receiptData?.transaction_id || 'Transaksi'}`,
    pageStyle: printPageStyle,
    onAfterPrint: () => setFeedback({ type: 'success', message: 'Perintah cetak sudah dikirim ke printer.' }),
    onPrintError: (location, error) =>
      setFeedback({ type: 'error', message: `Gagal mencetak (${location}): ${error.message}` }),
  });

  const handleDownloadPng = useCallback(async () => {
    setBusyAction('png');
    setFeedback(null);

    try {
      const blob = await renderReceiptPngBlob(layout, {
        logoUrl: receiptData?.store?.logo_url,
        scale: 3,
      });
      downloadBlob(blob, buildReceiptFileName(receiptData, 'png'));
      setFeedback({ type: 'success', message: 'Gambar struk (PNG) berhasil diunduh.' });
    } catch (error) {
      setFeedback({ type: 'error', message: `Gagal mengunduh PNG: ${error.message}` });
    } finally {
      setBusyAction(null);
    }
  }, [layout, receiptData]);

  const handleDownloadPdf = useCallback(() => {
    setBusyAction('pdf');
    setFeedback(null);

    try {
      const blob = buildReceiptPdfBlob(layout);
      downloadBlob(blob, buildReceiptFileName(receiptData, 'pdf'));
      setFeedback({ type: 'success', message: 'Struk PDF berhasil diunduh.' });
    } catch (error) {
      setFeedback({ type: 'error', message: `Gagal mengunduh PDF: ${error.message}` });
    } finally {
      setBusyAction(null);
    }
  }, [layout, receiptData]);

  const handleCopyText = useCallback(async () => {
    setFeedback(null);

    try {
      await navigator.clipboard.writeText(layoutToPlainText(layout));
      setFeedback({ type: 'success', message: 'Teks struk disalin ke clipboard.' });
    } catch {
      setFeedback({ type: 'error', message: 'Gagal menyalin teks struk. Izinkan akses clipboard di browser.' });
    }
  }, [layout]);

  const handleBluetoothPrint = useCallback(async () => {
    setFeedback(null);

    const logoUrl = receiptData?.store?.logo_url;
    const wantsLogo = includeLogoOnThermal && Boolean(logoUrl);

    try {
      // Dialog pilih printer wajib dibuka dari gesture user, jadi koneksi
      // dilakukan lebih dulu sebelum logo diolah (proses gambar butuh waktu).
      if (wantsLogo && !isPrinterConnected) {
        await connectPrinter();
      }

      let logo = null;
      let logoFailed = false;

      if (wantsLogo) {
        setBusyAction('logo');
        logo = await buildLogoRaster(logoUrl, {
          paperWidth,
          widthRatio: RECEIPT_LOGO_SIZES[logoSize]?.ratio,
        });
        logoFailed = !logo;
        setBusyAction(null);
      }

      await printViaBluetooth(layout, { cut: true, logo });

      if (logoFailed) {
        setFeedback({
          type: 'warning',
          message:
            'Struk terkirim tanpa logo: gambar logo tidak bisa dibaca browser (biasanya karena CORS bucket Supabase belum aktif).',
        });
      } else {
        setFeedback({
          type: 'success',
          message: logo
            ? `Struk + logo hitam-putih (${logo.widthDots} dot) berhasil dikirim ke printer Bluetooth.`
            : 'Struk berhasil dikirim ke printer Bluetooth.',
        });
      }
    } catch (error) {
      setBusyAction(null);
      setFeedback({ type: 'error', message: error.message || 'Gagal mencetak lewat Bluetooth.' });
    }
  }, [
    connectPrinter,
    includeLogoOnThermal,
    isPrinterConnected,
    layout,
    logoSize,
    paperWidth,
    printViaBluetooth,
    receiptData,
  ]);

  if (!receiptData) return null;

  const store = receiptData.store || {};
  const feedbackStyle = feedback ? FEEDBACK_STYLES[feedback.type] || FEEDBACK_STYLES.success : null;
  const FeedbackIcon = feedbackStyle?.Icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 bg-blue-600 px-4 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <FiCheckCircle className="h-5 w-5" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold leading-tight">Transaksi Berhasil</h2>
              <p className="text-xs text-blue-100">Struk siap dicetak atau diunduh</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 transition-colors hover:bg-blue-700"
          >
            <FiX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Pilih ukuran kertas struk */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Ukuran kertas</span>
          <div className="flex gap-2">
            {Object.values(RECEIPT_PAPER_SIZES).map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => setPaperWidth(size.value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  paperWidth === size.value
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview struk: selalu putih, lebar sesuai kertas struk */}
        <div className="flex-1 overflow-y-auto bg-gray-200 p-4">
          <div style={paperHeight ? { height: `${Math.round(paperHeight * zoom)}px` } : undefined}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
              <div ref={paperRef} className="receipt-paper mx-auto shadow-xl" style={textStyle}>
                {store.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- logo dari Supabase Storage, dipakai apa adanya agar bisa dicetak */
                  <img
                    src={store.logo_url}
                    alt="Logo toko"
                    style={{
                      display: 'block',
                      margin: '0 auto 8px',
                      maxHeight: '60px',
                      maxWidth: '60%',
                      objectFit: 'contain',
                    }}
                  />
                ) : null}
                {printableLines.map((line, index) => (
                  <span
                    key={`${index}-${line.raw}`}
                    style={{ display: 'block', whiteSpace: 'pre', fontWeight: line.bold ? 700 : 400 }}
                  >
                    {line.text || ' '}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Aksi cetak & unduh */}
        <div className="shrink-0 border-t border-gray-200 bg-white p-4">
          {!isBluetoothSupported && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700">
              <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                Browser ini belum mendukung Web Bluetooth. Pakai Chrome/Edge (Android/PC) lewat HTTPS, atau tekan
                <strong> Salin Teks </strong> lalu cetak dari aplikasi RawBT untuk printer Bluetooth Classic.
              </p>
            </div>
          )}

          {isBluetoothSupported && printerMessage && (
            <p
              className={`mb-3 flex items-start gap-2 text-xs ${
                feedback?.type === 'error' ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              <FiBluetooth className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{printerMessage}</span>
            </p>
          )}

          {feedback && feedbackStyle && (
            <div className={`mb-3 flex items-start gap-2 rounded-lg border p-2.5 text-xs ${feedbackStyle.box}`}>
              <FeedbackIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{feedback.message}</span>
            </div>
          )}

          {store.logo_url && (
            <div className="mb-3 rounded-lg border border-indigo-100 bg-indigo-50/60 p-2.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={includeLogoOnThermal}
                  onChange={(event) => setIncludeLogoOnThermal(event.target.checked)}
                  className="h-4 w-4 accent-indigo-600"
                />
                Cetak logo toko hitam-putih (Bluetooth)
              </label>

              {includeLogoOnThermal && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Ukuran logo</span>
                  <div className="flex gap-1.5">
                    {Object.entries(RECEIPT_LOGO_SIZES).map(([key, size]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setLogoSize(key)}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                          logoSize === key
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-2 text-[10px] leading-snug text-gray-500">
                Logo dikonversi ke bitmap hitam-putih beresolusi rendah (± {thermalLogoDots} dot dari {paperDots} dot
                lebar kertas), jadi bisa dicetak printer thermal.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handlePrint()}
              className={`${BUTTON_BASE} bg-gray-900 text-white hover:bg-gray-800`}
            >
              <FiPrinter className="h-4 w-4" aria-hidden="true" />
              Cetak Struk
            </button>

            <button
              type="button"
              onClick={handleBluetoothPrint}
              disabled={isBluetoothBusy}
              className={`${BUTTON_BASE} bg-indigo-600 text-white hover:bg-indigo-700`}
            >
              {isBluetoothBusy ? (
                <FiLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FiBluetooth className="h-4 w-4" aria-hidden="true" />
              )}
              {isPrinterConnected ? 'Cetak Bluetooth' : 'Printer Bluetooth'}
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={busyAction !== null}
              className={`${BUTTON_BASE} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
            >
              {busyAction === 'png' ? (
                <FiLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FiImage className="h-4 w-4" aria-hidden="true" />
              )}
              Unduh PNG
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={busyAction !== null}
              className={`${BUTTON_BASE} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
            >
              {busyAction === 'pdf' ? (
                <FiLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FiFileText className="h-4 w-4" aria-hidden="true" />
              )}
              Unduh PDF
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className={`${BUTTON_BASE} col-span-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
            >
              <FiCopy className="h-4 w-4" aria-hidden="true" />
              Salin Teks Struk
            </button>

            {isPrinterConnected && (
              <button
                type="button"
                onClick={disconnectPrinter}
                className={`${BUTTON_BASE} col-span-2 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100`}
              >
                <FiX className="h-4 w-4" aria-hidden="true" />
                Putuskan Printer{deviceName ? ` (${deviceName})` : ''}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`${BUTTON_BASE} mt-2 w-full bg-blue-600 px-4 py-3 text-sm text-white hover:bg-blue-700`}
          >
            <FiCheck className="h-4 w-4" aria-hidden="true" />
            Selesai
          </button>

          <p className="mt-2 text-center text-[10px] leading-snug text-gray-400">
            Cetak Struk & Unduh PNG memakai logo berwarna. Cetak Bluetooth memakai logo hitam-putih beresolusi
            rendah, sedangkan PDF masih versi teks saja (tanpa logo).
          </p>
        </div>
      </div>
    </div>
  );
}

