'use client';

import React from 'react';
import type { AdminBarberColumn, AdminCalendarSlot, AdminBookingItem } from '@/lib/admin/types.ts';
import {
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
  Plus,
  Shield,
  UserCheck
} from 'lucide-react';

interface CalendarMatrixViewProps {
  columns: AdminBarberColumn[];
  onStartService: (bookingId: string) => void;
  onOpenCheckout: (booking: AdminBookingItem) => void;
  onOpenNoShow: (booking: AdminBookingItem) => void;
  onOpenWalkInForSlot: (barberId: string, time: string) => void;
  onOpenBlockSlot: (barberId: string, time: string) => void;
}

export function CalendarMatrixView({
  columns,
  onStartService,
  onOpenCheckout,
  onOpenNoShow,
  onOpenWalkInForSlot,
  onOpenBlockSlot
}: CalendarMatrixViewProps) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl overflow-hidden shadow-xl">
      {/* 3 Column Barber Headers */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#2E2E2E] bg-[#161616] border-b border-[#2E2E2E]">
        {columns.map((col) => (
          <div key={col.id} className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/30">
                Kursi {col.chair_number}
              </span>
              {col.is_off_today ? (
                <span className="text-[11px] font-medium text-[#F87171] bg-red-950/40 px-2 py-0.5 rounded border border-red-900/50">
                  Libur Rutin
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-[#34D399]">
                  <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Kursi Beroperasi
                </span>
              )}
            </div>

            <div className="mt-2">
              <h4 className="font-bold text-base text-[#F5F5F0]">{col.name}</h4>
              <p className="text-xs text-[#A8A29E]">{col.specialty}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Matriks Slot Waktu */}
      <div className="divide-y divide-[#2E2E2E]">
        {columns[0]?.slots.map((_, slotIdx) => {
          const currentHour = columns[0].slots[slotIdx].slot_time;

          return (
            <div
              key={currentHour}
              className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#2E2E2E] hover:bg-[#1E1E1E]/40 transition-colors"
            >
              {columns.map((col) => {
                const slot = col.slots[slotIdx];
                return (
                  <div key={`${col.id}-${currentHour}`} className="p-3 min-h-[110px] flex flex-col justify-between">
                    {/* Time Label on top-left of each slot */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold text-[#78716C]">
                        {slot.slot_time} WIB
                      </span>
                      {slot.booking && (
                        <span className="text-[10px] font-mono text-[#A8A29E]">
                          {slot.booking.service_duration_minutes}m (+10m)
                        </span>
                      )}
                    </div>

                    {/* Render Slot Card Berdasarkan Status */}
                    {renderSlotCard(
                      slot,
                      col,
                      onStartService,
                      onOpenCheckout,
                      onOpenNoShow,
                      onOpenWalkInForSlot,
                      onOpenBlockSlot
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderSlotCard(
  slot: AdminCalendarSlot,
  column: AdminBarberColumn,
  onStartService: (bookingId: string) => void,
  onOpenCheckout: (booking: AdminBookingItem) => void,
  onOpenNoShow: (booking: AdminBookingItem) => void,
  onOpenWalkInForSlot: (barberId: string, time: string) => void,
  onOpenBlockSlot: (barberId: string, time: string) => void
) {
  const booking = slot.booking;

  // 1. Slot Diblokir (Istirahat / Libur / Perawatan)
  if (slot.status === 'blocked') {
    return (
      <div className="h-full rounded-lg border border-[#2E2E2E] bg-[repeating-linear-gradient(45deg,#161616,#161616_8px,#202020_8px,#202020_16px)] p-2.5 flex flex-col justify-center items-center text-center">
        <Shield className="size-4 text-[#78716C] mb-1" />
        <span className="text-[11px] font-bold text-[#A8A29E] tracking-wide uppercase">
          {slot.block_title || 'DIBLOKIR'}
        </span>
        <span className="text-[10px] text-[#78716C] truncate max-w-[200px]">
          {slot.block_reason || 'Jeda Istirahat / Kursi Tutup'}
        </span>
      </div>
    );
  }

  // 2. Slot Kosong (Siap Diisi / Walk-in)
  if (slot.status === 'empty' || !booking) {
    return (
      <div className="h-full rounded-lg border border-dashed border-[#2E2E2E] hover:border-[#D97706]/50 bg-[#121212]/50 hover:bg-[#2A1D0D]/20 p-2.5 flex items-center justify-between transition-all group">
        <div className="flex items-center gap-1.5 text-xs text-[#78716C] group-hover:text-[#D97706]">
          <Clock className="size-3.5" />
          <span>Slot Kosong</span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onOpenWalkInForSlot(column.id, slot.slot_time)}
            className="px-2 py-1 bg-[#242424] hover:bg-[#D97706] text-[#A8A29E] hover:text-[#121212] rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
            title="Input Tamu Walk-In Cepat"
          >
            <Plus className="size-3" />
            <span>Walk-In</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenBlockSlot(column.id, slot.slot_time)}
            className="px-1.5 py-1 bg-[#242424] hover:bg-[#383838] text-[#78716C] hover:text-[#F5F5F0] rounded text-[11px] transition-colors"
            title="Blokir Jam Ini"
          >
            <Shield className="size-3" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Status: in_progress (Sedang di Kursi)
  if (slot.status === 'in_progress') {
    return (
      <div className="h-full rounded-lg border-2 border-[#3B82F6] bg-gradient-to-br from-[#1E3A8A]/30 to-[#0F172A] p-3 flex flex-col justify-between shadow-md">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1E3A8A] text-[#93C5FD]">
              <span className="size-1.5 rounded-full bg-[#60A5FA] animate-ping" />
              SEDANG DI KURSI
            </span>
            <span className="text-[10px] font-mono text-[#93C5FD]">
              {booking.booking_type === 'walk_in' ? 'Walk-in' : 'Online'}
            </span>
          </div>

          <h5 className="font-bold text-sm text-[#F5F5F0] truncate">
            {booking.customer_name}
          </h5>
          <p className="text-xs text-[#93C5FD] truncate">
            {booking.service_names.join(', ')}
          </p>
        </div>

        <div className="mt-2 pt-2 border-t border-[#1E3A8A]/40 flex items-center justify-between">
          <span className="text-[11px] font-mono font-semibold text-[#93C5FD]">
            Sisa: Rp {booking.remaining_balance_idr.toLocaleString('id-ID')}
          </span>
          <button
            type="button"
            onClick={() => onOpenCheckout(booking)}
            className="px-2.5 py-1 bg-[#10B981] hover:bg-[#059669] text-[#121212] rounded text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
          >
            <CheckCircle className="size-3.5" />
            <span>Kasir / Selesai</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Status: completed (Selesai & Lunas)
  if (slot.status === 'completed') {
    return (
      <div className="h-full rounded-lg border border-[#2E2E2E] bg-[#161616] p-2.5 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#262626] text-[#A8A29E]">
              SELESAI & LUNAS
            </span>
            <span className="text-[10px] uppercase font-mono text-[#78716C]">
              {booking.settlement_method}
            </span>
          </div>
          <h5 className="font-semibold text-xs text-[#A8A29E] truncate">
            {booking.customer_name}
          </h5>
          <p className="text-[11px] text-[#78716C] truncate">
            {booking.service_names.join(', ')}
          </p>
        </div>

        <div className="mt-1 text-right">
          <span className="text-[11px] font-mono text-[#34D399]">
            Rp {booking.total_price_idr.toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    );
  }

  // 5. Status: no_show (Toleransi Habis / DP Hangus)
  if (slot.status === 'no_show') {
    return (
      <div className="h-full rounded-lg border border-[#521313] bg-[#2B0E0E]/40 p-2.5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#450A0A] text-[#F87171]">
              NO-SHOW (DP HANGUS)
            </span>
          </div>
          <h5 className="font-semibold text-xs text-[#F87171] line-through truncate">
            {booking.customer_name}
          </h5>
          <p className="text-[10px] text-[#FCA5A5] truncate">
            Toleransi 15m Habis
          </p>
        </div>
        <div className="text-[10px] text-[#A8A29E] text-right">
          DP Rp 20.000 Masuk Kas
        </div>
      </div>
    );
  }

  // 6. Status: confirmed (Tamu Terjadwal Siap Datang) + Late Warning jika > 10m
  const isLate = booking.is_late_warning;
  const isPastTolerance = booking.is_past_tolerance;

  return (
    <div
      className={`h-full rounded-lg border p-2.5 flex flex-col justify-between transition-all ${
        isPastTolerance
          ? 'border-[#DC2626] bg-[#2B0E0E]/60 animate-pulse'
          : isLate
          ? 'border-[#F59E0B] bg-[#451A03]/50'
          : 'border-[#10B981]/50 bg-[#064E3B]/25'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-1">
          {isPastTolerance ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-800 text-white flex items-center gap-1">
              <AlertTriangle className="size-3" />
              LEWAT 15 MENIT
            </span>
          ) : isLate ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#D97706] text-[#121212] flex items-center gap-1">
              <AlertTriangle className="size-3" />
              TELAT 10 MENIT
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#064E3B] text-[#34D399]">
              🟢 SIAP DATANG (DP LUNAS)
            </span>
          )}
          <span className="text-[10px] font-mono text-[#A8A29E]">
            {booking.booking_code.slice(-6)}
          </span>
        </div>

        <h5 className="font-bold text-xs text-[#F5F5F0] truncate">
          {booking.customer_name}
        </h5>
        <p className="text-[11px] text-[#A8A29E] truncate">
          {booking.service_names.join(', ')}
        </p>
      </div>

      <div className="mt-2 pt-1.5 border-t border-[#2E2E2E] flex items-center justify-between gap-1">
        {/* Tombol Hubungi WhatsApp Tamu */}
        <a
          href={`https://wa.me/${booking.customer_phone.replace(/\D/g, '')}?text=Halo%20Mas%20${encodeURIComponent(
            booking.customer_name
          )},%20jadwal%20potong%20rambut%20di%20Damez%20Barbershop%20bersama%20Mas%20${encodeURIComponent(
            booking.barber_name
          )}%20sudah%20siap.%20Ditunggu%20kehadirannya%20di%20gerai.`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded bg-[#242424] hover:bg-[#25D366] text-[#A8A29E] hover:text-[#121212] transition-colors"
          title="Hubungi WhatsApp Tamu"
        >
          <MessageSquare className="size-3.5" />
        </a>

        <div className="flex gap-1">
          {/* Tombol Darurat No-Show jika terlambat */}
          {(isLate || isPastTolerance) && (
            <button
              type="button"
              onClick={() => onOpenNoShow(booking)}
              className="px-2 py-1 bg-[#450A0A] hover:bg-[#DC2626] text-[#FCA5A5] hover:text-white rounded text-[10px] font-semibold transition-colors"
              title="Tandai No-Show (DP Hangus)"
            >
              No-Show
            </button>
          )}

          {/* Tombol Mulai Cukur */}
          <button
            type="button"
            onClick={() => onStartService(booking.id)}
            className="px-2.5 py-1 bg-[#10B981] hover:bg-[#059669] text-[#121212] rounded text-[11px] font-bold transition-colors flex items-center gap-1 shadow-sm"
          >
            <Play className="size-3 fill-current" />
            <span>Mulai</span>
          </button>
        </div>
      </div>
    </div>
  );
}
