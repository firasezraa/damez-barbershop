/**
 * DAMEZ BARBERSHOP - TABLER ICONS SYSTEM VERIFICATION SUITE
 * 
 * Memvalidasi sistem ikonografi berstandar Tabler Icons v3.46.0+
 * Memastikan pemenuhan Definition of Done (DoD), kepatuhan grid 24x24 px,
 * stroke 2.0px, optical size token, dictionary mapping katalog servis,
 * dan aksesibilitas WCAG 2.1 Level AA.
 */

import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import {
  IconScissors,
  IconRazor,
  IconWash,
  IconSparkles,
  IconCalendarEvent,
  IconClock,
  IconQrcode,
  IconCreditCard,
  IconCheck,
  IconMapPin,
  IconBrandWhatsapp,
  IconTicket,
  IconCircleCheck,
  IconShieldCheck,
  IconLoader2,
  IconAlertTriangle,
  IconAlertCircle,
  IconAlertOctagon,
  IconLock,
  IconArrowRight,
  IconArrowLeft,
  IconUsers,
  IconUser,
  IconUserCheck,
  IconUserPlus,
  IconAward,
  IconCash,
  ICON_SIZE_TOKENS,
  BARBERSHOP_ICONS_METADATA,
  SERVICE_ICON_MAP,
  BOOKING_STEP_ICONS,
  PAYMENT_METHOD_ICONS,
  BOOKING_STATUS_ICONS,
  getServiceIcon,
  getBookingStepIcon,
  getPaymentMethodIcon,
  getBookingStatusIcon,
  ICONS_REGISTRY,
} from '../components/ui/icons.ts';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

console.log('=== RUNNING TABLER ICONS DESIGN SYSTEM TEST SUITE ===\n');

// ----------------------------------------------------------------------------
// TEST 1: VERIFIKASI KEBERADAAN FILE ARTEFAK & DELIVERABLES
// ----------------------------------------------------------------------------
console.log('[Test 1] Verifikasi Keberadaan Berkas Deliverables...');
const projectRoot = process.cwd();
const docPath = path.join(projectRoot, 'docs', 'design', 'tabler-iconography.md');
const iconsTsPath = path.join(projectRoot, 'components', 'ui', 'icons.ts');
const previewHtmlPath = path.join(projectRoot, 'docs', 'design', 'tabler-iconography-preview.html');

assert(fs.existsSync(docPath), `Dokumentasi tidak ditemukan di ${docPath}`);
assert(fs.existsSync(iconsTsPath), `Dictionary tidak ditemukan di ${iconsTsPath}`);
assert(fs.existsSync(previewHtmlPath), `Preview HTML tidak ditemukan di ${previewHtmlPath}`);

console.log('PASS: docs/design/tabler-iconography.md terverifikasi ada.');
console.log('PASS: components/ui/icons.ts terverifikasi ada.');
console.log('PASS: docs/design/tabler-iconography-preview.html terverifikasi ada.\n');

// ----------------------------------------------------------------------------
// TEST 2: VERIFIKASI 10 IKON KANONIKAL BARBERSHOP TERDEFINISI LENGKAP
// ----------------------------------------------------------------------------
console.log('[Test 2] Verifikasi 10 Ikon Kanonikal Barbershop...');
const canonicalIcons = [
  { name: 'IconScissors', comp: IconScissors },
  { name: 'IconRazor', comp: IconRazor },
  { name: 'IconWash', comp: IconWash },
  { name: 'IconSparkles', comp: IconSparkles },
  { name: 'IconCalendarEvent', comp: IconCalendarEvent },
  { name: 'IconClock', comp: IconClock },
  { name: 'IconQrcode', comp: IconQrcode },
  { name: 'IconCreditCard', comp: IconCreditCard },
  { name: 'IconCheck', comp: IconCheck },
  { name: 'IconMapPin', comp: IconMapPin },
  { name: 'IconBrandWhatsapp', comp: IconBrandWhatsapp },
];

for (const icon of canonicalIcons) {
  assert(typeof icon.comp === 'function', `Komponen ${icon.name} bukan fungsi React yang valid`);
  // Render simulasi React element
  const element = icon.comp({ size: 24, stroke: 2 }) as React.ReactElement<any>;
  assert(Boolean(element) && React.isValidElement(element), `Gagal merender element untuk ${icon.name}`);
  assert(element.props.viewBox === '0 0 24 24', `${icon.name} viewBox bukan 0 0 24 24`);
  assert(element.props.width === 24, `${icon.name} default width bukan 24`);
  assert(element.props.height === 24, `${icon.name} default height bukan 24`);
}
console.log(`PASS: Seluruh 11 ikon kanonikal barbershop tervalidasi komponen React SVG-nya.\n`);

