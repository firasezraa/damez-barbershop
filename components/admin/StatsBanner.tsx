'use client';

import React from 'react';
import type { AdminDailyStats } from '@/lib/admin/types.ts';
import { Users, DollarSign, CheckCircle2, Clock, AlertTriangle, UserPlus } from 'lucide-react';

interface StatsBannerProps {
  stats: AdminDailyStats | null;
}

export function StatsBanner({ stats }: StatsBannerProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-[#1A1A1A] rounded-lg border border-[#2E2E2E]" />
        ))}
      </div>
    );
  }

  const formatIdr = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Okupansi */}
      <div className="bg-[#1A1A1A] p-3 rounded-lg border border-[#2E2E2E] flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#A8A29E]">
          <span>Okupansi Slot</span>
          <Users className="size-4 text-[#D97706]" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono text-[#F5F5F0]">
            {stats.occupancy_rate_percent}%
          </span>
          <span className="text-xs text-[#78716C]">
            {stats.booked_slots}/{stats.total_slots}
          </span>
        </div>
      </div>

      {/* DP Online Masuk */}
      <div className="bg-[#1A1A1A] p-3 rounded-lg border border-[#2E2E2E] flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#A8A29E]">
          <span>DP Online (Midtrans)</span>
          <DollarSign className="size-4 text-[#10B981]" />
        </div>
        <div className="mt-2">
          <span className="text-base font-bold font-mono text-[#10B981]">
            {formatIdr(stats.total_dp_online_idr)}
          </span>
        </div>
      </div>

      {/* Pelunasan Kasir Fisik */}
      <div className="bg-[#1A1A1A] p-3 rounded-lg border border-[#2E2E2E] flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#A8A29E]">
          <span>Kasir Fisik (Tunai/QRIS)</span>
          <DollarSign className="size-4 text-[#F59E0B]" />
        </div>
        <div className="mt-2">
          <span className="text-base font-bold font-mono text-[#F59E0B]">
            {formatIdr(stats.total_cashier_cash_idr + stats.total_cashier_qris_idr)}
          </span>
        </div>
      </div>

      {/* Total Omzet Bersih */}
      <div className="bg-[#1A1A1A] p-3 rounded-lg border border-[#D97706]/40 bg-gradient-to-br from-[#1A1A1A] to-[#2A1D0D] flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#D97706] font-medium">
          <span>Omzet Bersih Toko</span>
          <DollarSign className="size-4 text-[#D97706]" />
        </div>
        <div className="mt-2">
          <span className="text-base font-bold font-mono text-[#F5F5F0]">
            {formatIdr(stats.total_net_revenue_idr)}
          </span>
        </div>
      </div>

      {/* Selesai vs Di Kursi */}
      <div className="bg-[#1A1A1A] p-3 rounded-lg border border-[#2E2E2E] flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#A8A29E]">
          <span>Selesai / Di Kursi</span>
          <div className="flex gap-1">
            <CheckCircle2 className="size-3.5 text-[#34D399]" />
            <Clock className="size-3.5 text-[#60A5FA]" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold font-mono text-[#34D399]">
            {stats.completed_count}
          </span>
          <span className="text-xs text-[#60A5FA]">
            ({stats.in_progress_count} aktif)
          </span>
        </div>
      </div>

      {/* Walk-in vs No-show */}
      <div className="bg-[#1A1A1A] p-3 rounded-lg border border-[#2E2E2E] flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#A8A29E]">
          <span>Walk-in / No-Show</span>
          <div className="flex gap-1">
            <UserPlus className="size-3.5 text-[#FBBF24]" />
            <AlertTriangle className="size-3.5 text-[#F87171]" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-sm font-semibold font-mono text-[#FBBF24]">
            +{stats.walk_in_count} Walk-In
          </span>
          <span className="text-xs font-mono text-[#F87171]">
            {stats.noshow_count} No-Show
          </span>
        </div>
      </div>
    </div>
  );
}
