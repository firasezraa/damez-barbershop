import * as React from "react";
import {
  MapPin,
  Clock,
  Car,
  Train,
  Wifi,
  Phone,
  Mail,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function LocationMap() {
  return (
    <section id="lokasi" className="py-16 md:py-24 border-t border-border/40 bg-surface/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-12 sm:mb-16">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">
            Akses & Peta Lokasi
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Lokasi Toko & Jam Buka
          </h2>
          <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Keterangan lokasi yang akurat untuk memudahkan kedatangan Anda tepat waktu di Senopati.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Details, Hours, Transit */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* Address Card */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
              <div className="flex items-center gap-3 mb-3 text-primary">
                <MapPin className="size-5" />
                <h3 className="font-display text-lg font-bold text-foreground">
                  Alamat Resmi
                </h3>
              </div>
              <p className="text-sm font-semibold text-foreground">
                Damez Barbershop
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Jl. Senopati Raya No. 42, RT 01 / RW 02, Kebayoran Baru, Jakarta Selatan 12190
              </p>
              <div className="mt-3 rounded-xl bg-surface-elevated p-3 border border-border text-xs text-muted-foreground">
                <span className="font-semibold text-primary block mb-0.5">Patokan:</span>
                100 meter di sebelah barat bundaran Senopati, persis di seberang kafe kopi lokal.
              </div>

              <div className="mt-4 pt-4 border-t border-border/60">
                <a
                  href="https://maps.google.com/?q=-6.229746,106.808945"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-block"
                >
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    <Navigation className="size-3.5 text-primary" />
                    <span>Buka Peta Rute di Google Maps</span>
                    <ExternalLink className="size-3.5 text-muted-foreground ml-auto" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Operating Hours Card */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
              <div className="flex items-center gap-3 mb-3 text-primary">
                <Clock className="size-5" />
                <h3 className="font-display text-lg font-bold text-foreground">
                  Jam Operasional
                </h3>
              </div>
              <div className="flex flex-col gap-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Senin sampai Minggu:</span>
                  <span className="font-mono font-bold text-foreground">10:00 - 21:00 WIB</span>
                </div>
                <div className="flex items-center justify-between py-1 text-primary font-medium">
                  <span>Sesi Terakhir di Kursi:</span>
                  <span className="font-mono font-bold">20:00 WIB</span>
                </div>
              </div>
            </div>

            {/* Parking & Transit Card */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-md flex flex-col gap-4 text-xs">
              <div className="flex items-start gap-3">
                <Car className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">Area Parkir Mandiri:</span>
                  <span className="text-muted-foreground">
                    Halaman parkir khusus mobil dan sepeda motor tepat di depan pintu masuk barbershop.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Train className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">Transportasi Publik MRT:</span>
                  <span className="text-muted-foreground">
                    Berjarak 5 menit berjalan kaki dari Halte MRT Senayan atau MRT Istora Mandiri.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Wifi className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">Fasilitas Ruang:</span>
                  <span className="text-muted-foreground">
                    Pendingin ruangan sejuk, koneksi Wi-Fi gratis 100 Mbps, toilet tamu bersih, seduhan kopi dingin.
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Contact Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3.5 hover:border-primary/50 transition-colors"
              >
                <Phone className="size-4 text-primary" />
                <div>
                  <span className="text-muted-foreground block text-[10px]">WhatsApp Resmi</span>
                  <span className="font-mono font-bold text-foreground">+62 812-3456-7890</span>
                </div>
              </a>
              <a
                href="mailto:booking@damezbarber.com"
                className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3.5 hover:border-primary/50 transition-colors"
              >
                <Mail className="size-4 text-primary" />
                <div>
                  <span className="text-muted-foreground block text-[10px]">Surel Pertanyaan</span>
                  <span className="font-bold text-foreground truncate">booking@damezbarber.com</span>
                </div>
              </a>
            </div>
          </div>

          {/* Right Column: Google Maps Interactive Embed */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
              <iframe
                title="Peta Lokasi Damez Barbershop Senopati"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.2828694082696!2d106.80637007586822!3d-6.229746361007875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f15039f046a3%3A0x63391b12b238e94e!2sJl.%20Senopati%2C%20Kby.%20Baru%2C%20Kota%20Jakarta%20Selatan!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
                width="100%"
                height="100%"
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) contrast(1.1) brightness(0.9)" }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full"
              />

              {/* Floating Map Label */}
              <div className="absolute top-4 left-4 z-10 rounded-xl bg-surface/90 border border-border px-3.5 py-2 shadow-lg backdrop-blur-md">
                <span className="text-xs font-bold text-foreground block">Damez Barbershop Senopati</span>
                <span className="text-[10px] text-primary">Titik Koordinat: -6.229746, 106.808945</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