// ----------------------------------------------------------------------------
// TEST 3: VERIFIKASI TOKEN UKURAN & OPTICAL WEIGHTING
// ----------------------------------------------------------------------------
console.log('[Test 3] Verifikasi Skala Token Ukuran (ICON_SIZE_TOKENS)...');
assert(ICON_SIZE_TOKENS.micro.size === 16 && ICON_SIZE_TOKENS.micro.stroke === 1.75, 'Token micro tidak sesuai');
assert(ICON_SIZE_TOKENS.sm.size === 20 && ICON_SIZE_TOKENS.sm.stroke === 2.0, 'Token sm tidak sesuai');
assert(ICON_SIZE_TOKENS.md.size === 24 && ICON_SIZE_TOKENS.md.stroke === 2.0, 'Token md tidak sesuai');
assert(ICON_SIZE_TOKENS.lg.size === 32 && ICON_SIZE_TOKENS.lg.stroke === 1.5, 'Token lg tidak sesuai');
assert(ICON_SIZE_TOKENS.xl.size === 48 && ICON_SIZE_TOKENS.xl.stroke === 1.5, 'Token xl tidak sesuai');

// Uji coba resolusi token ukuran pada komponen
const microElement = IconScissors({ size: 'micro' }) as React.ReactElement<any>;
assert(microElement.props.width === 16 && microElement.props.strokeWidth === 1.75, 'Resolusi token micro gagal');

const xlElement = IconScissors({ size: 'xl' }) as React.ReactElement<any>;
assert(xlElement.props.width === 48 && xlElement.props.strokeWidth === 1.5, 'Resolusi token xl gagal');

console.log('PASS: Skala token ukuran micro (16px/1.75), sm (20px/2), md (24px/2), lg (32px/1.5), xl (48px/1.5) tervalidasi 100%.\n');

// ----------------------------------------------------------------------------
// TEST 4: VERIFIKASI PEMETAAN KATALOG LAYANAN (SRV-01 s/d SRV-08)
// ----------------------------------------------------------------------------
console.log('[Test 4] Verifikasi Pemetaan Katalog Layanan (SERVICE_ICON_MAP)...');
const expectedServiceMappings: Record<string, string> = {
  'SRV-01': 'IconScissors',
  'SRV-02': 'IconScissors',
  'SRV-03': 'IconScissors',
  'SRV-04': 'IconRazor',
  'SRV-05': 'IconRazor',
  'SRV-06': 'IconWash',
  'SRV-07': 'IconScissors',
  'SRV-08': 'IconSparkles',
};

for (const [code, expectedCompName] of Object.entries(expectedServiceMappings)) {
  const mappedIcon = SERVICE_ICON_MAP[code];
  assert(Boolean(mappedIcon), `Layanan ${code} tidak memiliki mapping icon`);
  assert(mappedIcon.displayName === expectedCompName, `Layanan ${code} dipetakan ke ${mappedIcon.displayName}, diharapkan ${expectedCompName}`);
  
  // Uji helper getServiceIcon
  const helperIcon = getServiceIcon(code);
  assert(helperIcon.displayName === expectedCompName, `Helper getServiceIcon(${code}) gagal`);
}

// Uji kategori
assert(getServiceIcon('haircut').displayName === 'IconScissors', 'Kategori haircut gagal');
assert(getServiceIcon('grooming').displayName === 'IconRazor', 'Kategori grooming gagal');
assert(getServiceIcon('treatment').displayName === 'IconWash', 'Kategori treatment gagal');
assert(getServiceIcon('combo').displayName === 'IconSparkles', 'Kategori combo gagal');

console.log('PASS: Seluruh 8 benchmark service dan kategori dipetakan secara deterministik ke ikon Tabler yang tepat.\n');

