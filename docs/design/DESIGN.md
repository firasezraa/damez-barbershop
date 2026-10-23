---
version: alpha
name: Damez Barbershop
description: Premium gentlemen's grooming design system blending masculine vintage barbershop heritage with modern digital precision.
colors:
  primary: "#D97706"
  primary-hover: "#F59E0B"
  primary-foreground: "#121212"
  secondary: "#784C25"
  secondary-hover: "#8C582B"
  secondary-foreground: "#FFFFFF"
  background: "#121212"
  surface: "#1A1A1A"
  surface-elevated: "#242424"
  surface-hover: "#2C2C2C"
  text-primary: "#F5F5F0"
  text-muted: "#A8A29E"
  border: "#2E2E2E"
  border-accent: "#D97706"
  status-confirmed: "#064E3B"
  status-confirmed-text: "#34D399"
  status-pending: "#451A03"
  status-pending-text: "#FBBF24"
  status-noshow: "#450A0A"
  status-noshow-text: "#F87171"
  status-cancelled: "#27272A"
  status-cancelled-text: "#A1A1AA"
  destructive: "#B91C1C"
  destructive-foreground: "#FFFFFF"
  success: "#047857"
  success-foreground: "#FFFFFF"
typography:
  display-lg:
    fontFamily: Cinzel
    fontSize: 2.75rem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  display-md:
    fontFamily: Cinzel
    fontSize: 2rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  heading-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  heading-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.35
  heading-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.4
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.04em"
  mono-code:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 48px
  "3xl": 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: 14px 24px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: 14px 24px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.lg}"
    padding: 12px 20px
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.lg}"
    padding: 12px 20px
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    rounded: "{rounded.md}"
    padding: 10px 16px
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.success-foreground}"
    rounded: "{rounded.md}"
    padding: 10px 16px
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: 20px
  card-surface-hover:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: 20px
  slot-available:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: 10px 14px
  slot-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: 10px 14px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 14px 16px
  banner-hold:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  bottom-action-bar:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: 16px 20px
  divider-line:
    backgroundColor: "{colors.border}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.none}"
    padding: 0px
    height: 1px
  indicator-accent:
    backgroundColor: "{colors.border-accent}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: 0px
    height: 4px
  badge-status-confirmed:
    backgroundColor: "{colors.status-confirmed}"
    textColor: "{colors.status-confirmed-text}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  badge-status-pending:
    backgroundColor: "{colors.status-pending}"
    textColor: "{colors.status-pending-text}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  badge-status-noshow:
    backgroundColor: "{colors.status-noshow}"
    textColor: "{colors.status-noshow-text}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  badge-status-cancelled:
    backgroundColor: "{colors.status-cancelled}"
    textColor: "{colors.status-cancelled-text}"
    rounded: "{rounded.full}"
    padding: 4px 12px
---

## Overview

Damez Barbershop embodies the aesthetic of modern gentleman's grooming. The design philosophy fuses the rich tactile heritage of classic barbershop craftsmanship (warm amber, aged cognac leather, dark charcoal slate) with contemporary digital ergonomics and frictionless interaction.

### 1. Brand Pillars & Design Personality
- **Masculine Sophistication:** Deep matte charcoal black canvases (`#121212`) anchored by warm vintage amber accents (`#D97706`) and rich leather bronze (`#784C25`). No juvenile neon gradients or artificial purple AI glowing effects.
- **Radical Clarity & Ergonomic Thumb-Zone:** Designed mobile-first for urban gentlemen on the move. Large touch targets (minimum 48px height for all primary actions), fixed sticky bottom action bars, and zero-fatigue vertical hierarchy.
- **Radical Transparency & Deterministic Time:** Explicit sanitation buffers (10 minutes between appointments), dynamic duration calculations, instant temporary slot locking (15-minute countdown timer), and unambiguous status badges.
- **Zero-Friction Hospitality:** 100% web browser booking without forced native app downloads, passwords, or registration walls.

