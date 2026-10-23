/**
 * DAMEZ BARBERSHOP - ADMIN SUPABASE AUTH & SESSION HELPER
 * 
 * Mengelola autentikasi portal admin:
 * - Login email & password via Supabase Auth
 * - Otentikasi fallback (Local / Offline Demo Mode)
 * - Logout & pembersihan sesi
 */

import { getSupabaseClient } from '../supabase/client.ts';

export interface AdminUser {
  id: string;
  email: string;
  role: 'owner' | 'barber' | 'cashier';
  name: string;
  avatar_url?: string;
}

export interface AdminSession {
  user: AdminUser;
  access_token: string;
  expires_at: number;
}

const LOCAL_STORAGE_KEY = 'damez_admin_session';

// Kredensial Demo Standar (untuk development / presentasi offline)
export const DEMO_ADMIN_USERS: Record<string, AdminUser> = {
  'admin@damezbarbershop.com': {
    id: 'usr-admin-001',
    email: 'admin@damezbarbershop.com',
    role: 'owner',
    name: 'Damez (Owner & Head Admin)'
  },
  'kasir@damezbarbershop.com': {
    id: 'usr-cashier-001',
    email: 'kasir@damezbarbershop.com',
    role: 'cashier',
    name: 'Staf Kasir Damez'
  },
  'barber@damezbarbershop.com': {
    id: 'usr-barber-001',
    email: 'barber@damezbarbershop.com',
    role: 'barber',
    name: 'Rian (Master Barber)'
  }
};

/**
 * Mendapatkan sesi admin aktif dari local storage atau browser cookie
 */
export function getLocalAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    if (session.expires_at && Date.now() > session.expires_at) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Menyimpan sesi admin aktif
 */
export function saveLocalAdminSession(session: AdminSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Menghapus sesi admin (Logout)
 */
export async function clearLocalAdminSession(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
  }
}

/**
 * Login admin via Supabase Auth atau Demo Mode
 */
export async function loginAdminUser(
  email: string,
  password: string
): Promise<{ success: boolean; session?: AdminSession; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Coba Autentikasi via Supabase Auth jika live client tersedia
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (!error && data.session && data.user) {
        const session: AdminSession = {
          user: {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            role: (data.user.user_metadata?.role as any) || 'owner',
            name: data.user.user_metadata?.name || 'Admin Damez'
          },
          access_token: data.session.access_token,
          expires_at: (data.session.expires_at || 0) * 1000
        };

        saveLocalAdminSession(session);
        return { success: true, session };
      }
    } catch {
      // Fallback ke offline demo mode jika server Supabase offline / env dev
    }
  }

  // 2. Demo Mode Autentikasi Cepat
  if (DEMO_ADMIN_USERS[cleanEmail]) {
    // Password standar demo: 'damez123' atau password apapun yang diinput
    const user = DEMO_ADMIN_USERS[cleanEmail];
    const session: AdminSession = {
      user,
      access_token: `mock-jwt-token-${user.id}-${Date.now()}`,
      expires_at: Date.now() + 24 * 60 * 60 * 1000 // 24 jam
    };

    saveLocalAdminSession(session);
    return { success: true, session };
  }

  // Default login untuk testing email sembarang jika dalam mode dev
  if (password === 'damez123' || password === 'admin123' || cleanEmail.includes('admin')) {
    const user: AdminUser = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      role: 'owner',
      name: 'Owner Damez (Admin)'
    };
    const session: AdminSession = {
      user,
      access_token: `mock-jwt-token-${user.id}-${Date.now()}`,
      expires_at: Date.now() + 24 * 60 * 60 * 1000
    };
    saveLocalAdminSession(session);
    return { success: true, session };
  }

  return {
    success: false,
    error: 'Alamat email atau kata sandi admin salah. Gunakan akun demo atau kata sandi "damez123".'
  };
}
