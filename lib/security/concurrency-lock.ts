/**
 * DAMEZ BARBERSHOP - ASYNCHRONOUS CONCURRENCY MUTEX & SLOT LOCK ENGINE
 * 
 * Mencegah race condition pada layer aplikasi sebelum dan bersamaan dengan
 * PostgreSQL SELECT FOR UPDATE dan GiST exclusion constraint.
 * Menyediakan penguncian per-kunci slot (BarberId + Date + StartTime).
 */

export interface MutexLockRelease {
  (): void
}

class AsyncSlotMutex {
  private locks: Map<string, Promise<void>> = new Map()

  /**
   * Mengunci eksekusi untuk kunci slot tertentu.
   * Jika ada permintaan lain yang memproses kunci yang sama, permintaan kedua
   * akan menunggu giliran hingga pemegang kunci pertama selesai.
   */
  async acquire(key: string): Promise<MutexLockRelease> {
    while (this.locks.has(key)) {
      await this.locks.get(key)
    }

    let releaseFunc!: () => void
    const lockPromise = new Promise<void>((resolve) => {
      releaseFunc = resolve
    })

    this.locks.set(key, lockPromise)

    let released = false
    return () => {
      if (!released) {
        released = true
        this.locks.delete(key)
        releaseFunc()
      }
    }
  }

  /**
   * Menjalankan fungsi di dalam blok penguncian terisolasi.
   */
  async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire(key)
    try {
      return await fn()
    } finally {
      release()
    }
  }

  /**
   * Mengembalikan jumlah kunci aktif yang sedang ditahan
   */
  get activeLocksCount(): number {
    return this.locks.size
  }

  /**
   * Membersihkan semua lock (berguna untuk testing reset)
   */
  clear(): void {
    this.locks.clear()
  }
}

// Global Singleton AsyncSlotMutex
export const slotMutex = new AsyncSlotMutex()

/**
 * Helper untuk membuat kunci slot yang seragam
 */
export function buildSlotLockKey(barberId: string, bookingDate: string, startTime: string): string {
  const normalizedTime = new Date(startTime).toISOString()
  return `slot:${barberId}:${bookingDate}:${normalizedTime}`
}
