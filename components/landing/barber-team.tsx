import * as React from "react";
import { Scissors, Award, Clock, ArrowRight, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

export interface BarberProfile {
  id: string;
  code: string;
  chairNumber: number;
  name: string;
  title: string;
  experienceYears: number;
  nickname: string;
  specialties: string[];
  personality: string;
  statusText: string;
}

export const BARBERS_DATA: BarberProfile[] = [
  {
    id: "bbr-01",
    code: "BBR-01",
    chairNumber: 1,
    name: "Rian Pratama",
    title: "Senior Master Barber",
    experienceYears: 6,
    nickname: "The Sculptor",
    specialties: [
      "Classic Pompadour",
      "Sidepart Belah Samping",
      "Layer Gunting Halus",
    ],
    personality:
      "Teliti pada proporsi bentuk wajah dan senang berdiskusi santai mengenai arah penataan rambut sehari-hari.",
    statusText: "Bertugas di Kursi 1 (10:00 - 21:00 WIB)",
  },
  {
    id: "bbr-02",
    code: "BBR-02",
    chairNumber: 2,
    name: "Dimas Arisandi",
    title: "Clipper & Fade Specialist",
    experienceYears: 5,
    nickname: "Fade Master",
    specialties: [
      "Skin Fade Presisi",
      "Mid Taper",
      "Textured Crop",
      "Sharp Lineup",
    ],
    personality:
      "Bekerja cepat, rapi, dan memiliki ketelitian tinggi pada gradasi warna rambut dari kulit kepala ke bagian atas.",
    statusText: "Bertugas di Kursi 2 (10:00 - 21:00 WIB)",
  },
  {
    id: "bbr-03",
    code: "BBR-03",
    chairNumber: 3,
    name: "Kevin Sanjaya",
    title: "Grooming & Shave Master",
    experienceYears: 7,
    nickname: "Grooming Specialist",
    specialties: [
      "Royal Hot Towel Shave",
      "Kontur Jenggot Rapi",
      "Pijat Relaksasi Kepala",
    ],
    personality:
      "Ahli dalam teknik pisau cukur tradisional yang lembut di kulit sensitif dan memberikan pengalaman rileks maksimal.",
    statusText: "Bertugas di Kursi 3 (10:00 - 21:00 WIB)",
  },
];

export function BarberTeam() {
  return (
    <section id="barber" className="py-16 md:py-24 border-t border-border/40 bg-surface/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-12 sm:mb-16">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">
            Tiga Sosok Pengrajin
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Master Barber Kami
          </h2>
          <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Tiga kursi kerja aktif yang siap melayani Anda setiap hari. Anda memegang kendali penuh atas siapa yang menangani rambut Anda.
          </p>
        </div>

        {/* Barber Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BARBERS_DATA.map((barber) => (
            <Card
              key={barber.id}
              hoverEffect
              className="flex flex-col justify-between overflow-hidden border-border/80"
            >
              {/* Top Accent & Chair Identity */}
              <div className="bg-surface-elevated/70 border-b border-border/80 p-6 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="primary" className="text-xs">
                    Kursi {barber.chairNumber}
                  </Badge>
                  <span className="text-xs font-mono font-semibold text-primary">
                    {barber.experienceYears} Tahun Pengalaman
                  </span>
                </div>

                {/* Barber Visual Icon Frame */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface border border-primary/40 text-primary shadow-inner">
                    <Scissors className="size-6 rotate-45" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {barber.name}
                    </h3>
                    <p className="text-xs font-medium text-primary">
                      {barber.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground italic mt-0.5">
                      &quot;{barber.nickname}&quot;
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Content: Specialties & Personality */}
              <CardContent className="flex-1 p-6 flex flex-col gap-4">
                {/* Status Bertugas */}
                <div className="inline-flex items-center gap-2 rounded-lg bg-[#064E3B]/40 border border-[#064E3B] px-3 py-1.5 text-xs font-medium text-[#34D399]">
                  <span className="size-2 rounded-full bg-[#34D399] animate-pulse" />
                  <span>{barber.statusText}</span>
                </div>

                {/* Keahlian Spesifik */}
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block mb-2">
                    Keahlian Utama:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {barber.specialties.map((spec, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-surface-elevated border border-border px-2 py-1 text-[11px] font-medium text-foreground"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Karakter Pengerjaan */}
                <div className="mt-2 text-xs text-muted-foreground leading-relaxed bg-surface/60 rounded-xl p-3 border border-border/60">
                  <span className="font-semibold text-foreground block mb-1">
                    Karakter Layanan:
                  </span>
                  {barber.personality}
                </div>
              </CardContent>

              {/* Card Footer: Booking Action */}
              <CardFooter className="p-6 pt-0 border-t border-border/40 mt-auto">
                <a
                  href={`/book?barber=${barber.code}`}
                  className="w-full"
                >
                  <Button
                    variant="primary"
                    size="default"
                    className="w-full justify-between"
                  >
                    <span>Booking dengan {barber.name.split(" ")[0]}</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
