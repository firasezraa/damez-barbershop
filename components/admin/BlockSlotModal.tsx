'use client';

import React, { useState } from 'react';
import { SEED_BARBERS } from '@/lib/slots/service.ts';
import { OPERATING_SLOT_HOURS } from '@/lib/admin/service.ts';
import type { CreateBlockSlotParams } from '@/lib/admin/types.ts';
import { X, ShieldAlert, Clock } from 'lucide-react';

interface BlockSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: CreateBlockSlotParams) => Promise<boolean>;
  initialBarberId?: string;
  initialTime?: string;
}

export function BlockSlotModal({
  isOpen,
  onClose,
  onConfirm,
  initialBarberId,
  initialTime
}: BlockSlotModalProps) {
  const [barberId, setBarberId] = useState(initialBarberId || '');
  const [startTime, setStartTime] = useState(initialTime || '14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [title, setTitle] = useState('Istirahat Tambahan');
  const [reason, setReason] = useState('Keperluan mendesak gerai / istirahat');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const success = await onConfirm({
        barber_id: barberId ? barberId : null,
        start_time: startTime,
        end_time: endTime,
        title,
        reason,
        slot_type: 'custom_block'
      });

      if (success) {
        onClose();
      } else {
        setErrorMsg('Gagal memblokir slot kursi.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1A1A1A] border border-[#78716C]/60 rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#242424] px-5 py-4 border-b border-[#2E2E2E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#78716C]/20 text-[#A8A29E] rounded-md">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#F5F5F0] text-base">
                Blokir Kursi / Istirahat Darurat
              </h3>
              <p className="text-xs text-[#A8A29E]">
                Tutup ketersediaan slot di website online
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
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#A8A29E] mb-1">
              Pilih Kursi Barber
            </label>
            <select
              value={barberId}
              onChange={(e) => setBarberId(e.target.value)}
              className="w-full bg-[#121212] border border-[#2E2E2E] rounded-md px-3 py-2 text-sm text-[#F5F5F0] outline-none"
            >
              <option value="">Semua Kursi (Toko Tutup / Acara Khusus)</option>
              {SEED_BARBERS.map((b) => (
                <option key={b.id} value={b.id}>
                  Kursi {b.chair_number} - {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A8A29E] mb-1">
                Jam Mulai
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#121212] border border-[#2E2E2E] rounded-md px-3 py-2 text-sm text-[#F5F5F0] outline-none"
              >
                {OPERATING_SLOT_HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h} WIB
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A8A29E] mb-1">
                Jam Selesai
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#121212] border border-[#2E2E2E] rounded-md px-3 py-2 text-sm text-[#F5F5F0] outline-none"
              >
                {['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(
                  (h) => (
                    <option key={h} value={h}>
                      {h} WIB
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A8A29E] mb-1">
              Alasan Pemblokiran
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="cth: Perawatan Kursi Hidrolik / Izin Sakit"
              className="w-full bg-[#121212] border border-[#2E2E2E] focus:border-[#D97706] rounded-md px-3 py-2 text-sm text-[#F5F5F0] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A8A29E] mb-1">
              Catatan Tambahan
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail kendala..."
              className="w-full bg-[#121212] border border-[#2E2E2E] rounded-md px-3 py-2 text-xs text-[#F5F5F0] outline-none"
            />
          </div>

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
              className="flex-2 py-2.5 px-4 bg-[#454545] hover:bg-[#525252] text-[#F5F5F0] font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? <span>Memproses...</span> : <span>Konfirmasi Blokir Slot</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
