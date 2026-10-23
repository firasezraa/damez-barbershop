/**
 * DAMEZ BARBERSHOP - SLOT AUTO-EXPIRE BACKGROUND WORKER
 * 
 * Worker proses berkala yang memonitor tabel bookings dan melepaskan slot
 * yang berstatus 'pending_payment' jika telah melewati batas hold TTL 15 menit.
 * 
 * Usage:
 *   node --experimental-strip-types scripts/slot-expire-worker.ts         # Mode daemon berkala
 *   node --experimental-strip-types scripts/slot-expire-worker.ts --once  # Mode sekali jalan (one-shot cron)
 */

import { releaseExpiredSlotHolds } from '../lib/slots/auto-expire.ts'

const DEFAULT_INTERVAL_MS = 15000 // 15 detik interval pemeriksaan

async function runSweepOnce(): Promise<number> {
  const sweepTimestamp = new Date().toISOString()
  try {
    const result = await releaseExpiredSlotHolds()
    if (result.expired_count > 0) {
      console.log(
        `[${sweepTimestamp}] [Worker] RELEASED: ${result.expired_count} expired hold(s). Codes: ${result.released_booking_codes.join(', ')}`
      )
    }
    return result.expired_count
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[${sweepTimestamp}] [Worker Error] Auto-expire sweep failed: ${msg}`)
    return 0
  }
}

async function main() {
  const args = process.argv.slice(2)
  const isOneShot = args.includes('--once')
  const intervalMs = parseInt(process.env.EXPIRE_WORKER_INTERVAL_MS || String(DEFAULT_INTERVAL_MS), 10)

  console.log('========================================================')
  console.log('  DAMEZ BARBERSHOP - SLOT AUTO-EXPIRE WORKER ENGINE')
  console.log('========================================================')
  console.log(`Mode: ${isOneShot ? 'ONE-SHOT CRON (--once)' : 'CONTINUOUS DAEMON'}`)
  console.log(`Check Interval: ${intervalMs} ms`)
  console.log(`Hold TTL Policy: 15 Minutes (900 seconds)`)
  console.log(`Started at: ${new Date().toISOString()}`)
  console.log('--------------------------------------------------------')

  if (isOneShot) {
    const count = await runSweepOnce()
    console.log(`[Worker] One-shot sweep finished. Released ${count} holds. Exiting.`)
    process.exit(0)
  }

  // Continuous Daemon mode
  let isRunning = true

  const stopDaemon = () => {
    if (!isRunning) return
    console.log('\n[Worker] Graceful shutdown requested (SIGINT/SIGTERM). Stopping daemon...')
    isRunning = false
    process.exit(0)
  }

  process.on('SIGINT', stopDaemon)
  process.on('SIGTERM', stopDaemon)

  // Run initial sweep
  await runSweepOnce()

  // Start periodic loop
  const timer = setInterval(async () => {
    if (!isRunning) {
      clearInterval(timer)
      return
    }
    await runSweepOnce()
  }, intervalMs)
}

main().catch((err) => {
  console.error('[Worker Fatal]', err)
  process.exit(1)
})
