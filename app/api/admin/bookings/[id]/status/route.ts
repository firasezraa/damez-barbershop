/**
 * API ROUTE: /api/admin/bookings/[id]/status
 * 
 * PATCH: Eksekusi tombol aksi cepat kasir:
 * - 'in_progress': Mulai Cukur / Seated
 * - 'completed': Selesai & Kasir Pelunasan
 * - 'no_show': Lepas Kursi & Tandai No-Show (DP Hangus)
 */

import {
  startBookingService,
  completeBookingCheckout,
  markBookingNoShow
} from '../../../../../../lib/admin/service.ts';
import type { CompleteBookingParams, MarkNoShowParams } from '../../../../../../lib/admin/types.ts';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const targetStatus = body.status;

    if (!targetStatus) {
      return Response.json(
        { success: false, error: 'Status target wajib disertakan.' },
        { status: 400 }
      );
    }

    if (targetStatus === 'in_progress') {
      const result = await startBookingService(id);
      if (!result.success) {
        return Response.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      return Response.json({
        success: true,
        message: 'Layanan dimulai. Status booking kini in_progress.',
        booking: result.booking
      });
    }

    if (targetStatus === 'completed') {
      const checkoutParams: CompleteBookingParams = {
        booking_id: id,
        settlement_method: body.settlement_method || 'cash',
        cash_amount_received: body.cash_amount_received,
        notes: body.notes
      };

      const result = await completeBookingCheckout(checkoutParams);
      if (!result.success) {
        return Response.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      return Response.json({
        success: true,
        message: 'Layanan selesai dan kasir berhasil difinalisasi.',
        booking: result.booking,
        change: result.change
      });
    }

    if (targetStatus === 'no_show') {
      const noShowParams: MarkNoShowParams = {
        booking_id: id,
        reason: body.reason
      };

      const result = await markBookingNoShow(noShowParams);
      if (!result.success) {
        return Response.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      return Response.json({
        success: true,
        message: 'Toleransi kedatangan habis. Status diubah menjadi No-Show dan kursi dilepas.',
        booking: result.booking
      });
    }

    return Response.json(
      { success: false, error: `Aksi status '${targetStatus}' tidak didukung.` },
      { status: 400 }
    );
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message || 'Gagal memperbarui status reservasi.' },
      { status: 500 }
    );
  }
}