### 2. User Journey & Navigation Hierarchy
The booking architecture is structured as a streamlined 6-step linear flow with immediate visual feedback:
1. **Step 1: Service Catalog Selection (Multi-Select):** Dynamic total price and duration accumulator with visual active counter badge.
2. **Step 2: Master Barber Selection:** "Siapa Saja (Fastest Slot)" option or specific barber choice with photo, craft specialty, and rating.
3. **Step 3: Date & Dynamic Time Slot Selection:** 14-day horizontal calendar scroller and slot pills filtered by barber availability, working hours (10:00 - 21:00 WIB), staggered breaks, and 10-minute sanitation buffers.
4. **Step 4: Guest Identity & Hospitality Preferences:** Compact customer name and WhatsApp number input (+62 auto-prefix), plus hospitality delighters (Quiet Cut vs Friendly Consultation, Welcome Drink).
5. **Step 5: Booking Review & Temporary Slot Hold:** Summary review, explicit cancellation policy disclosure, and temporary hold countdown banner (15-minute TTL locked via Supabase).
6. **Step 6: Digital Boarding Pass Ticket & Instant Confirmation:** Confirmed booking receipt with QR code check-in, Google Maps route button, and WhatsApp notification dispatch link.

---

## Colors

The Damez Barbershop color system is calibrated for dark-mode excellence, ensuring glare-free viewing in ambient barbershop lighting while maintaining strict WCAG 2.1 Level AA/AAA contrast ratios.

### 1. Core Brand Colors
- **Primary (`#D97706` - Warm Vintage Amber):** The definitive focal color for interactive CTA triggers, selection rings, active tabs, and confirmation indicators. Achieving a 6.2:1 contrast ratio against `#121212` charcoal background.
- **Primary Hover (`#F59E0B` - Luminous Amber Gold):** Elevated, brighter warm amber tone for responsive cursor hover and active engagement (> 8:1 contrast with dark charcoal).
- **Primary Foreground (`#121212` - Charcoal Black):** Crisp dark ink on amber button fills, providing a contrast ratio of 6.2:1 (exceeding WCAG AA 4.5:1).
- **Secondary (`#784C25` - Warm Leather Cognac):** Refined secondary action button and container tone reminiscent of vintage barber chairs and aged leather aprons.
- **Secondary Hover (`#8C582B`):** Warm burnished tone for secondary interactive triggers.
- **Secondary Foreground (`#FFFFFF` - Pure White):** High-contrast text on cognac leather surfaces, delivering a 5.6:1 contrast ratio.
- **Background (`#121212` - Matte Charcoal Obsidian):** Deep non-distracting canvas that eliminates eye strain and avoids harsh `#000000` pitch black.
- **Surface (`#1A1A1A` - Elevated Charcoal Slate):** Base container surface for service cards, barber profiles, and form inputs.
- **Surface Elevated (`#242424`):** Secondary layer elevation for time-slot pills, modal overlays, and sticky bottom navigation.
- **Surface Hover (`#2C2C2C`):** Micro-elevation on user hover/touch state.
- **Border (`#2E2E2E`):** 1px subtle architectural divider providing optical separation without visual clutter.
- **Border Accent (`#D97706`):** Active card selection border, active focus ring, and progress indicator.

### 2. Neutrals & High-Contrast Typography
- **Text Primary (`#F5F5F0` - Clean Cream / Warm Off-White):** Premium, warm off-white headline and body color achieving an exceptional **16.5:1** contrast ratio against `#121212`.
- **Text Muted (`#A8A29E` - Warm Stone 400):** Supporting layer for service durations, descriptions, and timestamps with a **7.2:1** contrast ratio.

### 3. Booking Status Badge Colors
Standardized badge tokens mapped to the Supabase booking status model:
- **`confirmed` (`#064E3B` container / `#34D399` text):** Emerald green badge denoting successful DP payment, slot reservation, and active booking. Contrast ratio: **6.8:1** (WCAG AAA).
- **`pending_payment` (`#451A03` container / `#FBBF24` text):** Warm amber badge indicating a temporary 15-minute slot hold awaiting Midtrans QRIS/VA settlement. Contrast ratio: **7.4:1** (WCAG AAA).
- **`no_show` (`#450A0A` container / `#F87171` text):** Ruby crimson badge signifying customer absence beyond the 15-minute grace tolerance window with forfeited DP. Contrast ratio: **6.4:1** (WCAG AAA).
- **`cancelled` (`#27272A` container / `#A1A1AA` text):** Zinc slate badge for bookings officially cancelled prior to H-3 hours or released upon payment timeout. Contrast ratio: **4.7:1** (WCAG AA).

