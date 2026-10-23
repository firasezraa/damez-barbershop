'use client';

import React, { useState } from 'react';
import type { AdminBookingItem, CompleteBookingParams } from '@/lib/admin/types.ts';
import { X, CheckCircle2, DollarSign, QrCode, Banknote, CreditCard } from 'lucide-react';

interface CashierCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: AdminBookingItem | null;
  onConfirm: (params: CompleteBookingParams) => Promise<boolean>;
}

export function CashierCheckoutModal({
  isOpen,
  onClose,
  booking,
  onConfirm
}: CashierCheckoutModalProps) {
  const [method, setMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !booking) return null;

  const totalServicePrice = booking.total_price_idr;
  const downPayment = booking.down_payment_idr;
  const remainingDue = booking.remaining_balance_idr;

  // Set default cash received to remaining due on first render/selection
  const effectiveCashReceived = cashReceived > 0 ? cashReceived : remainingDue;
  const changeAmount = Math.max(0, effectiveCashReceived - remainingDue);

  const setPresetCash = (amount: number) => {
    setCashReceived(amount);
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (method === 'cash' && effectiveCashReceived < remainingDue) {
      setErrorMsg(`Uang diterima kurang Rp ${(remainingDue - effectiveCashReceived).toLocaleString('id-ID')}`);
      return;
    }

    setLoading(true);
    try {
      const success = await onConfirm({
        booking_id: booking.id,
        settlement_method: method,
        cash_amount_received: method === 'cash' ? effectiveCashReceived : remainingDue,
        notes: notes.trim() || undefined
      });

      if (success) {
        onClose();
      } else {
        setErrorMsg('Gagal menyelesaikan transaksi. Silakan coba lagi.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan transaksi kasir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1A1A1A] border border-[#10B981]/50 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="bg-[#121212] px-5 py-4 border-b border-[#2E2E2E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#10B981]/20 text-[#10B981] rounded-md">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#F5F5F0] text-base">
                Selesaikan Layanan & Kasir
              </h3>
              <p className="text-xs text-[#A8A29E]">
                {booking.booking_code} • {booking.customer_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A8A29E] hover:text-[#F5F5F0] p-1 rounded-md hover:bg-[#2E2E2E] transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFinalize} className="p-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md">
              {errorMsg}
            </div>
          )}

          {/* Rincian Layanan & Perhitungan Otomatis */}
          <div className="bg-[#121212] p-4 rounded-lg border border-[#2E2E2E] flex flex-col gap-2">
            <div className="flex justify-between text-xs text-[#A8A29E]">
              <span>Kursi & Barber</span>
              <span className="text-[#F5F5F0] font-medium">
                Kursi {booking.barber_chair} • {booking.barber_name}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[#A8A29E]">
              <span>Layanan</span>
              <span className="text-[#F5F5F0] font-medium text-right">
                {booking.service_names.join(', ')}
              </span>
            </div>
            <div className="h-px bg-[#2E2E2E] my-1" />
            <div className="flex justify-between text-xs">
              <span className="text-[#A8A29E]">Total Biaya Layanan</span>
              <span className="text-[#F5F5F0] font-mono font-medium">
                Rp {totalServicePrice.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#34D399]">
                Potongan DP Online {booking.booking_type === 'online' ? '(Lunas Web)' : '(Walk-in)'}
              </span>
              <span className="text-[#34D399] font-mono font-medium">
                - Rp {downPayment.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="h-px bg-[#2E2E2E] my-1" />
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs uppercase font-bold tracking-wider text-[#A8A29E]">
                Sisa Wajib Bayar
              </span>
              <span className="text-xl font-bold font-mono text-[#D97706]">
                Rp {remainingDue.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Pilihan Metode Pembayaran Kasir */}
          <div>
            <label className="block text-xs font-medium text-[#A8A29E] mb-1.5">
              Pilih Metode Pelunasan di Meja Kasir
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  method === 'cash'
                    ? 'border-[#10B981] bg-[#10B981]/15 text-[#10B981]'
                    : 'border-[#2E2E2E] bg-[#121212] text-[#A8A29E]'
                }`}
              >
                <Banknote className="size-4" />
                <span className="text-xs font-semibold">Tunai (Cash)</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('qris')}
                className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  method === 'qris'
                    ? 'border-[#D97706] bg-[#D97706]/15 text-[#D97706]'
                    : 'border-[#2E2E2E] bg-[#121212] text-[#A8A29E]'
                }`}
              >
                <QrCode className="size-4" />
                <span className="text-xs font-semibold">QRIS Toko</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('transfer')}
                className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  method === 'transfer'
                    ? 'border-[#3B82F6] bg-[#3B82F6]/15 text-[#60A5FA]'
                    : 'border-[#2E2E2E] bg-[#121212] text-[#A8A29E]'
                }`}
              >
                <CreditCard className="size-4" />
                <span className="text-xs font-semibold">Transfer</span>
              </button>
            </div>
          </div>

          {/* Form Pembayaran Tunai: Kalkulator Kembalian */}
          {method === 'cash' && (
            <div className="bg-[#121212] p-3.5 rounded-lg border border-[#2E2E2E] flex flex-col gap-2.5">
              <label className="text-xs font-medium text-[#A8A29E]">
                Nominal Uang Fisik Diterima
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPresetCash(remainingDue)}
                  className="px-2.5 py-1 bg-[#242424] hover:bg-[#2C2C2C] text-[#F5F5F0] rounded text-xs"
                >
                  Uang Pas (Rp {remainingDue.toLocaleString('id-ID')})
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCash(50000)}
                  className="px-2.5 py-1 bg-[#242424] hover:bg-[#2C2C2C] text-[#F5F5F0] rounded text-xs"
                >
                  50.000
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCash(100000)}
                  className="px-2.5 py-1 bg-[#242424] hover:bg-[#2C2C2C] text-[#F5F5F0] rounded text-xs"
                >
                  100.000
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCash(150000)}
                  className="px-2.5 py-1 bg-[#242424] hover:bg-[#2C2C2C] text-[#F5F5F0] rounded text-xs"
                >
                  150.000
                </button>
              </div>

              <input
                type="number"
                value={effectiveCashReceived}
                onChange={(e) => setCashReceived(Number(e.target.value))}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] focus:border-[#10B981] rounded-md px-3 py-2 text-sm font-mono text-[#F5F5F0] outline-none"
                placeholder="Jumlah Uang Diterima"
                required
              />

              <div className="flex justify-between items-center pt-1 border-t border-[#242424]">
                <span className="text-xs text-[#A8A29E]">Uang Kembalian:</span>
                <span className={`text-base font-bold font-mono ${
                  changeAmount > 0 ? 'text-[#34D399]' : 'text-[#78716C]'
                }`}>
                  Rp {changeAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Catatan Pembayaran QRIS / Info */}
          {method === 'qris' && (
            <div className="bg-[#2A1D0D]/40 p-3 rounded-lg border border-[#D97706]/40 text-xs text-[#FBBF24]">
              Arahkan tamu memindai QRIS akrilik meja kasir senilai{' '}
              <strong className="text-[#F5F5F0]">Rp {remainingDue.toLocaleString('id-ID')}</strong>.
              Pastikan notifikasi berhasil muncul di ponsel tamu sebelum finalisasi.
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-[#242424] hover:bg-[#2C2C2C] text-[#F5F5F0] rounded-lg text-sm font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 py-2.5 px-4 bg-[#10B981] hover:bg-[#059669] text-[#121212] font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Selesaikan & Tutup Tiket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
