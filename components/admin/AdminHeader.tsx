'use client';

import React, { useState, useEffect } from 'react';
import type { AdminUser } from '@/lib/admin/auth.ts';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  UserPlus,
  RefreshCw,
  LogOut,
  Scissors,
  Clock
} from 'lucide-react';
import { getJakartaTimeString } from '@/lib/utils/timezone.ts';

interface AdminHeaderProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  onOpenWalkIn: () => void;
  onDownloadCsv: () => void;
  onRefresh: () => void;
  user: AdminUser | null;
  onLogout: () => void;
  loading?: boolean;
}

export function AdminHeader({
  currentDate,
  onDateChange,
  onOpenWalkIn,
  onDownloadCsv,
  onRefresh,
  user,
  onLogout,
  loading = false
}: AdminHeaderProps) {
  const [clockString, setClockString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setClockString(getJakartaTimeString(new Date()) + ' WIB');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format tanggal display Indonesia
  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(dateObj);
    } catch {
      return dateStr;
    }
  };

  const handlePrevDay = () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    dateObj.setUTCDate(dateObj.getUTCDate() - 1);
    const newY = dateObj.getUTCFullYear();
    const newM = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getUTCDate()).padStart(2, '0');
    onDateChange(`${newY}-${newM}-${newD}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    dateObj.setUTCDate(dateObj.getUTCDate() + 1);
    const newY = dateObj.getUTCFullYear();
    const newM = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getUTCDate()).padStart(2, '0');
    onDateChange(`${newY}-${newM}-${newD}`);
  };

  return (
    <header className="bg-[#161616] border-b border-[#2E2E2E] sticky top-0 z-40 px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Brand & Live Clock */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-[#D97706] text-[#121212] flex items-center justify-center font-bold shadow-md shadow-[#D97706]/20">
              <Scissors className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base tracking-wide text-[#F5F5F0]">
                  DAMEZ BARBERSHOP
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#262626] text-[#D97706] border border-[#D97706]/30">
                  Portal Admin
                </span>
              </div>
              <p className="text-[11px] text-[#A8A29E] flex items-center gap-1.5 font-mono">
                <Clock className="size-3 text-[#D97706]" />
                <span>{clockString || '10:00 WIB'}</span>
                <span className="size-1 rounded-full bg-[#10B981] animate-ping" />
              </p>
            </div>
          </div>
        </div>

        {/* Date Navigator Bar */}
        <div className="flex items-center justify-center gap-1.5 bg-[#121212] p-1 rounded-lg border border-[#2E2E2E]">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1 text-[#A8A29E] hover:text-[#F5F5F0] hover:bg-[#242424] rounded transition-colors"
            title="Hari Sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="flex items-center gap-2 px-2 text-xs font-semibold text-[#F5F5F0]">
            <CalendarIcon className="size-3.5 text-[#D97706]" />
            <span>{formatDateDisplay(currentDate)}</span>
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1 text-[#A8A29E] hover:text-[#F5F5F0] hover:bg-[#242424] rounded transition-colors"
            title="Hari Berikutnya"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Action Buttons & User Menu */}
        <div className="flex items-center justify-end gap-2">
          {/* Refresh */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-[#A8A29E] hover:text-[#F5F5F0] hover:bg-[#242424] rounded-lg border border-[#2E2E2E] transition-colors"
            title="Perbarui Data"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin text-[#D97706]' : ''}`} />
          </button>

          {/* Unduh Rekap CSV */}
          <button
            type="button"
            onClick={onDownloadCsv}
            className="px-3 py-2 bg-[#242424] hover:bg-[#2E2E2E] text-[#F5F5F0] rounded-lg border border-[#2E2E2E] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Unduh Rekap Laporan Harian (.CSV)"
          >
            <Download className="size-3.5 text-[#34D399]" />
            <span className="hidden sm:inline">Unduh CSV</span>
          </button>

          {/* Input Walk-in Cepat */}
          <button
            type="button"
            onClick={onOpenWalkIn}
            className="px-3.5 py-2 bg-[#D97706] hover:bg-[#F59E0B] text-[#121212] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-[#D97706]/20"
            title="Input Tamu Walk-In Langsung (Alt + W)"
          >
            <UserPlus className="size-3.5" />
            <span>+ Walk-In</span>
            <kbd className="hidden lg:inline px-1 py-0.5 text-[9px] bg-[#121212]/30 rounded text-[#121212]">
              Alt+W
            </kbd>
          </button>

          {/* User Profile & Logout */}
          <div className="h-6 w-px bg-[#2E2E2E] mx-1" />
          <div className="flex items-center gap-1.5">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-[#F5F5F0]">
                {user ? user.name : 'Owner Damez'}
              </div>
              <div className="text-[10px] text-[#A8A29E] uppercase">
                {user ? user.role : 'Admin'}
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="p-2 text-[#A8A29E] hover:text-[#F87171] hover:bg-red-950/30 rounded-lg transition-colors"
              title="Keluar dari Sistem Admin"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