### 4. Alert & Feedback Tokens
- **Destructive (`#B91C1C` - Deep Rust Red):** Critical validation warnings, cancellation modals, and hold expiration alerts (4.9:1 contrast against white).
- **Success (`#047857` - Deep Emerald Green):** Instant transaction confirmation, copied booking code alert, and slot release confirmation (5.2:1 contrast against white).

---

## Typography

Damez Barbershop combines classic serif craftsmanship for display landmarks with modern, highly legible geometric sans-serif for functional UI controls and monospace precision for temporal data.

### 1. Font Family Roles
- **Display Serif (`Cinzel`):** Used exclusively for high-level brand expressions, page titles, section headings, and the digital boarding pass header. Conveys architectural gravitas and barbershop heritage.
- **Body & Controls (`Plus Jakarta Sans`):** High-x-height geometric sans-serif engineered for digital screens. Used for service cards, barber bios, form labels, buttons, and helper microcopy.
- **Monospace & Numerical Data (`JetBrains Mono`):** Dedicated to time stamps (`14:30 WIB`), hold countdown timers (`14:59`), unique booking codes (`DMZ-8821`), and currency calculations (`Rp 20.000`).

### 2. Typographic Scale & Hierarchy
- `display-lg`: 2.75rem (44px), weight 700, line-height 1.15, tracking -0.02em. Hero brand headline.
- `display-md`: 2.00rem (32px), weight 600, line-height 1.20, tracking -0.01em. Step header and modal title.
- `heading-lg`: 1.50rem (24px), weight 700, line-height 1.30, tracking -0.01em. Card titles and section headers.
- `heading-md`: 1.25rem (20px), weight 600, line-height 1.35, tracking normal. Barber name and service package title.
- `heading-sm`: 1.125rem (18px), weight 600, line-height 1.40, tracking normal. Drawer title and group legend.
- `body-lg`: 1.125rem (18px), weight 400, line-height 1.60, tracking normal. Introductory lead copy.
- `body-md`: 1.00rem (16px), weight 400, line-height 1.50, tracking normal. Primary body and form inputs.
- `body-sm`: 0.875rem (14px), weight 400, line-height 1.50, tracking normal. Helper text and card meta.
- `caption`: 0.75rem (12px), weight 500, line-height 1.40, tracking 0.04em. Badge text and category tags.
- `mono-code`: 0.875rem (14px), weight 600, line-height 1.40, tracking 0.05em. Timers, booking codes, and prices.

---

## Layout

### 1. Viewport Grid & Responsive Breakpoints
- **Mobile-First Canvas:** Base container max-width `480px` (`max-w-md mx-auto`), designed for single-hand mobile ergonomics.
- **Outer Padding:** `16px` (`spacing.md`) on mobile screens (< 640px), expanding to `24px` (`spacing.lg`) on tablets.
- **Tablet / Split View (768px - 1023px):** Two-column split layout with sticky booking progress summary on the left and interactive step wizard on the right.
- **Desktop (>= 1024px):** Centered luxury card canvas (`max-w-4xl`) with refined elevation, gold ambient glow, and high-density information display.

### 2. Spacing Scale & Rhythm (8pt Grid with 4pt Micro-Steps)
- `spacing.xs` (`4px`): Micro padding, badge vertical offset, and hairline gaps.
- `spacing.sm` (`8px`): Intra-element spacing, icon-to-label gaps, and compact chip padding.
- `spacing.md` (`16px`): Standard card padding, grid gutter, and form field vertical gaps.
- `spacing.lg` (`24px`): Major card interior padding, section separation, and modal header spacing.
- `spacing.xl` (`32px`): Inter-section breaks and wizard step transitions.
- `spacing.2xl` (`48px`): Large section margins and hero unit padding.
- `spacing.3xl` (`64px`): Landing page section breaks and footer spacing.

