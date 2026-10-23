'use client';

import React, { useState } from 'react';
import type { AdminBookingItem } from '@/lib/admin/types.ts';
import { SEED_BARBERS } from '@/lib/slots/service.ts';
import {
  Search,
  MessageSquare,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  Filter,
  DollarSign
} from 'lucide-react';

interface BookingListViewProps {
  bookings: AdminBookingItem[];
  onStartService: (bookingId: string) => void;
  onOpenCheckout: (booking: AdminBookingItem) => void;
  onOpenNoShow: (booking: AdminBookingItem) => void;
}

export function BookingListView({
  bookings,
  onStartService,
  onOpenCheckout,
  onOpenNoShow
}: BookingListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Filter bookings client-side
  const filteredBookings = bookings.filter((b) => {
    // 1. Barber Filter
    if (selectedBarberId !== 'all' && b.barber_id !== selectedBarberId) {
      return false;
    }

    // 2. Status Filter
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'walk_in' && b.booking_type !== 'walk_in') {
        return false;
      } else if (selectedStatus !== 'walk_in' && b.status !== selectedStatus) {
        return false;
      }
    }

    // 3. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchName = b.customer_name.toLowerCase().includes(q);
      const matchCode = b.booking_code.toLowerCase().includes(q);
      const matchPhone = b.customer_phone.includes(q);
      return matchName || matchCode || matchPhone;
    }

    return true;
  });

  return (
    <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#161616] border-b border-[#2E2E2E] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, kode booking, atau WhatsApp..."
            className="w-full bg-[#121212] border border-[#2E2E2E] focus:border-[#D97706] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F5F5F0] outline-none placeholder:text-[#78716C]"
          />
        </div>

        {/* Barber Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-[#78716C] mr-1 hidden sm:inline">Barber:</span>
          <button
            type="button"
            onClick={() => setSelectedBarberId('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedBarberId === 'all'
                ? 'bg-[#D97706] text-[#121212]'
                : 'bg-[#242424] text-[#A8A29E] hover:text-[#F5F5F0]'
            }`}
          >
            Semua
          </button>
          {SEED_BARBERS.map((barber) => (
            <button
              key={barber.id}
              type="button"
              onClick={() => setSelectedBarberId(barber.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedBarberId === barber.id
                  ? 'bg-[#D97706] text-[#121212]'
                  : 'bg-[#242424] text-[#A8A29E] hover:text-[#F5F5F0]'
              }`}
            >
              {barber.name.split(' ')[0]} (K{barber.chair_number})
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="px-4 py-2 bg-[#121212] border-b border-[#2E2E2E] flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[#78716C] mr-1">Status:</span>
        {[
          { id: 'all', label: 'Semua Status' },
          { id: 'confirmed', label: 'Siap Datang' },
          { id: 'in_progress', label: 'Sedang di Kursi' },
          { id: 'completed', label: 'Selesai' },
          { id: 'walk_in', label: 'Tamu Walk-In' },
          { id: 'no_show', label: 'No-Show' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
              selectedStatus === tab.id
                ? 'bg-[#2E2E2E] text-[#F5F5F0] border border-[#D97706]/40'
                : 'text-[#A8A29E] hover:text-[#F5F5F0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-[#78716C] font-mono">
          {filteredBookings.length} Reservasi
        </span>
      </div>

      {/* Table Content */}
      {filteredBookings.length === 0 ? (
        <div className="py-12 px-4 text-center text-xs text-[#78716C] flex flex-col items-center justify-center">
          <Clock className="size-8 text-[#2E2E2E] mb-2" />
          <p>Tidak ada reservasi yang sesuai dengan kriteria filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161616] text-[#A8A29E] border-b border-[#2E2E2E] font-medium">
              <tr>
                <th className="py-3 px-4">Waktu & Kode</th>
                <th className="py-3 px-4">Tamu & Kontak</th>
                <th className="py-3 px-4">Barber / Kursi</th>
                <th className="py-3 px-4">Layanan</th>
                <th className="py-3 px-4">Biaya & Kasir</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {filteredBookings.map((b) => {
                const isLate = b.is_late_warning;
                const isPastTolerance = b.is_past_tolerance;

                return (
                  <tr key={b.id} className="hover:bg-[#1E1E1E]/50 transition-colors">
                    {/* Waktu & Kode */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-sm text-[#F5F5F0]">
                        {b.start_time} - {b.end_time}
                      </div>
                      <div className="font-mono text-[10px] text-[#78716C]">
                        {b.booking_code}
                      </div>
                    </td>

                    {/* Pelanggan */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-sm text-[#F5F5F0]">
                        {b.customer_name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#A8A29E]">
                        <span>{b.customer_phone}</span>
                        <a
                          href={`https://wa.me/${b.customer_phone.replace(/\D/g, '')}?text=Halo%20Mas%20${encodeURIComponent(
                            b.customer_name
                          )},%20jadwal%20potong%20rambut%20di%20Damez%20Barbershop%20sudah%20siap.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#25D366] hover:underline"
                          title="Kirim pesan WhatsApp"
                        >
                          <MessageSquare className="size-3 inline" />
                        </a>
                      </div>
                    </td>

                    {/* Barber */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#F5F5F0]">
                        {b.barber_name}
                      </div>
                      <div className="text-[10px] text-[#D97706] font-semibold">
                        Kursi {b.barber_chair}
                      </div>
                    </td>

                    {/* Layanan */}
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="text-[#F5F5F0] font-medium truncate">
                        {b.service_names.join(' + ')}
                      </div>
                      <div className="text-[10px] text-[#78716C]">
                        {b.service_duration_minutes} Menit (+10m jeda)
                      </div>
                    </td>

                    {/* Biaya & Kasir */}
                    <td className="py-3 px-4 font-mono">
                      <div className="text-[#F5F5F0] font-semibold">
                        Rp {b.total_price_idr.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-[#34D399]">
                        DP: Rp {b.down_payment_idr.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-[#D97706] font-bold">
                        Sisa: Rp {b.remaining_balance_idr.toLocaleString('id-ID')}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {b.status === 'in_progress' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1E3A8A] text-[#93C5FD] border border-[#3B82F6]/50">
                          Sedang Cukur
                        </span>
                      ) : b.status === 'completed' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#262626] text-[#A8A29E]">
                          Selesai
                        </span>
                      ) : b.status === 'no_show' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#450A0A] text-[#F87171] border border-[#DC2626]/40">
                          No-Show
                        </span>
                      ) : isPastTolerance ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-800 text-white animate-pulse">
                          Lewat 15m
                        </span>
                      ) : isLate ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D97706] text-[#121212]">
                          Telat 10m
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#064E3B] text-[#34D399]">
                          Siap Datang
                        </span>
                      )}
                    </td>

                    {/* Aksi Cepat */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === 'confirmed' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onStartService(b.id)}
                              className="px-2.5 py-1 bg-[#10B981] hover:bg-[#059669] text-[#121212] rounded text-xs font-bold transition-colors flex items-center gap-1"
                              title="Tandai Tamu Duduk di Kursi"
                            >
                              <Play className="size-3 fill-current" />
                              <span>Mulai</span>
                            </button>
                            {(isLate || isPastTolerance) && (
                              <button
                                type="button"
                                onClick={() => onOpenNoShow(b)}
                                className="px-2 py-1 bg-[#450A0A] hover:bg-[#DC2626] text-[#FCA5A5] hover:text-white rounded text-xs font-semibold transition-colors"
                                title="Tandai No-Show (DP Hangus)"
                              >
                                No-Show
                              </button>
                            )}
                          </>
                        )}

                        {b.status === 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => onOpenCheckout(b)}
                            className="px-2.5 py-1 bg-[#10B981] hover:bg-[#059669] text-[#121212] rounded text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                            title="Buka Kasir Pelunasan"
                          >
                            <CheckCircle className="size-3.5" />
                            <span>Kasir</span>
                          </button>
                        )}

                        {b.status === 'completed' && (
                          <span className="text-[11px] text-[#78716C] uppercase font-mono">
                            {b.settlement_method}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
