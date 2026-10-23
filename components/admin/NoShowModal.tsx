'use client';

import React, { useState } from 'react';
import type { AdminBookingItem, MarkNoShowParams } from '@/lib/admin/types.ts';
import { X, AlertTriangle, AlertOctagon } from 'lucide-react';

interface NoShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: AdminBookingItem | null;
  onConfirm: (params: MarkNoShowParams) => Promise<boolean>;
}

export function NoShowModal({
  isOpen,
  onClose,
  booking,
  onConfirm
}: NoShowModalProps) {
  const [reason, setReason] = useState(
    'Toleransi kedatangan 15 menit habis (No-Show). Uang muka DP Rp 20.000 hangus.'
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !booking) return null;

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const success = await onConfirm({
        booking_id: booking.id,
        reason: reason.trim()
      });

      if (success) {
        onClose();
      } else {
        setErrorMsg('Gagal menandai no-show. Silakan coba lagi.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1A1A1A] border border-[#DC2626]/60 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#2B0E0E] px-5 py-4 border-b border-[#521313] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#DC2626]/20 text-[#DC2626] rounded-md">
              <AlertOctagon className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#F5F5F0] text-base">
                Lepas Kursi & Tandai No-Show
              </h3>
              <p className="text-xs text-[#FCA5A5]">
                Toleransi 15 Menit Habis • DP Hangus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A8A29E] hover:text-[#F5F5F0] p-1 rounded-md hover:bg-[#3E1515] transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleExecute} className="p-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-red-950 border border-red-800 text-red-200 text-xs rounded-md">
              {errorMsg}
            </div>
          )}

          {/* Konfirmasi Peringatan */}
          <div className="bg-[#241212] p-4 rounded-lg border border-[#521A1A] flex items-start gap-3">
            <AlertTriangle className="size-5 text-[#EF4444] shrink-0 mt-0.5" />
            <div className="text-xs text-[#FCA5A5] leading-relaxed">
              Tamu atas nama <strong className="text-[#F5F5F0]">{booking.customer_name}</strong>{' '}
              ({booking.booking_code}) pada jadwal jam{' '}
              <strong className="text-[#F5F5F0]">{booking.start_time} WIB</strong> (Kursi{' '}
              {booking.barber_chair} - {booking.barber_name}) belum hadir lebih dari 15 menit.
              <p className="mt-2 text-[#F87171] font-semibold">
                Sesuai Aturan Emas Gerai: Uang Muka DP Rp 20.000 dinyatakan HANGUS sebagai kompensasi toko dan barber. Kursi akan langsung dilepas untuk tamu antrean lain.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A8A29E] mb-1">
              Catatan Pembatalan / Alasan
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#121212] border border-[#2E2E2E] focus:border-[#DC2626] rounded-md px-3 py-2 text-xs text-[#F5F5F0] outline-none"
            />
          </div>

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
              className="flex-2 py-2.5 px-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <AlertOctagon className="size-4" />
                  <span>Ya, Lepaskan Kursi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
