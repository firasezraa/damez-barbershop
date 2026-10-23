import * as React from "react";
import Link from "next/link";
import {
  IconScissors,
  IconMapPin,
  IconPhone,
  IconMail,
  IconShieldCheck,
} from "@/components/ui/icons";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface text-muted-foreground pb-24 md:pb-12 pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-surface-elevated border border-primary/40 text-primary">
                <IconScissors size="sm" className="rotate-45" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold tracking-wider text-foreground">
                  DAMEZ BARBERSHOP
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Senopati, Jakarta Selatan (Est. 2024)
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Memadukan tradisi pangkas rambut klasik dengan kenyamanan ruang santai pria modern dan kepastian reservasi tanpa antre.
            </p>
          </div>

          {/* Navigasi Cepat */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-foreground font-display tracking-wider">
              Navigasi Halaman
            </h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <a href="#layanan" className="hover:text-primary transition-colors">
                  Paket Layanan & Tarif
                </a>
              </li>
              <li>
                <a href="#barber" className="hover:text-primary transition-colors">
                  Profil Tiga Master Barber
                </a>
              </li>
              <li>
                <a href="#kisah-kami" className="hover:text-primary transition-colors">
                  Kisah Kami & Filosofi Pangkas
                </a>
              </li>
              <li>
                <a href="#galeri" className="hover:text-primary transition-colors">
                  Galeri Suasana Toko
                </a>
              </li>
              <li>
                <a href="#lokasi" className="hover:text-primary transition-colors">
                  Lokasi & Akses MRT Senopati
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary transition-colors">
                  Kebijakan DP & Tanya Jawab FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Jam Operasional */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-foreground font-display tracking-wider">
              Jam Operasional
            </h4>
            <div className="flex flex-col gap-1.5 text-xs">
              <p className="text-foreground font-semibold">Senin - Minggu</p>
              <p className="font-mono text-primary font-bold">10:00 - 21:00 WIB</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Sesi pangkas terakhir pukul 20:00 WIB. Reservasi online beroperasi 24 jam.
              </p>
            </div>
          </div>

          {/* Hubungi Kami & Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-foreground font-display tracking-wider">
              Kontak & Bantuan
            </h4>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2">
                <IconMapPin size="micro" className="text-primary shrink-0" aria-hidden="true" />
                <span className="line-clamp-2">Jl. Senopati Raya No. 42, Jakarta Selatan</span>
              </div>
              <div className="flex items-center gap-2">
                <IconPhone size="micro" className="text-primary shrink-0" aria-hidden="true" />
                <span className="font-mono">+62 812-3456-7890</span>
              </div>
              <div className="flex items-center gap-2">
                <IconMail size="micro" className="text-primary shrink-0" aria-hidden="true" />
                <span>booking@damezbarber.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-border/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-center sm:text-left">
            &copy; 2026 Damez Barbershop. Seluruh Hak Cipta Dilindungi Undang-Undang.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <IconShieldCheck size="micro" className="text-primary shrink-0" aria-hidden="true" />
            <span>Kepatuhan Privasi Konsumen (UU PDP No. 27 Tahun 2022)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
