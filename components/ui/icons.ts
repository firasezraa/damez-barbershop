/**
 * DAMEZ BARBERSHOP - TABLER ICONS DESIGN SYSTEM MAPPING DICTIONARY
 * 
 * Sistem Ikonografi Berstandar Tabler Icons (v3.46.0+)
 * Grid: 24x24 base bounding box dengan optical padding seragam.
 * Stroke: 2px default (scalable to 1.75px micro, 1.5px hero).
 * Style: stroke-linecap="round", stroke-linejoin="round", stroke="currentColor", fill="none".
 * 
 * Sesuai panduan Token-Driven Architecture (DESIGN.md) & WCAG 2.1 Level AA.
 */

import React from "react";

// ============================================================================
// 1. TYPES & SIZE TOKEN CONTRACTS
// ============================================================================

export type IconSizeToken = "micro" | "sm" | "md" | "lg" | "xl";

export interface IconSizeConfig {
  size: number;
  stroke: number;
  className: string;
}

export const ICON_SIZE_TOKENS: Record<IconSizeToken, IconSizeConfig> = {
  micro: { size: 16, stroke: 1.75, className: "w-4 h-4" },
  sm: { size: 20, stroke: 2.0, className: "w-5 h-5" },
  md: { size: 24, stroke: 2.0, className: "w-6 h-6" },
  lg: { size: 32, stroke: 1.5, className: "w-8 h-8" },
  xl: { size: 48, stroke: 1.5, className: "w-12 h-12" },
};

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "size" | "stroke"> {
  size?: number | string | IconSizeToken;
  stroke?: number | string;
  color?: string;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
}

export type TablerIcon = React.FC<IconProps>;

/**
 * Factory untuk membuat komponen Tabler Icon SVG berstandar 24x24 px
 */
function createTablerIcon(
  displayName: string,
  paths: React.ReactNode,
  defaultAriaLabel?: string
): TablerIcon {
  const Component: TablerIcon = ({
    size = 24,
    stroke,
    color = "currentColor",
    className = "",
    children,
    ...restProps
  }) => {
    // Resolusi ukuran & ketebalan garis berdasarkan Size Token atau nilai numerik
    let resolvedSize = 24;
    let resolvedStroke = 2;

    if (typeof size === "string" && size in ICON_SIZE_TOKENS) {
      const config = ICON_SIZE_TOKENS[size as IconSizeToken];
      resolvedSize = config.size;
      resolvedStroke = stroke !== undefined ? Number(stroke) : config.stroke;
    } else {
      resolvedSize = Number(size) || 24;
      resolvedStroke = stroke !== undefined ? Number(stroke) : (resolvedSize <= 16 ? 1.75 : resolvedSize >= 32 ? 1.5 : 2);
    }

    const explicitLabel = restProps["aria-label"];
    const isExplicitlyInteractive = Boolean(explicitLabel) || restProps["aria-hidden"] === false || restProps["aria-hidden"] === "false";
    const ariaHidden = isExplicitlyInteractive ? undefined : "true";
    const ariaLabel = isExplicitlyInteractive ? (explicitLabel || defaultAriaLabel) : undefined;
    const role = isExplicitlyInteractive ? "img" : undefined;

    return React.createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        width: resolvedSize,
        height: resolvedSize,
        fill: "none",
        stroke: color,
        strokeWidth: resolvedStroke,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: `tabler-icon tabler-icon-${displayName.toLowerCase()} ${className}`.trim(),
        role,
        "aria-hidden": ariaHidden,
        "aria-label": ariaLabel,
        ...restProps,
      },
      React.createElement("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
      paths,
      children
    );
  };

  Component.displayName = displayName;
  return Component;
}

// ============================================================================
// 2. THE 10 CANONICAL BARBERSHOP TABLER ICONS (CURATED SET)
// ============================================================================

/**
 * 1. IconScissors (Gunting Cukur)
 * Representasi: Layanan Pangkas Rambut Klasik, Fade, & Haircut Catalog
 */
export const IconScissors = createTablerIcon(
  "IconScissors",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M3 7a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }),
    React.createElement("path", { d: "M3 17a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" }),
    React.createElement("path", { d: "M8.6 8.6l10.4 10.4" }),
    React.createElement("path", { d: "M8.6 15.4l10.4 -10.4" })
  ),
  "Gunting Cukur"
);

