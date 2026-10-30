# Bukti R6.5 — sisa permukaan publik

| Berkas | Isi |
|---|---|
| `r65-beranda-1440.png`, `r65b-beranda-1440.png` | beranda penuh: papan hari, gulungan layanan, FAQ enam butir, kaki halaman |
| `r65b-footer.png` | potongan kaki halaman setelah diubah jadi tiga sel |
| `r65-privasi-1440.png` | halaman kebijakan privasi |
| `r65b-privasi-390.png` | halaman yang sama di 390 px |

Rute diperiksa hidup: `/` 200, `/booking` 200, `/kebijakan-privasi` 200. FAQ enam butir
benar-benar ter-render (dihitung di HTML: tiap pertanyaan baru muncul tiga kali = markup + muatan
RSC). Halaman privasi masuk daftar `PAGES` di `tests/e2e/landing-a11y.spec.ts`, jadi ia ikut
gerbang axe di dua viewport — rute tanpa spec adalah rute tanpa bukti.

Satu cacat nyata diperbaiki setelah pemeriksaan mata: di kaki halaman versi pertama, tautan
"Kebijakan privasi" berbagi satu baris dengan kalimat tentang tiket WhatsApp, sehingga kalimat itu
terbaca seperti menempel ke tautan privasi. Kini tiga sel (jam buka · aturan · bantuan) dengan
pemisah garis, dan setiap tautan di barisnya sendiri.

Dua janji di `content/faq-and-microcopy.md` bawaan v1 **tidak** dipindahkan ke halaman karena tidak
ada di kode: penjadwalan ulang mandiri lewat tautan di pesan tiket, dan pengembalian dana otomatis
1x24 jam. Yang tertulis di FAQ adalah yang benar-benar dijalankan sistem.
