/**
 * API ROUTE: /api/admin/reports/daily-csv
 * 
 * GET: Mengunduh rekap pendapatan harian format .CSV (RFC 4180)
 * Penamaan berkas: rekap-damez-YYYY-MM-DD.csv
 */

import { generateDailyRevenueCsv } from '../../../../../lib/admin/service.ts';
import { getJakartaDateString } from '../../../../../lib/utils/timezone.ts';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getJakartaDateString();

    const csvContent = await generateDailyRevenueCsv(date);
    const filename = `rekap-damez-${date}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message || 'Gagal menghasilkan laporan CSV.' },
      { status: 500 }
    );
  }
}