/**
 * 2. IconRazor (Silet / Straight Razor)
 * Representasi: Layanan Cukur Jenggot, Kumis, Hot Towel Shave, Line-up Presisi
 */
export const IconRazor = createTablerIcon(
  "IconRazor",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M7 3h10v4h-10l0 -4" }),
    React.createElement("path", { d: "M12 7v4" }),
    React.createElement("path", { d: "M12 11a2 2 0 0 1 2 2v6a2 2 0 1 1 -4 0v-6a2 2 0 0 1 2 -2" })
  ),
  "Pisau Cukur Silet"
);

/**
 * 3. IconWash (Cuci Rambut / Hair Wash)
 * Representasi: Cuci Rambut 2x, Scalp Cleansing, Keramas Higienis
 */
export const IconWash = createTablerIcon(
  "IconWash",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", {
      d: "M3.486 8.965c.168 .02 .34 .033 .514 .035c.79 .009 1.539 -.178 2 -.5c.461 -.32 1.21 -.507 2 -.5c.79 -.007 1.539 .18 2 .5c.461 .322 1.21 .509 2 .5c.79 .009 1.539 -.178 2 -.5c.461 -.32 1.21 -.507 2 -.5c.79 -.007 1.539 .18 2 .5c.461 .322 1.21 .509 2 .5c.17 0 .339 -.014 .503 -.034",
    }),
    React.createElement("path", {
      d: "M3 6l1.721 10.329a2 2 0 0 0 1.973 1.671h10.612a2 2 0 0 0 1.973 -1.671l1.721 -10.329",
    })
  ),
  "Cuci Rambut Keramas"
);

/**
 * 4. IconSparkles (Creambath / Spa / Signature Full Grooming)
 * Representasi: Scalp Therapy, Head Massage, Paket Kombo Signature
 */
export const IconSparkles = createTablerIcon(
  "IconSparkles",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", {
      d: "M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6",
    })
  ),
  "Perawatan Spa & Grooming"
);

/**
 * 5. IconCalendarEvent (Kalender Slot Booking)
 * Representasi: Pemilihan Tanggal Booking (Window 7 Hari WIB)
 */
export const IconCalendarEvent = createTablerIcon(
  "IconCalendarEvent",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12" }),
    React.createElement("path", { d: "M16 3l0 4" }),
    React.createElement("path", { d: "M8 3l0 4" }),
    React.createElement("path", { d: "M4 11l16 0" }),
    React.createElement("path", { d: "M8 15h2v2h-2l0 -2" })
  ),
  "Kalender Jadwal Booking"
);

/**
 * 6. IconClock (Jam Dinding / Durasi Layanan & Countdown)
 * Representasi: Jam Slot Booking, Estimasi Durasi (45-60 min), Countdown Hold 15m
 */
export const IconClock = createTablerIcon(
  "IconClock",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" }),
    React.createElement("path", { d: "M12 7v5l3 3" })
  ),
  "Waktu & Jam Operasional"
);

/**
 * 7. IconQrcode (Metode Bayar QRIS Instan)
 * Representasi: QRIS Statis/Dinamis untuk Pembayaran DP Flat Rp 20.000
 */
export const IconQrcode = createTablerIcon(
  "IconQrcode",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M4 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" }),
    React.createElement("path", { d: "M7 17l0 .01" }),
    React.createElement("path", { d: "M14 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" }),
    React.createElement("path", { d: "M7 7l0 .01" }),
    React.createElement("path", { d: "M4 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" }),
    React.createElement("path", { d: "M17 7l0 .01" }),
    React.createElement("path", { d: "M14 14l3 0" }),
    React.createElement("path", { d: "M20 14l0 .01" }),
    React.createElement("path", { d: "M14 14l0 3" }),
    React.createElement("path", { d: "M14 20l3 0" }),
    React.createElement("path", { d: "M17 17l3 0" }),
    React.createElement("path", { d: "M20 17l0 3" })
  ),
  "Kode QRIS"
);

/**
 * 8. IconCreditCard (Metode Bayar Kartu / Midtrans Snap)
 * Representasi: Pembayaran Online via Debit, Visa, Mastercard, Virtual Account
 */
export const IconCreditCard = createTablerIcon(
  "IconCreditCard",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M3 8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3l0 -8" }),
    React.createElement("path", { d: "M3 10l18 0" }),
    React.createElement("path", { d: "M7 15l.01 0" }),
    React.createElement("path", { d: "M11 15l2 0" })
  ),
  "Kartu Pembayaran & Midtrans Snap"
);

