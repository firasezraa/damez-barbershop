/**
 * DAMEZ BARBERSHOP - API SLOT AVAILABILITY ENGINE
 * Route: GET /api/slots/available
 * 
 * Kontrak Antar-Agen (Contract-06):
 * - Strict Timezone: Asia/Jakarta (WIB / UTC+07:00)
 * - Bebas bentrok jadwal (collision-free)
 * - Slot terisi otomatis hilang dari opsi jam
 * - Mendukung pilihan barber tunggal maupun "siapa saja" (all active barbers)
 * - Menghitung durasi layanan majemuk + 10 menit buffer sanitasi
 */

import { NextRequest, NextResponse } from 'next/server.js';
import { fetchAndCalculateAvailableSlots } from '../../../../lib/slots/service.ts';
import type { AggregatedSlotResult } from '../../../../lib/slots/engine.ts';
import {
  globalRateLimiter,
  SLOTS_RATE_LIMIT_CONFIG,
  extractClientIp,
  createRateLimitResponse
} from '../../../../lib/security/rate-limit.ts';
import { isValidSafeIdentifier } from '../../../../lib/security/bot-protection.ts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

interface SuccessResponse {
  success: true;
  date: string;
  barber_id: string | null;
  total_duration_minutes: number;
  buffer_minutes: number;
  total_window_minutes: number;
  total_slots_count: number;
  slots: AggregatedSlotResult['slots'];
}

/**
 * Handler HTTP GET: Mengambil daftar slot ketersediaan reservasi
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    // 0. Flooding Bot Rate Limiting Protection (RFC 6585)
    const clientIp = extractClientIp(request);
    const ipRateLimit = globalRateLimiter.check(clientIp, SLOTS_RATE_LIMIT_CONFIG);
    if (!ipRateLimit.isAllowed) {
      return createRateLimitResponse(
        ipRateLimit,
        'Terlalu banyak permintaan ketersediaan slot dari alamat IP ini. Silakan coba beberapa saat lagi.'
      ) as unknown as NextResponse<ErrorResponse>;
    }

    const { searchParams } = new URL(request.url);

    // 1. Ekstraksi dan Validasi Parameter 'date'
    const dateParam: string | null = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter 'date' (format YYYY-MM-DD) wajib disertakan."
        },
        { status: 400 }
      );
    }

    // Validasi format YYYY-MM-DD dengan regex ketat
    const dateRegex: RegExp = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateParam)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format tanggal tidak valid. Gunakan format standar ISO YYYY-MM-DD (contoh: 2026-10-24)."
        },
        { status: 400 }
      );
    }

    // Validasi keabsahan tanggal kalender
    const [yearStr, monthStr, dayStr] = dateParam.split('-');
    const yearNum: number = Number(yearStr);
    const monthNum: number = Number(monthStr);
    const dayNum: number = Number(dayStr);

    if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
      return NextResponse.json(
        {
          success: false,
          error: "Nilai bulan (01-12) atau tanggal (01-31) tidak berada dalam rentang kalender yang valid."
        },
        { status: 400 }
      );
    }

    // 2. Ekstraksi Parameter 'barber_id'
    const barberIdParam: string | null = searchParams.get('barber_id');
    if (barberIdParam && barberIdParam.toLowerCase() !== 'any' && barberIdParam.toLowerCase() !== 'all') {
      if (!isValidSafeIdentifier(barberIdParam)) {
        return NextResponse.json(
          {
            success: false,
            error: "Format parameter 'barber_id' tidak valid."
          },
          { status: 400 }
        );
      }
    }

    const normalizedBarberId: string | null =
      !barberIdParam || barberIdParam.toLowerCase() === 'any' || barberIdParam.toLowerCase() === 'all'
        ? null
        : barberIdParam;

    // 3. Ekstraksi Parameter 'duration'
    const durationParam: string | null = searchParams.get('duration');
    let durationMinutes: number | undefined = undefined;

    if (durationParam) {
      const parsedDuration: number = Number(durationParam);
      if (isNaN(parsedDuration) || parsedDuration <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Parameter 'duration' harus berupa angka bulat positif (dalam satuan menit)."
          },
          { status: 400 }
        );
      }
      durationMinutes = parsedDuration;
    }

    // 4. Ekstraksi Parameter 'service_ids'
    const serviceIdsParam: string | null = searchParams.get('service_ids');
    const serviceIds: string[] = serviceIdsParam
      ? serviceIdsParam
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
      : [];

    for (const sId of serviceIds) {
      if (!isValidSafeIdentifier(sId)) {
        return NextResponse.json(
          {
            success: false,
            error: "Format salah satu 'service_ids' tidak valid."
          },
          { status: 400 }
        );
      }
    }

    // 5. Eksekusi Service Penentuan Slot
    const result: AggregatedSlotResult = await fetchAndCalculateAvailableSlots({
      date: dateParam,
      barberId: normalizedBarberId,
      serviceIds,
      durationMinutes
    });

    // 6. Return Response dengan Cache Control no-store
    return NextResponse.json(
      {
        success: true,
        date: result.date,
        barber_id: result.barber_id,
        total_duration_minutes: result.total_duration_minutes,
        buffer_minutes: result.buffer_minutes,
        total_window_minutes: result.total_window_minutes,
        total_slots_count: result.total_slots_count,
        slots: result.slots
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Timezone': 'Asia/Jakarta'
        }
      }
    );
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Unhandled error in /api/slots/available:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan internal saat memproses ketersediaan slot reservasi.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
