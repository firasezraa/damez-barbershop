"use client";

import * as React from "react";
import {
  IconUser,
  IconPhone,
  IconMessage,
  IconShieldCheck,
  IconCheck,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateIndonesianPhone } from "./utils";
import { cn } from "@/lib/utils";

interface Step4ContactProps {
  customerName: string;
  customerPhone: string;
  notes: string;
  agreedToPDP: boolean;
  onUpdateName: (name: string) => void;
  onUpdatePhone: (phone: string) => void;
  onUpdateNotes: (notes: string) => void;
  onTogglePDP: (agreed: boolean) => void;
}

export function Step4Contact({
  customerName,
  customerPhone,
  notes,
  agreedToPDP,
  onUpdateName,
  onUpdatePhone,
  onUpdateNotes,
  onTogglePDP,
}: Step4ContactProps) {
  const [phoneTouched, setPhoneTouched] = React.useState(false);
  const [nameTouched, setNameTouched] = React.useState(false);

  const phoneValidation = React.useMemo(() => {
    return validateIndonesianPhone(customerPhone);
  }, [customerPhone]);

  const isNameValid = customerName.trim().length >= 2;

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Step Header */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Langkah 4 dari 5
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Masukkan Kontak untuk Pengiriman Tiket
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Kami tidak mewajibkan pembuatan akun atau kata sandi. Cukup masukkan nama dan nomor WhatsApp aktif untuk menerima tiket digital dan pengingat jadwal.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Full Name Field */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="customer_name" requiredIndicator>
            Nama Lengkap
          </Label>
          <div className="relative">
            <Input
              id="customer_name"
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Contoh: Budi Santoso"
              value={customerName}
              onChange={(e) => onUpdateName(e.target.value)}
              onBlur={() => setNameTouched(true)}
              error={nameTouched && !isNameValid}
              className="pl-11"
            />
            <IconUser size="sm" className="absolute left-3.5 top-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
          </div>
          <p className="text-xs text-muted-foreground">
            Gunakan nama panggilan atau nama lengkap yang mudah dikenali saat tiba di kasir.
          </p>
          {nameTouched && !isNameValid && (
            <span className="text-xs text-destructive font-medium">
              Nama lengkap minimal 2 karakter.
            </span>
          )}
        </div>

        {/* WhatsApp Phone Field */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="customer_phone" requiredIndicator>
            Nomor WhatsApp Aktif
          </Label>
          <div className="relative">
            <Input
              id="customer_phone"
              type="tel"
              inputMode="tel"
              name="tel"
              autoComplete="tel"
              placeholder="Contoh: 081234567890"
              value={customerPhone}
              onChange={(e) => onUpdatePhone(e.target.value)}
              onBlur={() => {
                setPhoneTouched(true);
                if (phoneValidation.isValid && phoneValidation.normalized && phoneValidation.normalized !== customerPhone) {
                  onUpdatePhone(phoneValidation.normalized);
                }
              }}
              error={phoneTouched && !phoneValidation.isValid}
              className="pl-11 font-mono"
            />
            <IconPhone size="sm" className="absolute left-3.5 top-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
          </div>
          <p className="text-xs text-muted-foreground">
            Pastikan nomor terhubung dengan aplikasi WhatsApp untuk menerima tiket dan peta rute.
          </p>
          {phoneTouched && !phoneValidation.isValid && (
            <span className="text-xs text-destructive font-medium">
              {phoneValidation.errorMessage}
            </span>
          )}
        </div>

        {/* Barber Notes Field (Optional) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="booking_notes">
              Catatan untuk Barber
            </Label>
            <span className="text-[11px] text-muted-foreground font-medium">
              Opsional
            </span>
          </div>
          <div className="relative">
            <textarea
              id="booking_notes"
              rows={3}
              maxLength={250}
              placeholder="Contoh: Opsi Quiet Cut (tanpa percakapan selain potongan), kulit kepala sensitif, atau model khusus."
              value={notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              className={cn(
                "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm transition-colors",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary",
                "resize-none"
              )}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-muted-foreground">
            <span>Sampaikan preferensi kenyamanan atau kebutuhan spesifik Anda.</span>
            <span>{notes.length}/250</span>
          </div>
        </div>

        {/* UU PDP Consent Checkbox */}
        <div
          onClick={() => onTogglePDP(!agreedToPDP)}
          role="checkbox"
          aria-checked={agreedToPDP}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              onTogglePDP(!agreedToPDP);
            }
          }}
          className={cn(
            "flex items-start gap-3 rounded-2xl border p-4 transition-all cursor-pointer select-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            agreedToPDP
              ? "border-primary/50 bg-primary/5"
              : "border-border bg-surface hover:border-primary/30 hover:bg-surface-elevated"
          )}
        >
          <div
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all",
              agreedToPDP
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-surface-elevated text-transparent"
            )}
          >
            <IconCheck size="micro" stroke={3} aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <IconShieldCheck size="micro" className="text-primary" aria-hidden="true" />
              Persetujuan Pelindungan Data Pribadi (UU PDP No. 27/2022)
            </span>
            <p>
              Saya menyetujui nomor WhatsApp saya digunakan oleh Damez Barbershop semata-mata untuk pengiriman konfirmasi jadwal, tiket reservasi, dan pengingat kunjungan sesuai Kebijakan Privasi. Data Anda tidak akan dibagikan kepada pihak ketiga mana pun.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