/**
 * 9. IconCheck (Checkmark Sukses)
 * Representasi: Status Booking Confirmed, Form Validation Success, Item Selected
 */
export const IconCheck = createTablerIcon(
  "IconCheck",
  React.createElement("path", { d: "M5 12l5 5l10 -10" }),
  "Berhasil"
);

/**
 * 10. IconMapPin (Map Pin Studio)
 * Representasi: Lokasi Fisik Damez Barbershop (Senopati, Jakarta Selatan)
 */
export const IconMapPin = createTablerIcon(
  "IconMapPin",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" }),
    React.createElement("path", { d: "M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" })
  ),
  "Lokasi Barbershop"
);

/**
 * 11. IconBrandWhatsapp (Kontak WhatsApp)
 * Representasi: Customer Support, Dispatcher Notifikasi Konfirmasi & Reminder
 */
export const IconBrandWhatsapp = createTablerIcon(
  "IconBrandWhatsapp",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" }),
    React.createElement("path", { d: "M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" })
  ),
  "WhatsApp Resmi"
);

// ============================================================================
// 3. SECONDARY & UI ACTION ICONS (TABLER ECOSYSTEM)
// ============================================================================

export const IconTicket = createTablerIcon(
  "IconTicket",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M15 5l0 2" }),
    React.createElement("path", { d: "M15 11l0 2" }),
    React.createElement("path", { d: "M15 17l0 2" }),
    React.createElement("path", { d: "M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-3a2 2 0 0 0 0 -4v-3a2 2 0 0 1 2 -2" })
  ),
  "Tiket Digital Boarding Pass"
);

export const IconCircleCheck = createTablerIcon(
  "IconCircleCheck",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" }),
    React.createElement("path", { d: "M9 12l2 2l4 -4" })
  ),
  "Status Terverifikasi"
);

export const IconShieldCheck = createTablerIcon(
  "IconShieldCheck",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -.09 7.06" }),
    React.createElement("path", { d: "M15 19l2 2l4 -4" })
  ),
  "Keamanan Terjamin"
);

export const IconLoader2 = createTablerIcon(
  "IconLoader2",
  React.createElement("path", { d: "M12 3a9 9 0 1 0 9 9" }),
  "Memuat data..."
);

export const IconAlertTriangle = createTablerIcon(
  "IconAlertTriangle",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M12 9v4" }),
    React.createElement("path", { d: "M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" }),
    React.createElement("path", { d: "M12 16h.01" })
  ),
  "Peringatan Waktu Kedaluwarsa"
);

export const IconAlertCircle = createTablerIcon(
  "IconAlertCircle",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" }),
    React.createElement("path", { d: "M12 8v4" }),
    React.createElement("path", { d: "M12 16h.01" })
  ),
  "Informasi Notifikasi"
);

export const IconAlertOctagon = createTablerIcon(
  "IconAlertOctagon",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M12.802 2.165l5.575 2.389c.48 .206 .863 .589 1.07 1.07l2.388 5.574c.22 .512 .22 1.092 0 1.604l-2.389 5.575c-.206 .48 -.589 .863 -1.07 1.07l-5.574 2.388c-.512 .22 -1.092 .22 -1.604 0l-5.575 -2.389a2.036 2.036 0 0 1 -1.07 -1.07l-2.388 -5.574a2.036 2.036 0 0 1 0 -1.604l2.389 -5.575c.206 -.48 .589 -.863 1.07 -1.07l5.574 -2.388a2.036 2.036 0 0 1 1.604 0" }),
    React.createElement("path", { d: "M12 8v4" }),
    React.createElement("path", { d: "M12 16h.01" })
  ),
  "Peringatan Kritis"
);

export const IconLock = createTablerIcon(
  "IconLock",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6" }),
    React.createElement("path", { d: "M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" }),
    React.createElement("path", { d: "M8 11v-4a4 4 0 1 1 8 0v4" })
  ),
  "Slot Terkunci"
);

export const IconArrowRight = createTablerIcon(
  "IconArrowRight",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M5 12l14 0" }),
    React.createElement("path", { d: "M13 18l6 -6" }),
    React.createElement("path", { d: "M13 6l6 6" })
  ),
  "Lanjut"
);

