'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StatsBanner } from '@/components/admin/StatsBanner.tsx';
import { CalendarMatrixView } from '@/components/admin/CalendarMatrixView.tsx';
import { BookingListView } from '@/components/admin/BookingListView.tsx';
import { CashierCheckoutModal } from '@/components/admin/CashierCheckoutModal.tsx';
import { NoShowModal } from '@/components/admin/NoShowModal.tsx';
import { QuickWalkInModal } from '@/components/admin/QuickWalkInModal.tsx';
import { BlockSlotModal } from '@/components/admin/BlockSlotModal.tsx';
import {
  getAdminDailyBookings,
  getDailyStats,
  getAdminCalendarMatrix,
  createAdminWalkIn,
  startBookingService,
  completeBookingCheckout,
  markBookingNoShow,
  createAdminBlockedSlot
} from '@/lib/admin/service.ts';
import { getJakartaDateString } from '@/lib/utils/timezone.ts';
import type {
  AdminBookingItem,
  AdminDailyStats,
  AdminBarberColumn,
  QuickWalkInParams,
  CompleteBookingParams,
  MarkNoShowParams,
  CreateBlockSlotParams
} from '@/lib/admin/types.ts';
import { Calendar, ListFilter, Scissors, CheckCircle2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const [currentDate, setCurrentDate] = useState<string>(getJakartaDateString());
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [loading, setLoading] = useState<boolean>(true);

  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [stats, setStats] = useState<AdminDailyStats | null>(null);
  const [columns, setColumns] = useState<AdminBarberColumn[]>([]);

  // Modal Dialogs States
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    booking: AdminBookingItem | null;
  }>({ isOpen: false, booking: null });

  const [noShowModal, setNoShowModal] = useState<{
    isOpen: boolean;
    booking: AdminBookingItem | null;
  }>({ isOpen: false, booking: null });

  const [walkInModal, setWalkInModal] = useState<{
    isOpen: boolean;
    barberId?: string;
    time?: string;
  }>({ isOpen: false });

  const [blockModal, setBlockModal] = useState<{
    isOpen: boolean;
    barberId?: string;
    time?: string;
  }>({ isOpen: false });

  // Load Dashboard Data (Both via API and fallback to local service)
  const loadData = useCallback(async (targetDate: string) => {
    setLoading(true);
    try {
      // 1. Coba panggil REST API
      const resBookings = await fetch(`/api/admin/bookings?date=${targetDate}`);
      if (resBookings.ok) {
        const dataB = await resBookings.json();
        setBookings(dataB.bookings || []);
        setStats(dataB.stats || null);
      } else {
        throw new Error('API bookings offline');
      }

      const resMatrix = await fetch(`/api/admin/blocked-slots?date=${targetDate}`);
      if (resMatrix.ok) {
        const dataM = await resMatrix.json();
        setColumns(dataM.columns || []);
      } else {
        throw new Error('API blocked-slots offline');
      }
    } catch {
      // 2. Direct service fallback (jaminan 100% operational in test/offline environment)
      const directBookings = await getAdminDailyBookings({ date: targetDate });
      const directStats = await getDailyStats(targetDate);
      const directColumns = await getAdminCalendarMatrix(targetDate);

      setBookings(directBookings);
      setStats(directStats);
      setColumns(directColumns);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(currentDate);

    // Listen to custom header events
    const handleDateChange = (e: any) => {
      if (e.detail?.date) {
        setCurrentDate(e.detail.date);
        loadData(e.detail.date);
      }
    };

    const handleRefresh = () => {
      loadData(currentDate);
    };

    window.addEventListener('damez:date_change', handleDateChange);
    window.addEventListener('damez:refresh_data', handleRefresh);

    return () => {
      window.removeEventListener('damez:date_change', handleDateChange);
      window.removeEventListener('damez:refresh_data', handleRefresh);
    };
  }, [currentDate, loadData]);

  // Handler Quick Action 1: Mulai Cukur (confirmed -> in_progress)
  const handleStartService = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' })
      });
      if (res.ok) {
        loadData(currentDate);
        return;
      }
    } catch {
      // fallback
    }
    await startBookingService(bookingId);
    loadData(currentDate);
  };

  // Handler Quick Action 2: Kasir Selesai & Pelunasan
  const handleConfirmCheckout = async (params: CompleteBookingParams): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/bookings/${params.booking_id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          settlement_method: params.settlement_method,
          cash_amount_received: params.cash_amount_received,
          notes: params.notes
        })
      });
      if (res.ok) {
        loadData(currentDate);
        return true;
      }
    } catch {
      // fallback
    }

    const result = await completeBookingCheckout(params);
    if (result.success) {
      loadData(currentDate);
      return true;
    }
    return false;
  };

  // Handler Quick Action 3: Tandai No-Show
  const handleConfirmNoShow = async (params: MarkNoShowParams): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/bookings/${params.booking_id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'no_show',
          reason: params.reason
        })
      });
      if (res.ok) {
        loadData(currentDate);
        return true;
      }
    } catch {
      // fallback
    }

    const result = await markBookingNoShow(params);
    if (result.success) {
      loadData(currentDate);
      return true;
    }
    return false;
  };

  // Handler Quick Action 4: Input Walk-In
  const handleConfirmWalkIn = async (params: QuickWalkInParams): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, booking_date: currentDate })
      });
      if (res.ok) {
        loadData(currentDate);
        return true;
      }
    } catch {
      // fallback
    }

    const result = await createAdminWalkIn({ ...params, booking_date: currentDate });
    if (result.success) {
      loadData(currentDate);
      return true;
    }
    return false;
  };

  // Handler Quick Action 5: Blokir Kursi
  const handleConfirmBlockSlot = async (params: CreateBlockSlotParams): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/blocked-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, booking_date: currentDate })
      });
      if (res.ok) {
        loadData(currentDate);
        return true;
      }
    } catch {
      // fallback
    }

    const result = await createAdminBlockedSlot({ ...params, booking_date: currentDate });
    if (result.success) {
      loadData(currentDate);
      return true;
    }
    return false;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Baris Statistik Rekonsiliasi & Okupansi */}
      <StatsBanner stats={stats} />

      {/* 2. Switcher Tab: Matriks Kalender vs Daftar Reservasi */}
      <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-[#D97706] text-[#121212] shadow-md shadow-[#D97706]/20'
                : 'bg-[#1A1A1A] text-[#A8A29E] hover:text-[#F5F5F0] hover:bg-[#242424]'
            }`}
          >
            <Calendar className="size-4" />
            <span>Kalender Matriks 3 Kursi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'list'
                ? 'bg-[#D97706] text-[#121212] shadow-md shadow-[#D97706]/20'
                : 'bg-[#1A1A1A] text-[#A8A29E] hover:text-[#F5F5F0] hover:bg-[#242424]'
            }`}
          >
            <ListFilter className="size-4" />
            <span>Daftar Reservasi &amp; Antrean</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#121212]/40">
              {bookings.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#78716C]">
          <span className="size-2 rounded-full bg-[#10B981]" />
          <span>Realtime Synchronized (WIB)</span>
        </div>
      </div>

      {/* 3. Konten Utama: Kalender vs Daftar Reservasi */}
      {activeTab === 'calendar' ? (
        <CalendarMatrixView
          columns={columns}
          onStartService={handleStartService}
          onOpenCheckout={(booking) => setCheckoutModal({ isOpen: true, booking })}
          onOpenNoShow={(booking) => setNoShowModal({ isOpen: true, booking })}
          onOpenWalkInForSlot={(barberId, time) =>
            setWalkInModal({ isOpen: true, barberId, time })
          }
          onOpenBlockSlot={(barberId, time) =>
            setBlockModal({ isOpen: true, barberId, time })
          }
        />
      ) : (
        <BookingListView
          bookings={bookings}
          onStartService={handleStartService}
          onOpenCheckout={(booking) => setCheckoutModal({ isOpen: true, booking })}
          onOpenNoShow={(booking) => setNoShowModal({ isOpen: true, booking })}
        />
      )}

      {/* 4. Modals */}
      {/* Modal Selesaikan & Kasir */}
      <CashierCheckoutModal
        isOpen={checkoutModal.isOpen}
        onClose={() => setCheckoutModal({ isOpen: false, booking: null })}
        booking={checkoutModal.booking}
        onConfirm={handleConfirmCheckout}
      />

      {/* Modal No-Show */}
      <NoShowModal
        isOpen={noShowModal.isOpen}
        onClose={() => setNoShowModal({ isOpen: false, booking: null })}
        booking={noShowModal.booking}
        onConfirm={handleConfirmNoShow}
      />

      {/* Modal Quick Walk-In untuk slot tertentu */}
      <QuickWalkInModal
        isOpen={walkInModal.isOpen}
        onClose={() => setWalkInModal({ isOpen: false })}
        initialBarberId={walkInModal.barberId}
        initialTime={walkInModal.time}
        onSubmit={handleConfirmWalkIn}
      />

      {/* Modal Blokir Slot */}
      <BlockSlotModal
        isOpen={blockModal.isOpen}
        onClose={() => setBlockModal({ isOpen: false })}
        initialBarberId={blockModal.barberId}
        initialTime={blockModal.time}
        onConfirm={handleConfirmBlockSlot}
      />
    </div>
  );
}
