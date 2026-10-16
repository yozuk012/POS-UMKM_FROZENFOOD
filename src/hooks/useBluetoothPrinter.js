'use client';

// src/hooks/useBluetoothPrinter.js
//
// Cetak struk ke printer thermal Bluetooth langsung dari browser
// memakai Web Bluetooth API + perintah ESC/POS.
//
// Catatan penting:
// - Hanya berjalan di browser berbasis Chromium (Chrome/Edge) dan WAJIB
//   lewat HTTPS atau localhost (Web Bluetooth tidak jalan di HTTP biasa).
// - Web Bluetooth hanya bisa menjangkau printer BLE (Bluetooth Low Energy).
//   Printer Bluetooth Classic (SPP) tidak terdeteksi browser; untuk tipe itu
//   gunakan tombol "Salin Teks" lalu cetak lewat aplikasi RawBT.

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildReceiptEscPos } from '@/lib/receiptLayout';

// Service UUID printer thermal BLE yang paling umum di pasaran.
export const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000ff80-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
];

const WRITE_CHUNK_SIZE = 20; // aman untuk MTU default BLE (23 byte)
const WRITE_DELAY_MS = 12;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const findWritableCharacteristic = async (server) => {
  const services = await server.getPrimaryServices();

  for (const service of services) {
    const characteristics = await service.getCharacteristics();

    for (const characteristic of characteristics) {
      const properties = characteristic.properties || {};
      if (properties.write || properties.writeWithoutResponse) {
        return characteristic;
      }
    }
  }

  return null;
};

const writeInChunks = async (characteristic, data) => {
  const properties = characteristic.properties || {};
  const useNoResponse =
    Boolean(properties.writeWithoutResponse) && typeof characteristic.writeValueWithoutResponse === 'function';

  for (let offset = 0; offset < data.length; offset += WRITE_CHUNK_SIZE) {
    const chunk = data.slice(offset, offset + WRITE_CHUNK_SIZE);

    if (useNoResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }

    await sleep(WRITE_DELAY_MS);
  }
};

export default function useBluetoothPrinter() {
  // Nilai awal dihitung sekali (lazy init) supaya tidak perlu setState di dalam effect.
  const [isSupported] = useState(() => typeof window !== 'undefined' && Boolean(navigator.bluetooth));
  const [isSecure] = useState(() => typeof window === 'undefined' || window.isSecureContext !== false);
  const [status, setStatus] = useState('idle'); // idle | connecting | connected | printing | error
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [message, setMessage] = useState('');

  const deviceRef = useRef(null);
  const characteristicRef = useRef(null);

  const handleDisconnected = useCallback(() => {
    characteristicRef.current = null;
    deviceRef.current = null;
    setIsConnected(false);
    setDeviceName('');
    setStatus('idle');
    setMessage('Koneksi printer terputus.');
  }, []);

  const disconnect = useCallback(() => {
    const device = deviceRef.current;

    try {
      device?.removeEventListener?.('gattserverdisconnected', handleDisconnected);
      if (device?.gatt?.connected) device.gatt.disconnect();
    } catch {
      // abaikan: printer mungkin sudah tidak aktif
    }

    characteristicRef.current = null;
    deviceRef.current = null;
    setIsConnected(false);
    setDeviceName('');
    setStatus('idle');
    setMessage('');
  }, [handleDisconnected]);

  // Putuskan koneksi saat modal ditutup / komponen dilepas.
  useEffect(
    () => () => {
      const device = deviceRef.current;
      try {
        device?.removeEventListener?.('gattserverdisconnected', handleDisconnected);
        if (device?.gatt?.connected) device.gatt.disconnect();
      } catch {
        // abaikan
      }
    },
    [handleDisconnected],
  );

  const connect = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.bluetooth) {
      throw new Error('Browser ini tidak mendukung Web Bluetooth. Gunakan Chrome/Edge terbaru.');
    }

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      throw new Error('Web Bluetooth hanya bisa dipakai lewat HTTPS atau localhost.');
    }

    setStatus('connecting');
    setMessage('Mencari printer Bluetooth...');

    let device;
    try {
      device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS,
      });
    } catch (error) {
      setStatus('idle');
      setMessage('');
      if (error?.name === 'NotFoundError') {
        throw new Error('Tidak ada printer yang dipilih.');
      }
      throw error;
    }

    deviceRef.current = device;
    setDeviceName(device.name || 'Printer Bluetooth');
    device.addEventListener('gattserverdisconnected', handleDisconnected);

    setMessage('Menghubungkan ke printer...');

    // Dipakai agar pesan error yang lebih spesifik tidak ditimpa di blok catch.
    let handledMessage = '';

    try {
      const server = await device.gatt.connect();
      const characteristic = await findWritableCharacteristic(server);

      if (!characteristic) {
        server.disconnect();
        deviceRef.current = null;
        setIsConnected(false);
        handledMessage = 'Printer terhubung, tapi tidak punya channel tulis (writable characteristic) ESC/POS.';
        setStatus('error');
        setMessage(handledMessage);
        throw new Error('Printer ini tidak mendukung mode cetak ESC/POS lewat Bluetooth Low Energy.');
      }

      characteristicRef.current = characteristic;
      setIsConnected(true);
      setStatus('connected');
      setMessage(`Terhubung ke ${device.name || 'printer'}.`);

      return device;
    } catch (error) {
      characteristicRef.current = null;
      setIsConnected(false);
      if (!handledMessage) {
        setStatus('error');
        setMessage(`Gagal menghubungkan printer: ${error.message}`);
      }
      throw error;
    }
  }, [handleDisconnected]);

  /**
   * Cetak struk hasil buildReceiptLayout().
   * Kalau printer belum terhubung, otomatis minta pilih printer dulu.
   * @param {object} [options] diteruskan ke buildReceiptEscPos()
   *   (cut, feedLines, dan logo hasil lib/receiptOutput.buildLogoRaster())
   */
  const printLayout = useCallback(
    async (layout, options = {}) => {
      if (!characteristicRef.current) {
        await connect();
      }

      const characteristic = characteristicRef.current;
      if (!characteristic) {
        throw new Error('Printer belum terhubung.');
      }

      setStatus('printing');
      setMessage('Mengirim data struk ke printer...');

      try {
        const data = buildReceiptEscPos(layout, options);
        await writeInChunks(characteristic, data);
        setIsConnected(true);
        setStatus('connected');
        setMessage('Struk berhasil dikirim ke printer.');
        return true;
      } catch (error) {
        setStatus('error');
        setMessage(`Gagal mengirim struk: ${error.message}`);
        throw error;
      }
    },
    [connect],
  );

  const clearMessage = useCallback(() => setMessage(''), []);

  return {
    isSupported,
    isSecure,
    isConnected,
    isBusy: status === 'connecting' || status === 'printing',
    status,
    deviceName,
    message,
    connect,
    disconnect,
    printLayout,
    clearMessage,
  };
}