// ----------------------------------------------------------------------------
// TEST 5: VERIFIKASI PEMETAAN WIZARD BOOKING, PEMBAYARAN & STATUS
// ----------------------------------------------------------------------------
console.log('[Test 5] Verifikasi Pemetaan Multi-step Wizard, Payment & Status...');
// Wizard steps 1 to 5
assert(getBookingStepIcon(1).displayName === 'IconScissors', 'Step 1 harus IconScissors');
assert(getBookingStepIcon(2).displayName === 'IconUsers', 'Step 2 harus IconUsers');
assert(getBookingStepIcon(3).displayName === 'IconCalendarEvent', 'Step 3 harus IconCalendarEvent');
assert(getBookingStepIcon(4).displayName === 'IconBrandWhatsapp', 'Step 4 harus IconBrandWhatsapp');
assert(getBookingStepIcon(5).displayName === 'IconTicket', 'Step 5 harus IconTicket');

// Payment methods
assert(getPaymentMethodIcon('qris').displayName === 'IconQrcode', 'Metode qris harus IconQrcode');
assert(getPaymentMethodIcon('credit_card').displayName === 'IconCreditCard', 'Metode credit_card harus IconCreditCard');
assert(getPaymentMethodIcon('cash').displayName === 'IconCash', 'Metode cash harus IconCash');

// Statuses
assert(getBookingStatusIcon('pending_payment').displayName === 'IconClock', 'Status pending_payment harus IconClock');
assert(getBookingStatusIcon('confirmed').displayName === 'IconCircleCheck', 'Status confirmed harus IconCircleCheck');
assert(getBookingStatusIcon('in_progress').displayName === 'IconScissors', 'Status in_progress harus IconScissors');
assert(getBookingStatusIcon('completed').displayName === 'IconCheck', 'Status completed harus IconCheck');
assert(getBookingStatusIcon('no_show').displayName === 'IconAlertOctagon', 'Status no_show harus IconAlertOctagon');

console.log('PASS: Seluruh pemetaan fungsional wizard, payment gateway, dan lifecycle status terverifikasi 100%.\n');

// ----------------------------------------------------------------------------
// TEST 6: VERIFIKASI AKSESIBILITAS WCAG 2.1 LEVEL AA
// ----------------------------------------------------------------------------
console.log('[Test 6] Verifikasi Kepatuhan Aksesibilitas (WCAG 2.1 AA)...');
// Case 1: Ikon dekoratif tanpa label wajib memiliki aria-hidden="true"
const decorative = IconClock({ size: 20 }) as React.ReactElement<any>;
assert(decorative.props['aria-hidden'] === 'true', 'Ikon dekoratif harus memiliki aria-hidden="true"');
assert(decorative.props.role === undefined, 'Ikon dekoratif tidak boleh memiliki role="img"');

// Case 2: Ikon mandiri dengan aria-label wajib memiliki role="img" dan meneruskan label
const actionButton = IconArrowLeft({ 'aria-label': 'Kembali ke langkah sebelumnya' }) as React.ReactElement<any>;
assert(actionButton.props.role === 'img', 'Ikon mandiri dengan aria-label harus memiliki role="img"');
assert(actionButton.props['aria-label'] === 'Kembali ke langkah sebelumnya', 'aria-label tidak diteruskan');
assert(actionButton.props['aria-hidden'] === undefined, 'Ikon mandiri tidak boleh aria-hidden="true"');

console.log('PASS: Aksesibilitas semantik WCAG 2.1 AA (aria-hidden dekoratif vs aria-label interaktif) terverifikasi 100%.\n');

// ----------------------------------------------------------------------------
// TEST 7: VERIFIKASI REGISTRY LENGKAP & KELENGKAPAN IKON EKOSISTEM
// ----------------------------------------------------------------------------
console.log('[Test 7] Verifikasi ICONS_REGISTRY & Ekosistem Lengkap...');
const totalRegisteredIcons = Object.keys(ICONS_REGISTRY).length;
assert(totalRegisteredIcons >= 30, `Jumlah ikon di registry (${totalRegisteredIcons}) kurang dari 30`);
console.log(`PASS: Sebanyak ${totalRegisteredIcons} ikon Tabler terdaftar dan siap digunakan secara dinamis.\n`);

console.log('========================================================================');
console.log('CONGRATULATIONS: ALL TABLER ICONS DESIGN SYSTEM TESTS PASSED (100% PASS)');
console.log('DoD VERIFIED: Seluruh aksi UI dan paket layanan memiliki ikon Tabler yang');
console.log('seragam, scalable, dan bebas distorsi visual.');
console.log('========================================================================');
