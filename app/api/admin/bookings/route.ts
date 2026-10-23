/**
 * API ROUTE: /api/admin/bookings
 * 
 * GET: Mengambil daftar reservasi berfilter untuk portal admin
 * POST: Input reservasi tamu Walk-in instan (< 15 detik)
 */

import {
  getAdminDailyBookings,
  createAdminWalkIn,
  getDailyStats
} from '../../../../lib/admin/service.ts';
import { getJakartaDateString } from '../../../../lib/utils/timezone.ts';
import type { AdminBookingFilters, QuickWalkInParams } from '../../../../lib/admin/types.ts';
import {
  sanitizeCustomerName,
  sanitizeBookingNotes,
  validateAndNormalizeIndonesianPhone
} from '../../../../lib/security/bot-protection.ts';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getJakartaDateString();
    const barberId = searchParams.get('barberId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const searchQuery = searchParams.get('search') || undefined;
    const bookingType = (searchParams.get('type') as any) || undefined;

    const filters: AdminBookingFilters = {
      date,
      barberId,
      status,
      searchQuery,
      bookingType
    };

    const bookings = await getAdminDailyBookings(filters);
    const stats = await getDailyStats(date);

    return Response.json({
      success: true,
      date,
      count: bookings.length,
      bookings,
      stats
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message || 'Gagal memuat data reservasi.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.barber_id || !body.start_time) {
      return Response.json(
        { success: false, error: 'Barber dan jam mulai wajib dipilih.' },
        { status: 400 }
      );
    }

    const rawName = body.customer_name || 'Tamu Walk-In';
    const nameCheck = sanitizeCustomerName(rawName);
    const sanitizedName = nameCheck.isValid ? nameCheck.sanitizedName : 'Tamu Walk-In';

    let normalizedPhone: string | undefined = undefined;
    if (body.customer_phone && String(body.customer_phone).trim() !== '') {
      const phoneCheck = validateAndNormalizeIndonesianPhone(String(body.customer_phone));
      if (phoneCheck.isValid) {
        normalizedPhone = phoneCheck.normalizedPhone;
      }
    }

    const notesCheck = sanitizeBookingNotes(body.notes);
    const sanitizedNotes = notesCheck.sanitizedNotes || undefined;

    const walkInParams: QuickWalkInParams = {
      customer_name: sanitizedName,
      customer_phone: normalizedPhone,
      barber_id: body.barber_id,
      service_ids: Array.isArray(body.service_ids) && body.service_ids.length > 0
        ? body.service_ids
        : ['a0000001-0000-0000-0000-000000000001'],
      start_time: body.start_time,
      booking_date: body.booking_date || getJakartaDateString(),
      action_mode: body.action_mode === 'queue_wait' ? 'queue_wait' : 'start_now',
      notes: sanitizedNotes
    };

    const result = await createAdminWalkIn(walkInParams);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: true,
        message: 'Tamu walk-in berhasil didaftarkan ke kursi kasir.',
        booking: result.booking
      },
      { status: 201 }
    );
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message || 'Gagal mendaftarkan tamu walk-in.' },
      { status: 500 }
    );
  }
}