export const IconArrowLeft = createTablerIcon(
  "IconArrowLeft",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M5 12l14 0" }),
    React.createElement("path", { d: "M5 12l6 6" }),
    React.createElement("path", { d: "M5 12l6 -6" })
  ),
  "Kembali"
);

export const IconChevronDown = createTablerIcon(
  "IconChevronDown",
  React.createElement("path", { d: "M6 9l6 6l6 -6" }),
  "Buka Detail"
);

export const IconChevronRight = createTablerIcon(
  "IconChevronRight",
  React.createElement("path", { d: "M9 6l6 6l-6 6" }),
  "Navigasi Kanan"
);

export const IconUsers = createTablerIcon(
  "IconUsers",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" }),
    React.createElement("path", { d: "M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" }),
    React.createElement("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }),
    React.createElement("path", { d: "M21 21v-2a4 4 0 0 0 -3 -3.85" })
  ),
  "Tim Master Barber"
);

export const IconUser = createTablerIcon(
  "IconUser",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" }),
    React.createElement("path", { d: "M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" })
  ),
  "Pelanggan"
);

export const IconUserCheck = createTablerIcon(
  "IconUserCheck",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" }),
    React.createElement("path", { d: "M6 21v-2a4 4 0 0 1 4 -4h4" }),
    React.createElement("path", { d: "M15 19l2 2l4 -4" })
  ),
  "Barber Siap Bertugas"
);

export const IconUserPlus = createTablerIcon(
  "IconUserPlus",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" }),
    React.createElement("path", { d: "M16 19h6" }),
    React.createElement("path", { d: "M19 16v6" }),
    React.createElement("path", { d: "M6 21v-2a4 4 0 0 1 4 -4h4" })
  ),
  "Tambah Walk-in"
);

export const IconAward = createTablerIcon(
  "IconAward",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M6 9a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" }),
    React.createElement("path", { d: "M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889" }),
    React.createElement("path", { d: "M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" })
  ),
  "Penghargaan Master Barber"
);

export const IconPhone = createTablerIcon(
  "IconPhone",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" })
  ),
  "Telepon Langsung"
);

export const IconMail = createTablerIcon(
  "IconMail",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10" }),
    React.createElement("path", { d: "M3 7l9 6l9 -6" })
  ),
  "Email Resmi"
);

export const IconMenu2 = createTablerIcon(
  "IconMenu2",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M4 6l16 0" }),
    React.createElement("path", { d: "M4 12l16 0" }),
    React.createElement("path", { d: "M4 18l16 0" })
  ),
  "Buka Menu Navigasi"
);

export const IconX = createTablerIcon(
  "IconX",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M18 6l-12 12" }),
    React.createElement("path", { d: "M6 6l12 12" })
  ),
  "Tutup"
);

export const IconCash = createTablerIcon(
  "IconCash",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M7 15h-3a1 1 0 0 1 -1 -1v-8a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v3" }),
    React.createElement("path", { d: "M7 10a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1l0 -8" }),
    React.createElement("path", { d: "M12 14a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" })
  ),
  "Uang Tunai Kasir"
);

export const IconCurrencyDollar = createTablerIcon(
  "IconCurrencyDollar",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2" }),
    React.createElement("path", { d: "M12 3v3m0 12v3" })
  ),
  "Nominal Pembayaran"
);

export const IconStar = createTablerIcon(
  "IconStar",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245" })
  ),
  "Bintang Rating"
);

export const IconCamera = createTablerIcon(
  "IconCamera",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" }),
    React.createElement("path", { d: "M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" })
  ),
  "Galeri Potongan Rambut"
);

export const IconEye = createTablerIcon(
  "IconEye",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" }),
    React.createElement("path", { d: "M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" })
  ),
  "Lihat Detail"
);

export const IconChartBar = createTablerIcon(
  "IconChartBar",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -6" }),
    React.createElement("path", { d: "M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -10" }),
    React.createElement("path", { d: "M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -14" }),
    React.createElement("path", { d: "M4 20h14" })
  ),
  "Statistik & Telemetri"
);

export const IconRefresh = createTablerIcon(
  "IconRefresh",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" }),
    React.createElement("path", { d: "M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" })
  ),
  "Muat Ulang"
);

export const IconExternalLink = createTablerIcon(
  "IconExternalLink",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" }),
    React.createElement("path", { d: "M11 13l9 -9" }),
    React.createElement("path", { d: "M15 4h5v5" })
  ),
  "Buka Tautan Luar"
);

