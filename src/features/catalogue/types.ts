/** Tipe katalog publik, dipisah dari query supaya aman diimpor komponen klien. */

export type PublicService = {
  id: string;
  name: string;
  slug: string;
  category: string;
  durationMinutes: number;
  priceIdr: number;
  description: string | null;
  recommended: boolean;
};

export type PublicBarber = {
  id: string;
  fullName: string;
  nickname: string | null;
  title: string | null;
  chairNumber: number;
  specialty: string | null;
  bio: string | null;
  dayOff: number;
};

/** Rupiah tanpa desimal, format Indonesia. */
export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}
