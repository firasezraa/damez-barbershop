/**
 * DAMEZ BARBERSHOP - SUPABASE CLIENT SINGLETON
 * Provides typed Supabase client instance using environment credentials.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types.ts'

let cachedClient: SupabaseClient<Database> | null = null

/**
 * Retrieves the Supabase client instance with database types.
 * Returns null if environment variables are not configured.
 */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey: string | undefined = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  if (!cachedClient) {
    cachedClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  }

  return cachedClient
}

/**
 * Resets the cached Supabase client (primarily for testing purposes).
 */
export function resetSupabaseClient(): void {
  cachedClient = null
}