export const IconCalendar = createTablerIcon(
  "IconCalendar",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" }),
    React.createElement("path", { d: "M16 3v4" }),
    React.createElement("path", { d: "M8 3v4" }),
    React.createElement("path", { d: "M4 11h16" }),
    React.createElement("path", { d: "M11 15h1" }),
    React.createElement("path", { d: "M12 15v3" })
  ),
  "Kalender"
);

export const IconCalendarTime = createTablerIcon(
  "IconCalendarTime",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M11.795 21h-6.795a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v4" }),
    React.createElement("path", { d: "M14 18a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" }),
    React.createElement("path", { d: "M15 3v4" }),
    React.createElement("path", { d: "M7 3v4" }),
    React.createElement("path", { d: "M3 11h16" }),
    React.createElement("path", { d: "M18 16.496v1.504l1 1" })
  ),
  "Jadwal Waktu Slot"
);

export const IconDeviceMobile = createTablerIcon(
  "IconDeviceMobile",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M6 5a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14" }),
    React.createElement("path", { d: "M11 4h2" }),
    React.createElement("path", { d: "M12 17v.01" })
  ),
  "Ponsel Smartphone"
);

export const IconMessage = createTablerIcon(
  "IconMessage",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M8 9h8" }),
    React.createElement("path", { d: "M8 13h6" }),
    React.createElement("path", { d: "M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12" })
  ),
  "Pesan & Catatan Khusus"
);

export const IconSun = createTablerIcon(
  "IconSun",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("circle", { cx: "12", cy: "12", r: "4" }),
    React.createElement("path", { d: "M3 12h1m8 -9v1m8 8h1m-9 8v1M5.6 5.6l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" })
  ),
  "Sesi Pagi"
);

export const IconMoon = createTablerIcon(
  "IconMoon",
  React.createElement(
    "path",
    { d: "M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" }
  ),
  "Sesi Sore & Malam"
);

export const IconArmchair = createTablerIcon(
  "IconArmchair",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M5 11a2 2 0 0 1 2 2v2H5z" }),
    React.createElement("path", { d: "M19 11a2 2 0 0 1 2 2v2h-2z" }),
    React.createElement("path", { d: "M5 11V6a3 3 0 0 1 3 -3h8a3 3 0 0 1 3 3v5" }),
    React.createElement("path", { d: "M6 19v2" }),
    React.createElement("path", { d: "M18 19v2" }),
    React.createElement("path", { d: "M4 15h16v4H4z" })
  ),
  "Kursi Barber"
);

export const IconCopy = createTablerIcon(
  "IconCopy",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M7 9.667A2.667 2.667 0 0 1 9.667 7h8.666A2.667 2.667 0 0 1 21 9.667v8.666A2.667 2.667 0 0 1 18.333 21H9.667A2.667 2.667 0 0 1 7 18.333V9.667z" }),
    React.createElement("path", { d: "M4.012 16.737A2.005 2.005 0 0 1 3 15V5c0-1.1.9-2 2-2h10c.75 0 1.158.385 1.5 1" })
  ),
  "Salin Kode"
);

export const IconPrinter = createTablerIcon(
  "IconPrinter",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2H5a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" }),
    React.createElement("path", { d: "M17 9V4H7v5" }),
    React.createElement("path", { d: "M7 15h10v6H7z" }),
    React.createElement("path", { d: "M18 13h.01" })
  ),
  "Cetak Tiket"
);

export const IconShare = createTablerIcon(
  "IconShare",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("circle", { cx: "6", cy: "12", r: "3" }),
    React.createElement("circle", { cx: "18", cy: "6", r: "3" }),
    React.createElement("circle", { cx: "18", cy: "18", r: "3" }),
    React.createElement("path", { d: "M8.7 10.7l6.6 -3.4" }),
    React.createElement("path", { d: "M8.7 13.3l6.6 3.4" })
  ),
  "Bagikan Tiket"
);

export const IconHome = createTablerIcon(
  "IconHome",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M5 12l-2 0l9 -9l9 9l-2 0" }),
    React.createElement("path", { d: "M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" }),
    React.createElement("path", { d: "M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" })
  ),
  "Beranda"
);

export const IconBolt = createTablerIcon(
  "IconBolt",
  React.createElement("path", { d: "M13 3l0 7l6 0l-8 11l0 -7l-6 0z" }),
  "Tanpa Perlu Akun"
);

