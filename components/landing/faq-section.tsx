import * as React from "react";
import {
  IconShieldCheck,
  IconCalendarTime,
  IconAlertCircle,
  IconHelpCircle,
} from "@/components/ui/icons";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function FaqSection() {
  return (
    <section id="faq" className="py-16 md:py-24 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-12 sm:mb-16">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">
            Ketentuan & Transparansi
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Kebijakan Operasional & FAQ
          </h2>
          <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Aturan operasional kami buat demi keadilan jadwal bersama, menghormati waktu Anda, dan menghargai waktu kerja para barber.
          </p>
        </div>

        {/* 3 Core Policies Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Kebijakan 1 */}
          <Card className="border-border/80 bg-surface">
            <CardHeader className="pb-2">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 text-primary mb-2">
                <IconShieldCheck size="sm" aria-hidden="true" />
              </div>
              <CardTitle className="text-base font-bold">
                1. Uang Muka Flat Rp 20.000
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Uang muka sebesar Rp 20.000 dibayarkan saat reservasi online melalui scan QRIS. Uang muka ini memotong total tagihan layanan Anda. Sisa biaya dilunasi di kasir toko setelah sesi pangkas selesai, baik tunai maupun transfer QRIS.
              </p>
            </CardContent>
          </Card>

          {/* Kebijakan 2 */}
          <Card className="border-border/80 bg-surface">
            <CardHeader className="pb-2">
              <div className="flex size-11 items-center justify-center rounded-xl bg-secondary/20 border border-secondary/40 text-[#D97706] mb-2">
                <IconCalendarTime size="sm" aria-hidden="true" />
              </div>
              <CardTitle className="text-base font-bold">
                2. Reschedule Bebas H-3 Jam
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Jika ada keperluan mendesak, Anda dapat mengubah jam atau hari kedatangan secara mandiri lewat tautan tiket WhatsApp hingga maksimal 3 jam sebelum jadwal sesi Anda. Uang muka Anda tetap aman dan dialihkan ke jadwal baru.
              </p>
            </CardContent>
          </Card>

          {/* Kebijakan 3 */}
          <Card className="border-border/80 bg-surface">
            <CardHeader className="pb-2">
              <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/15 border border-destructive/30 text-destructive mb-2">
                <IconAlertCircle size="sm" aria-hidden="true" />
              </div>
              <CardTitle className="text-base font-bold">
                3. Toleransi Telat 15 Menit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Kami memberikan waktu tunggu toleransi selama 15 menit dari jam yang Anda pilih. Jika melewati 15 menit tanpa konfirmasi, slot pangkas akan dibuka untuk tamu yang menunggu langsung (walk-in) dan uang muka hangus sebagai kompensasi waktu barber.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6 justify-center sm:justify-start">
            <IconHelpCircle size="sm" className="text-primary" aria-hidden="true" />
            <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Tanya Jawab Penting (FAQ)
            </h3>
          </div>

          <Accordion defaultValue="faq-1" className="w-full">
            <AccordionItem value="faq-1">
              <AccordionTrigger>
                1. Mengapa saya harus membayar uang muka (DP) Rp 20.000 saat booking?
              </AccordionTrigger>
              <AccordionContent>
                Uang muka adalah komitmen dua arah. Dengan membayar DP, kursi dan barber pilihan Anda dikunci oleh sistem selama jam yang Anda tentukan, sehingga tidak akan diberikan kepada orang lain. Langkah ini juga melindungi barber kami dari kerugian waktu akibat pemesan yang tidak hadir tanpa kabar.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2">
              <AccordionTrigger>
                2. Bagaimana cara melunasi sisa tagihan saya di barbershop?
              </AccordionTrigger>
              <AccordionContent>
                Misalnya Anda memilih Gentlemen Classic Haircut seharga Rp 50.000 dan telah membayar DP Rp 20.000 saat booking. Saat pangkas rambut selesai, Anda cukup membayar sisa tagihan sebesar Rp 30.000 di kasir meja depan. Anda dapat membayar menggunakan uang tunai, debit, atau scan QRIS toko.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3">
              <AccordionTrigger>
                3. Apakah saya tetap bisa datang langsung tanpa reservasi (walk-in)?
              </AccordionTrigger>
              <AccordionContent>
                Bisa. Kami tetap menerima tamu langsung jika kursi sedang kosong. Namun, pelanggan yang memiliki tiket reservasi online selalu diprioritaskan. Pada jam padat seperti sore hari atau akhir pekan, waktu tunggu walk-in dapat mencapai 45 hingga 90 menit. Karena itu, kami sangat menyarankan Anda memesan slot jadwal terlebih dahulu.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4">
              <AccordionTrigger>
                4. Apa yang terjadi jika saya datang terlambat lebih dari 15 menit?
              </AccordionTrigger>
              <AccordionContent>
                Jika Anda tiba lebih dari 15 menit melewati jadwal tanpa konfirmasi ke WhatsApp toko, sistem kami otomatis melepaskan slot tersebut demi menjaga ketepatan waktu pelanggan di sesi berikutnya. Uang muka Rp 20.000 dinyatakan hangus untuk mengganti waktu tunggu barber. Jika Anda masih ingin memotong rambut di hari yang sama, Anda akan dialihkan ke daftar tunggu walk-in.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-5">
              <AccordionTrigger>
                5. Bisakah saya memilih barber yang berbeda saat tiba di toko?
              </AccordionTrigger>
              <AccordionContent>
                Pilihan barber disesuaikan dengan data reservasi tiket Anda. Jika barber lain kebetulan sedang kosong tanpa jadwal reservasi berikutnya, staf kami dengan senang hati membantu penyesuaian. Namun jika barber lain sedang memiliki jadwal pemesan lain, Anda akan dilayani oleh barber yang telah Anda tentukan di awal.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-6">
              <AccordionTrigger>
                6. Apakah saya harus membuat akun, kata sandi, atau mengunduh aplikasi untuk memesan?
              </AccordionTrigger>
              <AccordionContent>
                Tidak perlu sama sekali. Sistem kami dirancang tanpa friksi akun. Anda cukup membuka website melalui browser ponsel, memilih layanan, memilih jadwal, dan memasukkan nama serta nomor WhatsApp aktif untuk pengiriman tiket digital.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
}
