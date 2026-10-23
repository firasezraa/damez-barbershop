/**
 * API ROUTE: /api/admin/blocked-slots
 * 
 * GET: Mengambil matriks kalender slot 3 kursi barber untuk tanggal tertentu
 * POST: Menambahkan slot blokir darurat / jam istirahat
 */

import {
  getAdminCalendarMatrix,
  createAdminBlockedSlot
} from '../../../../lib/admin/service.ts';
import { getJakartaDateString } from '../../../../lib/utils/timezone.ts';
import type { CreateBlockSlotParams } from '../../../../lib/admin/types.ts';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getJakartaDateString();

    const matrix = await getAdminCalendarMatrix(date);

    return Response.json({
      success: true,
      date,
      columns: matrix
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message || 'Gagal memuat matriks kalender.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.start_time || !body.end_time || !body.title) {
      return Response.json(
        { success: false, error: 'Waktu mulai, selesai, dan judul blokir wajib diisi.' },
        { status: 400 }
      );
    }

    const params: CreateBlockSlotParams = {
      barber_id: body.barber_id || null,
      day_of_week: body.day_of_week ?? null,
      booking_date: body.booking_date,
      start_time: body.start_time,
      end_time: body.end_time,
      title: body.title,
      reason: body.reason,
      slot_type: body.slot_type || 'custom_block'
    };

    const result = await createAdminBlockedSlot(params);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      message: 'Slot kursi berhasil diblokir.'
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message || 'Gagal menambahkan blokir slot.' },
      { status: 500 }
    );
  }
}