export const IconShieldAlert = createTablerIcon(
  "IconShieldAlert",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" }),
    React.createElement("path", { d: "M12 8v4" }),
    React.createElement("path", { d: "M12 16h.01" })
  ),
  "Peringatan Keamanan"
);

export const IconHelpCircle = createTablerIcon(
  "IconHelpCircle",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
    React.createElement("path", { d: "M12 17v.01" }),
    React.createElement("path", { d: "M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -2" })
  ),
  "Bantuan FAQ"
);

export const IconTag = createTablerIcon(
  "IconTag",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M7.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" }),
    React.createElement("path", { d: "M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586H3z" })
  ),
  "Tarif Layanan"
);

export const IconVolumeOff = createTablerIcon(
  "IconVolumeOff",
  React.createElement(
    React.Fragment,
    null,
    React.createElement("path", { d: "M15 8a5 5 0 0 1 1.912 4.934m-1.377 2.602a5 5 0 0 1 -.535 .464" }),
    React.createElement("path", { d: "M17.7 5a9 9 0 0 1 2.362 11.086m-1.676 2.299a9 9 0 0 1 -.686 .615" }),
    React.createElement("path", { d: "M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v4.5m0 4v4.5a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" }),
    React.createElement("path", { d: "M3 3l18 18" })
  ),
  "Suasana Tenang"
);

// ============================================================================
// 4. METADATA & SEMANTIC MAPPING DICTIONARIES
// ============================================================================

export interface BarbershopIconMeta {
  name: string;
  component: TablerIcon;
  category: "grooming" | "booking" | "payment" | "location" | "communication" | "status";
  unicode: string;
  description: string;
  defaultA11yLabel: string;
  recommendedToken: IconSizeToken;
  recommendedColor: string; // CSS Token Reference
}

/**
 * 10 Ikon Inti Spesialis Barbershop
 */
export const BARBERSHOP_ICONS_METADATA: Record<string, BarbershopIconMeta> = {
  scissors: {
    name: "IconScissors",
    component: IconScissors,
    category: "grooming",
    unicode: "eb1b",
    description: "Ikon gunting rambut profesional dengan pegangan simetris 24x24 px.",
    defaultA11yLabel: "Layanan Gunting & Pangkas Rambut",
    recommendedToken: "md",
    recommendedColor: "var(--color-primary, #D97706)",
  },
  razor: {
    name: "IconRazor",
    component: IconRazor,
    category: "grooming",
    unicode: "f4b5",
    description: "Pisau cukur silet lurus (straight razor / safety razor) dengan gagang ergonomis.",
    defaultA11yLabel: "Layanan Cukur Silet & Beard Sculpting",
    recommendedToken: "md",
    recommendedColor: "var(--color-primary, #D97706)",
  },
  wash: {
    name: "IconWash",
    component: IconWash,
    category: "grooming",
    unicode: "f311",
    description: "Wadah air keramas dengan gelombang dinamis untuk layanan cuci rambut.",
    defaultA11yLabel: "Layanan Keramas & Cuci Rambut Bersih",
    recommendedToken: "md",
    recommendedColor: "var(--color-primary, #D97706)",
  },
  sparkles: {
    name: "IconSparkles",
    component: IconSparkles,
    category: "grooming",
    unicode: "f6d7",
    description: "Kilauan bintang premium untuk spa kepala, perawatan kulit kepala, dan combo signature.",
    defaultA11yLabel: "Layanan Spa, Creambath & Perawatan Khusus",
    recommendedToken: "md",
    recommendedColor: "var(--color-primary, #D97706)",
  },
  calendarEvent: {
    name: "IconCalendarEvent",
    component: IconCalendarEvent,
    category: "booking",
    unicode: "ea52",
    description: "Kalender grid dengan indikator jadwal aktif untuk pemilihan tanggal reservasi.",
    defaultA11yLabel: "Pemilihan Tanggal Reservasi",
    recommendedToken: "md",
    recommendedColor: "var(--color-text-primary, #F5F5F0)",
  },
  clock: {
    name: "IconClock",
    component: IconClock,
    category: "booking",
    unicode: "ea70",
    description: "Jam analog 24px melingkar dengan jarum penunjuk durasi dan hitung mundur 15 menit.",
    defaultA11yLabel: "Waktu Slot & Hitung Mundur Pembayaran",
    recommendedToken: "sm",
    recommendedColor: "var(--color-text-muted, #A8A29E)",
  },
  qrcode: {
    name: "IconQrcode",
    component: IconQrcode,
    category: "payment",
    unicode: "eb11",
    description: "Matriks kode QR presisi 24x24 px untuk pembayaran instan QRIS.",
    defaultA11yLabel: "Kode Pembayaran QRIS",
    recommendedToken: "lg",
    recommendedColor: "var(--color-primary, #D97706)",
  },
  creditCard: {
    name: "IconCreditCard",
    component: IconCreditCard,
    category: "payment",
    unicode: "ea84",
    description: "Kartu perbankan dengan strip magnetik untuk gateway Midtrans Snap & kartu kredit/debit.",
    defaultA11yLabel: "Metode Bayar Kartu Debit / Kredit",
    recommendedToken: "md",
    recommendedColor: "var(--color-text-primary, #F5F5F0)",
  },
  check: {
    name: "IconCheck",
    component: IconCheck,
    category: "status",
    unicode: "ea5e",
    description: "Checkmark presisi sudut 45 derajat untuk verifikasi status sukses dan pilihan aktif.",
    defaultA11yLabel: "Status Berhasil & Terkonfirmasi",
    recommendedToken: "sm",
    recommendedColor: "var(--color-status-confirmed-text, #34D399)",
  },
  mapPin: {
    name: "IconMapPin",
    component: IconMapPin,
    category: "location",
    unicode: "eae8",
    description: "Pin penanda lokasi studio fisik di peta Senopati, Jakarta Selatan.",
    defaultA11yLabel: "Lokasi Studio Damez Barbershop",
    recommendedToken: "md",
    recommendedColor: "var(--color-primary, #D97706)",
  },
  brandWhatsapp: {
    name: "IconBrandWhatsapp",
    component: IconBrandWhatsapp,
    category: "communication",
    unicode: "ec74",
    description: "Logo resmi WhatsApp untuk kontak admin, bukti reservasi, dan saluran bantuan cepat.",
    defaultA11yLabel: "Hubungi Customer Service WhatsApp",
    recommendedToken: "md",
    recommendedColor: "#25D366",
  },
};

