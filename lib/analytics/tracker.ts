/**
 * DAMEZ BARBERSHOP - CLIENT & SERVER TELEMETRY DISPATCHER
 * 
 * Pengiriman event telemetri transparan yang aman & non-blocking.
 * Mendukung deteksi kanal UTM / referrer dan masking PII.
 */

import type { TelemetryEventType, TelemetryEvent } from './telemetry.ts';

/**
 * Mengambil atau membuat ID sesi acak di browser
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server-session';
  }

  try {
    const key = 'damez_telemetry_sess_id';
    let sess = sessionStorage.getItem(key);
    if (!sess) {
      sess = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(key, sess);
    }
    return sess;
  } catch {
    return `sess-ephemeral-${Date.now()}`;
  }
}

/**
 * Mendeteksi tipe perangkat pengguna
 */
function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'mobile';

  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Mendeteksi kanal asal (referrer/utm)
 */
function detectChannel(): string {
  if (typeof window === 'undefined') return 'direct';

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    if (utmSource) return utmSource.toLowerCase();

    const ref = document.referrer;
    if (ref.includes('google')) return 'google_search';
    if (ref.includes('instagram')) return 'instagram';
    if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'whatsapp';

    return 'direct';
  } catch {
    return 'direct';
  }
}

export interface ClientTrackEventOptions {
  barber_id?: string;
  service_id?: string;
  booking_code?: string;
  amount?: number;
  metadata?: Record<string, any>;
}

/**
 * Mengirim event telemetri ke route handler /api/telemetry/events secara asynchronous (Fire & Forget)
 */
export async function trackClientEvent(
  eventType: TelemetryEventType,
  options?: ClientTrackEventOptions
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const payload = {
      event_type: eventType,
      session_id: getOrCreateSessionId(),
      channel: detectChannel(),
      device_type: detectDeviceType(),
      barber_id: options?.barber_id,
      service_id: options?.service_id,
      booking_code: options?.booking_code,
      amount: options?.amount,
      metadata: options?.metadata
    };

    // Gunakan navigator.sendBeacon jika didukung untuk keandalan navigasi halaman
    if (navigator.sendBeacon && (eventType === 'page_view' || eventType === 'booking_cta_click')) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/telemetry/events', blob);
      return;
    }

    // Default fetch non-blocking
    fetch('/api/telemetry/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {
      // Non-blocking fail-safe
    });
  } catch {
    // Fail-safe
  }
}
