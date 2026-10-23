'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type {
  TelemetryDashboardData,
  FunnelStageMetrics,
  BarberMetricItem,
  ChannelMetricItem
} from '@/lib/analytics/telemetry.ts';
import { getFunnelMetrics } from '@/lib/analytics/telemetry.ts';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Users,
  DollarSign,
  Clock,
  ArrowRight,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  CheckCircle2,
  Activity,
  Smartphone,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface TelemetryDashboardViewProps {
  initialDate?: string;
}

export function TelemetryDashboardView({ initialDate }: TelemetryDashboardViewProps) {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [data, setData] = useState<TelemetryDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Coba REST API
      const res = await fetch(
        `/api/telemetry/events?timeRange=${timeRange}&barberId=${selectedBarberId}${
          initialDate ? `&date=${initialDate}` : ''
        }`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          return;
        }
      }
      throw new Error('API offline');
    } catch {
      // 2. Fallback direct client calculation
      const direct = await getFunnelMetrics({
        timeRange,
        barberId: selectedBarberId,
        referenceDate: initialDate
      });
      setData(direct);
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedBarberId, initialDate]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleExportJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `damez-telemetry-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice('Laporan telemetri berhasil diunduh (JSON).');
    setTimeout(() => setExportNotice(null), 3000);
  };

  const formatIdr = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-[#1A1A1A] rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-[#1A1A1A] rounded-xl border border-[#2E2E2E]" />
          ))}
        </div>
        <div className="h-64 bg-[#1A1A1A] rounded-xl border border-[#2E2E2E]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-[#1A1A1A] rounded-xl border border-[#2E2E2E]">
        <AlertCircle className="size-8 text-[#F87171] mx-auto mb-2" />
        <p className="text-sm text-[#A8A29E]">Data telemetri belum dapat dimuat.</p>
        <button
          onClick={loadMetrics}
          className="mt-3 px-4 py-2 bg-[#D97706] text-[#121212] font-bold rounded-lg text-xs"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  const { funnel, noshow, barbers, channels, summary_insights, recent_events } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Kontrol & Filter Rentang Waktu */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#161616] p-4 rounded-xl border border-[#2E2E2E]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-[#D97706]" />
            <h2 className="text-base font-bold text-[#F5F5F0]">
              Telemetri Konversi &amp; Pengurangan No-Show
            </h2>
          </div>
          <p className="text-xs text-[#A8A29E]">
            Pemantauan langsung 4-stage funnel dan efektivitas perlindungan DP Flat Rp 20.000
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Barber Selector */}
          <select
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-[#1A1A1A] text-[#F5F5F0] border border-[#2E2E2E] focus:outline-none focus:border-[#D97706]"
          >
            <option value="all">Semua Barber (3 Kursi)</option>
            {barbers.map((b) => (
              <option key={b.barber_id} value={b.barber_id}>
                {b.barber_name} (Kursi {b.chair_number})
              </option>
            ))}
          </select>

          {/* Time Range Buttons */}
          <div className="flex items-center bg-[#1A1A1A] p-0.5 rounded-lg border border-[#2E2E2E]">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                timeRange === 'today'
                  ? 'bg-[#D97706] text-[#121212] font-bold'
                  : 'text-[#A8A29E] hover:text-[#F5F5F0]'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                timeRange === '7d'
                  ? 'bg-[#D97706] text-[#121212] font-bold'
                  : 'text-[#A8A29E] hover:text-[#F5F5F0]'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                timeRange === '30d'
                  ? 'bg-[#D97706] text-[#121212] font-bold'
                  : 'text-[#A8A29E] hover:text-[#F5F5F0]'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                timeRange === 'all'
                  ? 'bg-[#D97706] text-[#121212] font-bold'
                  : 'text-[#A8A29E] hover:text-[#F5F5F0]'
              }`}
            >
              Semua
            </button>
          </div>

          {/* Export JSON button */}
          <button
            onClick={handleExportJson}
            title="Ekspor Data JSON"
            className="p-2 bg-[#1A1A1A] hover:bg-[#262626] text-[#A8A29E] hover:text-[#F5F5F0] rounded-lg border border-[#2E2E2E] transition-all"
          >
            <Download className="size-4" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadMetrics}
            disabled={loading}
            title="Perbarui Data"
            className="p-2 bg-[#1A1A1A] hover:bg-[#262626] text-[#A8A29E] hover:text-[#F5F5F0] rounded-lg border border-[#2E2E2E] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin text-[#D97706]' : ''}`} />
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg text-xs text-[#10B981] flex items-center gap-2">
          <CheckCircle2 className="size-4" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* 2. Top Headline Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: No-Show Rate */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between ${
            noshow.target_status === 'MET'
              ? 'bg-[#161616] border-[#10B981]/40 shadow-sm shadow-[#10B981]/5'
              : noshow.target_status === 'WARNING'
              ? 'bg-[#161616] border-[#F59E0B]/40'
              : 'bg-[#161616] border-[#F87171]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A29E]">Rasio No-Show</span>
            {noshow.target_status === 'MET' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                <ShieldCheck className="size-3" />
                TARGET TERCAPAI
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/30">
                <AlertTriangle className="size-3" />
                PERIKSA
              </span>
            )}
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-extrabold font-mono ${
                  noshow.target_status === 'MET' ? 'text-[#10B981]' : 'text-[#F87171]'
                }`}
              >
                {noshow.noshow_rate_percent}%
              </span>
              <span className="text-xs text-[#78716C]">
                ({noshow.noshow_count} dari {noshow.total_scheduled} booking)
              </span>
            </div>
          </div>
          <div className="text-[11px] text-[#A8A29E] flex items-center justify-between border-t border-[#262626] pt-2">
            <span>Batas Maksimum: &lt; 10.0%</span>
            <span className="text-[#34D399] font-medium">Aman</span>
          </div>
        </div>

        {/* Card 2: Efikasi Penurunan No-Show vs Industri */}
        <div className="bg-[#161616] p-4 rounded-xl border border-[#2E2E2E] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A29E]">Penurunan No-Show</span>
            <TrendingDown className="size-4 text-[#10B981]" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-[#34D399]">
                -{noshow.efficacy_improvement_percent}%
              </span>
              <span className="text-xs text-[#78716C]">vs Industri</span>
            </div>
          </div>
          <div className="text-[11px] text-[#A8A29E] flex items-center justify-between border-t border-[#262626] pt-2">
            <span>Baseline Tanpa DP: 28.5%</span>
            <span className="text-[#D97706] font-medium">Dampak DP</span>
          </div>
        </div>

        {/* Card 3: Konversi End-to-End Funnel */}
        <div className="bg-[#161616] p-4 rounded-xl border border-[#2E2E2E] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A29E]">Konversi End-to-End</span>
            <TrendingUp className="size-4 text-[#60A5FA]" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-[#60A5FA]">
                {data.overall_conversion_rate_percent}%
              </span>
              <span className="text-xs text-[#78716C]">
                ({funnel[3]?.count || 0} selesai)
              </span>
            </div>
          </div>
          <div className="text-[11px] text-[#A8A29E] flex items-center justify-between border-t border-[#262626] pt-2">
            <span>Pengunjung &rarr; Selesai Cukur</span>
            <span className="text-[#60A5FA] font-medium">Sehat</span>
          </div>
        </div>

        {/* Card 4: Kompensasi DP Hangus Terlindungi */}
        <div className="bg-[#161616] p-4 rounded-xl border border-[#D97706]/40 bg-gradient-to-br from-[#161616] to-[#261B0E] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#D97706]">Dana DP Hangus Terlindungi</span>
            <DollarSign className="size-4 text-[#D97706]" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-[#F5F5F0]">
                {formatIdr(noshow.total_dp_forfeited_idr)}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-[#A8A29E] flex items-center justify-between border-t border-[#2E2E2E] pt-2">
            <span>Rp 20.000 / no-show</span>
            <span className="text-[#D97706] font-medium">Kompensasi Barber</span>
          </div>
        </div>
      </div>

      {/* 3. Visualisasi 4-Stage Conversion Funnel */}
      <div className="bg-[#161616] p-5 rounded-xl border border-[#2E2E2E] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#F5F5F0]">
              Visualisasi Alur Konversi (4-Stage Funnel)
            </h3>
            <p className="text-xs text-[#A8A29E]">
              Pelacakan drop-off: Pengunjung &rarr; Klik Booking &rarr; Bayar DP &rarr; Hadir di Gerai
            </p>
          </div>
          <div className="text-xs font-mono text-[#D97706] bg-[#261A0C] px-2.5 py-1 rounded-lg border border-[#D97706]/30 self-start sm:self-auto">
            Total Selesai: {funnel[3]?.count || 0} Pelanggan
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {funnel.map((stage, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === funnel.length - 1;
            const pctWidth = Math.max(stage.conversion_from_first_percent, 12);

            return (
              <div
                key={stage.stage}
                className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2E2E2E] flex flex-col justify-between relative overflow-hidden"
              >
                {/* Visual bar fill behind */}
                <div
                  className="absolute bottom-0 left-0 h-1 bg-[#D97706]"
                  style={{ width: `${pctWidth}%` }}
                />

                <div className="flex items-center justify-between text-xs text-[#A8A29E] mb-2">
                  <span className="font-semibold text-[#F5F5F0] truncate">
                    {stage.label}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#262626] text-[#D97706]">
                    Tahap {stage.stage_order}
                  </span>
                </div>

                <div className="my-2">
                  <span className="text-2xl font-bold font-mono text-[#F5F5F0]">
                    {stage.count.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs text-[#78716C] ml-1.5">
                    {isFirst ? 'pengunjung' : 'sesi'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#262626] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#A8A29E]">Konversi Tahap:</span>
                    <span className="font-mono font-bold text-[#10B981]">
                      {isFirst ? '100%' : `${stage.conversion_from_previous_percent}%`}
                    </span>
                  </div>

                  {!isFirst && (
                    <div className="flex items-center justify-between text-[#78716C]">
                      <span>Drop-off:</span>
                      <span className="font-mono text-[#F87171]">
                        -{stage.drop_off_percent}% ({stage.drop_off_count})
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-[#A8A29E]">
                    <span>Dari Pengunjung:</span>
                    <span className="font-mono text-[#60A5FA]">
                      {stage.conversion_from_first_percent}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Analisis Mendalam No-Show & Matriks Barber */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1 & 2: Matriks Performa Barber */}
        <div className="lg:col-span-2 bg-[#161616] p-5 rounded-xl border border-[#2E2E2E] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F0]">
                Rasio No-Show &amp; Penyelesaian per Barber
              </h3>
              <p className="text-xs text-[#A8A29E]">
                Evaluasi kepatuhan batas target no-show &lt; 10% untuk masing-masing kursi barber
              </p>
            </div>
            <span className="text-xs text-[#78716C] font-mono">3 Kursi Aktif</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1A1A1A] text-[#A8A29E] font-medium border-b border-[#2E2E2E]">
                <tr>
                  <th className="py-2.5 px-3">Kursi &amp; Nama Barber</th>
                  <th className="py-2.5 px-3 text-right">Total Terjadwal</th>
                  <th className="py-2.5 px-3 text-right">Selesai Cukur</th>
                  <th className="py-2.5 px-3 text-right">No-Show</th>
                  <th className="py-2.5 px-3 text-right">Rasio No-Show</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {barbers.map((b) => (
                  <tr key={b.barber_id} className="hover:bg-[#1E1E1E] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-[#262626] text-[#D97706] flex items-center justify-center font-bold text-[10px]">
                          K{b.chair_number}
                        </div>
                        <div>
                          <div className="font-semibold text-[#F5F5F0]">{b.barber_name}</div>
                          <div className="text-[10px] text-[#78716C]">Kursi #{b.chair_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-[#F5F5F0]">
                      {b.total_bookings}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#34D399]">
                      {b.completed_count}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#F87171]">
                      {b.noshow_count}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span
                        className={b.target_met ? 'text-[#10B981]' : 'text-[#F87171]'}
                      >
                        {b.noshow_rate_percent}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {b.target_met ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                          <CheckCircle2 className="size-3" />
                          Lolos (&lt;10%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/30">
                          <AlertTriangle className="size-3" />
                          Perhatian
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Efficacy Comparative Summary Box */}
          <div className="bg-[#1A1A1A] p-4 rounded-lg border border-[#2E2E2E] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#10B981]/20 text-[#10B981]">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F5F5F0]">
                  SOP No-Show Toleransi 15 Menit &amp; Hangus DP Berfungsi
                </h4>
                <p className="text-[11px] text-[#A8A29E]">
                  Slot yang ditinggalkan langsung dibebaskan dan DP Rp 20.000 dialokasikan sebagai kompensasi operasional.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-[#78716C]">Total Proteksi Finansial</div>
              <div className="text-sm font-bold font-mono text-[#D97706]">
                {formatIdr(noshow.total_dp_forfeited_idr)}
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 3: Analisis Kanal Trafik & Pengingat WA */}
        <div className="bg-[#161616] p-5 rounded-xl border border-[#2E2E2E] flex flex-col gap-4">
          <div className="border-b border-[#262626] pb-3">
            <h3 className="text-sm font-bold text-[#F5F5F0]">Kanal Trafik &amp; Konversi</h3>
            <p className="text-xs text-[#A8A29E]">Performa sumber pengunjung ke booking</p>
          </div>

          <div className="flex flex-col gap-3">
            {channels.map((ch) => (
              <div
                key={ch.channel}
                className="bg-[#1A1A1A] p-3 rounded-lg border border-[#2E2E2E] flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#F5F5F0] truncate">
                    {ch.channel_label}
                  </span>
                  <span className="font-mono font-bold text-[#10B981]">
                    {ch.conversion_rate_percent}%
                  </span>
                </div>
                <div className="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#D97706] h-full rounded-full"
                    style={{ width: `${Math.min(ch.conversion_rate_percent * 3, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#78716C]">
                  <span>{ch.visitors} pengunjung</span>
                  <span>{ch.bookings} booking DP</span>
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp Reminder Impact Note */}
          <div className="bg-[#261E14] p-3.5 rounded-lg border border-[#D97706]/30 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D97706]">
              <Clock className="size-4" />
              <span>Dampak Pengingat Otomatis WhatsApp</span>
            </div>
            <p className="text-[11px] text-[#A8A29E] leading-relaxed">
              Notifikasi H-2 Jam dan H-30 Menit yang dikirim melalui gateway WhatsApp berkontribusi menurunkan rasio pembatalan mendadak hingga di bawah 10%.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Live Telemetry Event Log Stream */}
      <div className="bg-[#161616] p-5 rounded-xl border border-[#2E2E2E] flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#F5F5F0]">
              Log Aliran Event Telemetri Terkini
            </h3>
            <p className="text-xs text-[#A8A29E]">
              Audit trail aktivitas pengguna terlindungi UU PDP No. 27/2022 (Data PII di-masking secara ketat)
            </p>
          </div>
          <span className="text-xs text-[#78716C] font-mono">
            {recent_events.length} Event Terakhir
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1A1A1A] text-[#A8A29E] font-medium border-b border-[#2E2E2E]">
              <tr>
                <th className="py-2 px-3">Waktu (WIB)</th>
                <th className="py-2 px-3">Tipe Event</th>
                <th className="py-2 px-3">Perangkat / Kanal</th>
                <th className="py-2 px-3">Kode Booking</th>
                <th className="py-2 px-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {recent_events.map((evt) => {
                const timeStr = evt.timestamp
                  ? new Date(evt.timestamp).toLocaleTimeString('id-ID', {
                      timeZone: 'Asia/Jakarta',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    }) + ' WIB'
                  : '-';

                const eventBadgeColor =
                  evt.event_type === 'booking_no_show'
                    ? 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/30'
                    : evt.event_type === 'payment_settled' || evt.event_type === 'service_completed'
                    ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30'
                    : evt.event_type === 'booking_cta_click' || evt.event_type === 'booking_hold_created'
                    ? 'bg-[#D97706]/20 text-[#D97706] border-[#D97706]/30'
                    : 'bg-[#262626] text-[#A8A29E] border-[#3E3E3E]';

                return (
                  <tr key={evt.id} className="hover:bg-[#1E1E1E] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#78716C]">{timeStr}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${eventBadgeColor}`}
                      >
                        {evt.event_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#A8A29E] capitalize">
                      {evt.device_type} • {evt.channel?.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#D97706]">
                      {evt.booking_code || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#F5F5F0]">
                      {evt.amount ? formatIdr(evt.amount) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