/**
 * Mapping Layanan Katalog Resmi (SRV-01 s/d SRV-08) ke Tabler Icons
 */
export const SERVICE_ICON_MAP: Record<string, TablerIcon> = {
  // Mapping by Benchmark Service Code
  "SRV-01": IconScissors,      // Gentlemen Classic Haircut
  "SRV-02": IconScissors,      // Premium Fade & Taper Cut
  "SRV-03": IconScissors,      // Junior Gentleman Cut
  "SRV-04": IconRazor,         // Classic Beard Sculpt & Hot Towel Shave
  "SRV-05": IconRazor,         // Beard Sculpting & Detailing
  "SRV-06": IconWash,          // Scalp Therapy Treatment
  "SRV-07": IconScissors,      // Quick Express Clean Cut
  "SRV-08": IconSparkles,      // Damez Signature Full Grooming Combo

  // Mapping by Service Category
  haircut: IconScissors,
  grooming: IconRazor,
  treatment: IconWash,
  combo: IconSparkles,
  spa: IconSparkles,
};

/**
 * Mapping 5 Tahapan Multi-Step Booking Wizard ke Tabler Icons
 */
export const BOOKING_STEP_ICONS: Record<number, TablerIcon> = {
  1: IconScissors,       // Step 1: Layanan
  2: IconUsers,          // Step 2: Master Barber
  3: IconCalendarEvent,  // Step 3: Jadwal & Waktu
  4: IconBrandWhatsapp,  // Step 4: Kontak & WhatsApp Pelanggan
  5: IconTicket,         // Step 5: Ringkasan & Kunci Slot (Boarding Pass)
};

/**
 * Mapping Metode Pembayaran ke Tabler Icons
 */
export const PAYMENT_METHOD_ICONS: Record<string, TablerIcon> = {
  qris: IconQrcode,
  credit_card: IconCreditCard,
  midtrans: IconCreditCard,
  bank_transfer: IconCreditCard,
  cash: IconCash,
  tunai: IconCash,
};

/**
 * Mapping Status Reservasi ke Tabler Icons
 */
