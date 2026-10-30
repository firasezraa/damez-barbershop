import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * `/admin` sengaja tidak punya isi sendiri: setelah masuk, staf langsung dibawa
 * ke meja kasir. Tanpa halaman ini, tujuan default setelah login (dan setiap
 * kunjungan ke `/admin`) akan berakhir 404.
 */
export default function AdminIndexPage(): never {
  redirect("/admin/dashboard");
}