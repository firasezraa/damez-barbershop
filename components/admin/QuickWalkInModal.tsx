'use client';

import React, { useState } from 'react';
import { SEED_BARBERS, SEED_SERVICES } from '@/lib/slots/service.ts';
import { OPERATING_SLOT_HOURS } from '@/lib/admin/service.ts';
import { getJakartaTimeString } from '@/lib/utils/timezone.ts';
import type { QuickWalkInParams } from '@/lib/admin/types.ts';
import { X, UserPlus, Clock, CheckCircle } from 'lucide-react';

interface QuickWalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: QuickWalkInParams) => Promise<boolean>;
  initialBarberId?: string;
  initialTime?: string;
}

export function QuickWalkInModal({
  isOpen,
  onClose,
  onSubmit,
  initialBarberId,
  initialTime
}: QuickWalkInModalProps) {
  const [customerName, setCustomerName] = useState('Tamu Walk-In');
  const [customerPhone, setCustomerPhone] = useState('');
  const [barberId, setBarberId] = useState(
    initialBarberId || SEED_BARBERS[0]?.id || ''
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([
    'a0000001-0000-0000-0000-000000000001' // Gentlemen Classic Haircut
  ]);
  const [startTime, setStartTime] = useState(initialTime || '11:00');
  const [actionMode, setActionMode] = useState<'start_now' | 'queue_wait'>('start_now');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const toggleService = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      if (selectedServiceIds.length > 1) {
        setSelectedServiceIds(selectedServiceIds.filter((s) => s !== id));
      }
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
    }
  };

  // Hitung total durasi & estimasi harga
  let totalMinutes = 0;
  let totalPrice = 0;
  selectedServiceIds.forEach((id) => {
    const srv = SEED_SERVICES[id];
    if (srv) {
      totalMinutes += srv.duration_minutes;
      totalPrice += srv.price_idr;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const success = await onSubmit({
        customer_name: customerName.trim() || 'Tamu Walk-In',
        customer_phone: customerPhone.trim() || undefined,
        barber_id: barberId,
        service_ids: selectedServiceIds,
        start_time: startTime,
        action_mode: actionMode,
        notes: notes.trim() || undefined
      });

      if (success) {
        onClose();
      } else {
        setErrorMsg('Gagal mendaftarkan tamu walk-in. Silakan coba lagi.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#1A1A1A] border border-[#D97706]/40 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="bg-[#242424] px-5 py-4 border-b border-[#2E2E2E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#D97706]/20 text-[#D97706] rounded-md">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#F5F5F0] text-base">
                Input Tamu Walk-In Cepat
              </h3>
              <p className="text-xs text-[#A8A29E]">
                Durasi isi &lt; 15 detik • Kunci kursi langsung di web
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md">
              {errorMsg}
            </div>
          )}

          {/* 1. Nama Tamu & Nomor WA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A8A29E] mb-1">
                Nama Tamu (Panggilan)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="cth: Mas Doni"
                className="w-full bg-[#121212] border border-[#2E2E2E] focus:border-[#D97706] rounded-md px-3 py-2 text-sm text-[#F5F5F0] outline-none"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A8A29E] mb-1">
                No. WhatsApp (Opsional)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full bg-[#121212] border border-[#2E2E2E] focus:border-[#D97706] rounded-md px-3 py-2 text-sm text-[#F5F5F0] outline-none"
              />
            </div>
          </div>

          {/* 2. Pilih Master Barber */}
          <div>
            <label className="block text-xs font-medium text-[#A8A29E] mb-1.5">
              Pilih Kursi & Master Barber
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SEED_BARBERS.map((b) => {
                const isSelected = barberId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBarberId(b.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-[#D97706] bg-[#D97706]/15 text-[#F5F5F0]'
                        : 'border-[#2E2E2E] bg-[#121212] text-[#A8A29E] hover:border-[#383838]'
                    }`}
                  >
                    <div className="text-[11px] font-semibold text-[#D97706]">
                      Kursi {b.chair_number}
                    </div>
                    <div className="text-xs font-bold truncate text-[#F5F5F0]">
                      {b.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-[#78716C] truncate">
                      {b.name.includes('Rian')
                        ? 'The Sculptor'
                        : b.name.includes('Dimas')
                        ? 'Fade Master'
                        : 'Royal Groomer'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Pilih Layanan */}
          <div>
            <label className="block text-xs font-medium text-[#A8A29E] mb-1.5">
              Pilih Paket Layanan (Bisa Lebih Dari Satu)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {Object.entries(SEED_SERVICES).map(([sId, srv]) => {
                const isChecked = selectedServiceIds.includes(sId);
                return (
                  <div
                    key={sId}
                    onClick={() => toggleService(sId)}
                    className={`flex items-center justify-between p-2 rounded-md border cursor-pointer text-xs transition-colors ${
                      isChecked
                        ? 'border-[#D97706] bg-[#2A1D0D] text-[#F5F5F0]'
                        : 'border-[#2E2E2E] bg-[#121212] text-[#A8A29E] hover:border-[#383838]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium truncate">{srv.name}</div>
                      <div className="text-[10px] text-[#78716C]">
                        {srv.duration_minutes} mnt • Rp {srv.price_idr.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                      isChecked ? 'bg-[#D97706] border-[#D97706] text-[#121212]' : 'border-[#444]'
                    }`}>
                      {isChecked && <CheckCircle className="size-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Jam Mulai & Mode Aksi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-[#A8A29E] mb-1">
                Jam Mulai Sesi
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
                Alur Tindakan Kursi
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActionMode('start_now')}
                  className={`py-2 px-1 text-center rounded text-xs font-semibold border transition-all ${
                    actionMode === 'start_now'
                      ? 'bg-[#1E3A8A] border-[#3B82F6] text-[#93C5FD]'
                      : 'bg-[#121212] border-[#2E2E2E] text-[#A8A29E]'
                  }`}
                >
                  Langsung Cukur
                </button>
                <button
                  type="button"
                  onClick={() => setActionMode('queue_wait')}
                  className={`py-2 px-1 text-center rounded text-xs font-semibold border transition-all ${
                    actionMode === 'queue_wait'
                      ? 'bg-[#064E3B] border-[#10B981] text-[#6EE7B7]'
                      : 'bg-[#121212] border-[#2E2E2E] text-[#A8A29E]'
                  }`}
                >
                  Antrean Tunggu
                </button>
              </div>
            </div>
          </div>

          {/* Rangkuman Biaya & Durasi */}
          <div className="bg-[#121212] p-3 rounded-lg border border-[#2E2E2E] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#A8A29E]">
              <Clock className="size-4 text-[#D97706]" />
              <span>Total: {totalMinutes} Menit (+10m jeda)</span>
            </div>
            <div>
              <span className="text-[#A8A29E]">Tagihan Kasir: </span>
              <span className="font-bold text-sm text-[#D97706]">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-[#78716C] ml-1">(DP: Rp 0)</span>
            </div>
          </div>

          {/* Tombol Aksi Final */}
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
              className="flex-2 py-2.5 px-4 bg-[#D97706] hover:bg-[#F59E0B] text-[#121212] font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  <span>Kunci Kursi & Mulai Layanan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