### 3. Thumb-Zone Ergonomics & Sticky Action Bar
- **Touch Target Floor:** All clickable elements (buttons, pills, checkboxes, back buttons) enforce a strict minimum touch target of `48px x 48px`.
- **Sticky Bottom Action Bar:** Positioned at `fixed bottom-0 inset-x-0 z-40`, height `h-20` (80px), backdrop blur `16px`, background `#121212/95` with top border `#2E2E2E`. Houses real-time accumulation of services count, total duration, total price, and the primary forward button.
- **Bottom Content Buffer:** All scrollable viewports incorporate `pb-28` (112px bottom padding) to eliminate sticky bar occlusion.

---

## Elevation & Depth

Damez Barbershop avoids heavy muddy drop shadows in favor of precise tonal layering, hairline borders, and subtle amber optical illumination.

### 1. Elevation Hierarchy
- **Level 0 (Base Canvas):** Flat `#121212` matte obsidian.
- **Level 1 (Card Surface):** `#1A1A1A` with 1px solid border `#2E2E2E` and shadow `0 4px 12px rgba(0, 0, 0, 0.4)`. Used for service items, barber cards, and FAQs.
- **Level 2 (Active / Selected Card):** `#1A1A1A` with 1.5px solid border `#D97706` and warm amber glow `0 0 16px rgba(217, 119, 6, 0.20)`. Used for chosen services, selected barber, and active time slot.
- **Level 3 (Sticky Bar & Overlays):** `#242424` with `backdrop-blur-md` and shadow `0 -4px 20px rgba(0, 0, 0, 0.6)`. Used for bottom action bar and sticky headers.
- **Level 4 (Modal & Digital Ticket):** `#1E1E1E` with 1px solid border `#383838`, shadow `0 20px 40px rgba(0, 0, 0, 0.8)` and gold corner accenting. Used for Midtrans payment modal and boarding pass ticket.

---

## Shapes

The geometric identity is defined by architectural precision and clean rectangular discipline, avoiding infantile bubbly radii.

### 1. Border Radius Scale
- `none` (`0px`): Full-bleed dividing lines, banner edges, and root layout frames.
- `sm` (`4px`): Micro chips, checkbox indicators, and badge notches.
- `md` (`8px`): Time-slot buttons, input fields, and countdown banners.
- `lg` (`12px`): Primary action buttons, secondary buttons, and alert callouts.
- `xl` (`16px`): Service cards, barber profile cards, and digital ticket container.
- `full` (`9999px`): Status badges, circular avatar frames, and hospitality delighter pills.

---

## Components

Below is the definitive component specification and state matrix for Damez Barbershop.

### 1. Component Token Specifications
- **`button-primary`:** Warm amber CTA button (`#D97706`) with bold dark charcoal text (`#121212`), rounded `12px`, padding `14px 24px`. High-impact action per screen.
- **`button-primary-hover`:** Deep burnished amber (`#B45309`) with dark charcoal text.
- **`button-secondary`:** Warm cognac leather button (`#784C25`) with crisp white text (`#FFFFFF`), rounded `12px`, padding `12px 20px`.
- **`button-secondary-hover`:** Burnished cognac (`#8C582B`) with crisp white text.
- **`button-destructive`:** Deep rust red button (`#B91C1C`) with crisp white text (`#FFFFFF`), rounded `8px`, padding `10px 16px`.
- **`button-success`:** Emerald green action button (`#059669`) with crisp white text (`#FFFFFF`), rounded `8px`, padding `10px 16px`.
- **`card-surface`:** Charcoal slate container (`#1A1A1A`) with clean cream text (`#F5F5F0`), rounded `16px`, padding `20px`.
- **`card-surface-hover`:** Elevated hover state (`#2C2C2C`) with clean cream text.
- **`slot-available`:** Elevated time slot pill (`#242424`) with clean cream text (`#F5F5F0`), rounded `8px`, padding `10px 14px`.
- **`slot-selected`:** Inverted active time slot (`#D97706`) with dark charcoal text (`#121212`), rounded `8px`, padding `10px 14px`.
- **`input-field`:** Charcoal slate field (`#1A1A1A`) with clean cream text (`#F5F5F0`), rounded `12px`, padding `14px 16px`.
- **`banner-hold`:** Dynamic countdown notification banner (`#242424`) with muted warm stone text (`#A8A29E`), rounded `8px`, padding `12px 16px`.
- **`bottom-action-bar`:** Fixed bottom navigation bar (`#121212`) with clean cream text (`#F5F5F0`), rounded `0px`, padding `16px 20px`.
- **`divider-line`:** Structural separating rule (`#2E2E2E`) with height `1px`.
- **`indicator-accent`:** Warm amber progress segment (`#D97706`) with height `4px` and rounded `full`.
- **`badge-status-confirmed`:** Emerald green status badge (`#064E3B` / `#34D399`), rounded `full`, padding `4px 12px`.
- **`badge-status-pending`:** Warm amber status badge (`#451A03` / `#FBBF24`), rounded `full`, padding `4px 12px`.
- **`badge-status-noshow`:** Ruby crimson status badge (`#450A0A` / `#F87171`), rounded `full`, padding `4px 12px`.
- **`badge-status-cancelled`:** Zinc slate status badge (`#27272A` / `#A1A1AA`), rounded `full`, padding `4px 12px`.