export const BOOKING_STATUS_ICONS: Record<string, TablerIcon> = {
  pending_payment: IconClock,
  confirmed: IconCircleCheck,
  in_progress: IconScissors,
  completed: IconCheck,
  cancelled: IconX,
  no_show: IconAlertOctagon,
};

// ============================================================================
// 5. HELPER ACCESSOR FUNCTIONS
// ============================================================================

/**
 * Dapatkan ikon Tabler untuk kode layanan atau kategori (fallback: IconScissors)
 */
export function getServiceIcon(serviceCodeOrCategory: string): TablerIcon {
  const normalized = serviceCodeOrCategory.trim();
  if (SERVICE_ICON_MAP[normalized]) {
    return SERVICE_ICON_MAP[normalized];
  }
  const lower = normalized.toLowerCase();
  if (SERVICE_ICON_MAP[lower]) {
    return SERVICE_ICON_MAP[lower];
  }
  return IconScissors;
}

/**
 * Dapatkan ikon Tabler untuk nomor step wizard booking (1..5, fallback: IconScissors)
 */
export function getBookingStepIcon(stepNumber: number): TablerIcon {
  return BOOKING_STEP_ICONS[stepNumber] || IconScissors;
}

/**
 * Dapatkan ikon Tabler untuk metode pembayaran (fallback: IconQrcode)
 */
export function getPaymentMethodIcon(method: string): TablerIcon {
  const key = method.toLowerCase().trim();
  return PAYMENT_METHOD_ICONS[key] || IconQrcode;
}

/**
 * Dapatkan ikon Tabler untuk status reservasi (fallback: IconCircleCheck)
 */
export function getBookingStatusIcon(status: string): TablerIcon {
  const key = status.toLowerCase().trim();
  return BOOKING_STATUS_ICONS[key] || IconCircleCheck;
}

// ============================================================================
// 6. ALL ICONS REGISTRY & GENERIC ICON COMPONENT
// ============================================================================

export const ICONS_REGISTRY = {
  // 10 Core Barbershop
  scissors: IconScissors,
  razor: IconRazor,
  wash: IconWash,
  sparkles: IconSparkles,
  "calendar-event": IconCalendarEvent,
  clock: IconClock,
  qrcode: IconQrcode,
  "credit-card": IconCreditCard,
  check: IconCheck,
  "map-pin": IconMapPin,
  "brand-whatsapp": IconBrandWhatsapp,

  // Secondary
  ticket: IconTicket,
  "circle-check": IconCircleCheck,
  "shield-check": IconShieldCheck,
  loader: IconLoader2,
  "loader-2": IconLoader2,
  "alert-triangle": IconAlertTriangle,
  "alert-circle": IconAlertCircle,
  "alert-octagon": IconAlertOctagon,
  lock: IconLock,
  "arrow-right": IconArrowRight,
  "arrow-left": IconArrowLeft,
  "chevron-down": IconChevronDown,
  "chevron-right": IconChevronRight,
  users: IconUsers,
  user: IconUser,
  "user-check": IconUserCheck,
  "user-plus": IconUserPlus,
  award: IconAward,
  phone: IconPhone,
  mail: IconMail,
  menu: IconMenu2,
  "menu-2": IconMenu2,
  x: IconX,
  cash: IconCash,
  dollar: IconCurrencyDollar,
  star: IconStar,
  camera: IconCamera,
  eye: IconEye,
  "chart-bar": IconChartBar,
  refresh: IconRefresh,
  "external-link": IconExternalLink,
  calendar: IconCalendar,
  "calendar-time": IconCalendarTime,
  mobile: IconDeviceMobile,
  message: IconMessage,
  sun: IconSun,
  moon: IconMoon,
  armchair: IconArmchair,
  copy: IconCopy,
  printer: IconPrinter,
  share: IconShare,
  home: IconHome,
  bolt: IconBolt,
  "shield-alert": IconShieldAlert,
  "help-circle": IconHelpCircle,
  tag: IconTag,
  "volume-off": IconVolumeOff,
} as const;

export type IconName = keyof typeof ICONS_REGISTRY;

export interface DynamicIconProps extends IconProps {
  name: IconName;
}

/**
 * Komponen Icon Universal untuk rendering dinamis berdasarkan slug nama
 */
export const Icon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  const Component = ICONS_REGISTRY[name] || IconScissors;
  return React.createElement(Component, props);
};

export default Icon;