### 2. Comprehensive Component States Matrix
Every interactive component complies with the full 7-state interaction matrix:

| Komponen | Default | Hover | Active / Pressed | Focus-Visible | Disabled | Loading / In-Progress | Error / Invalid |
|---|---|---|---|---|---|---|---|
| **Primary Button** | Bg `#D97706`, Text `#121212`, Shadow none | Bg `#B45309`, Text `#121212` | Transform `scale(0.98)`, Bg `#92400E` | Ring 2px `#D97706` offset 2px `#121212` | Bg `#2A2A2A`, Text `#71717A`, Cursor not-allowed | Spinner svg, Text "Memproses...", Opacity 0.8 | Shake animation, Bg `#DC2626`, Text `#FFF` |
| **Service Card** | Bg `#1A1A1A`, Border 1px `#2E2E2E` | Bg `#242424`, Border 1px `#3F3F46` | Transform `scale(0.99)` | Outline 2px `#D97706` | Opacity 0.4, Filter grayscale, Pointer-events none | Shimmer skeleton pulse | Border 1px `#EF4444`, Text `#F87171` |
| **Time-Slot Pill** | Bg `#242424`, Border 1px `#383838`, Text `#F5F5F0` | Bg `#2E2E2E`, Border 1px `#D97706` | Bg `#D97706`, Text `#121212` | Ring 2px `#D97706` | Bg `#171717`, Text `#52525B`, Line-through | Pulse animation | Border 1px `#EF4444`, Alert icon |
| **Form Input** | Bg `#1A1A1A`, Border 1px `#2E2E2E`, Text `#F5F5F0` | Border 1px `#3F3F46` | Border 1.5px `#D97706` | Ring 2px `#D97706/30`, Border `#D97706` | Bg `#171717`, Text `#52525B`, Cursor not-allowed | Spinner inside right addon | Border 1.5px `#EF4444`, Message `#EF4444` |
| **Countdown Banner** | Bg `#242424`, Border 1px `#D97706/40`, Text `#F5F5F0` | - | - | - | - | Countdown tick animation | Flash pulse `#EF4444`, Text "Kedaluwarsa" |

---

## Do's and Don'ts

### Do's
- **Do** use token references (`{colors.primary}`, `{rounded.lg}`) in component declarations instead of literal raw values.
- **Do** maintain a minimum contrast ratio of 4.5:1 for all readable text against dark surfaces (tested WCAG 2.1 AA compliant).
- **Do** format all currency in Indonesian Rupiah (`Rp 20.000`, `Rp 80.000`) and use `JetBrains Mono` for all price and timestamp displays.
- **Do** calculate dynamic totals (duration and price) instantly in the sticky bottom bar whenever services are toggled.
- **Do** enforce a 10-minute sanitation buffer between consecutive barber bookings.
- **Do** format Indonesian WhatsApp numbers with auto `+62` country prefix parsing.

### Don'ts
- **Don't** use pure `#000000` pitch black backgrounds; always use matte charcoal obsidian `#121212`.
- **Don't** use generic blue/purple AI gradients or neon glow boxes.
- **Don't** force user registration or password creation before completing an appointment booking.
- **Don't** use emojis as functional UI icons; use precise vector SVG icons (Lucide or Tabler icons).
- **Don't** allow double-booking states or unvalidated multi-step progression.
- **Don't** mix sharp 0px corners and bubbly round corners inconsistently across views.
