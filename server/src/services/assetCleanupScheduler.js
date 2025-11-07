import logger from '../config/logger.js'
import { deleteExpiredAssets, DeletionMethod } from './assetDeletion.service.js'

const TARGET_HOUR = 3
const TARGET_MINUTE = 30

export const runAssetCleanup = async () => {
  try {
    const result = await deleteExpiredAssets({ days: 90, method: DeletionMethod.SCHEDULED })
    logger.info(`Scheduled asset cleanup finished. Removed: ${result.deletedCount}`)
    return result
  } catch (error) {
    logger.error('Scheduled asset cleanup failed', error)
    throw error
  }
}

const computeDelay = () => {
  const now = new Date()
  const next = new Date(now)
  next.setHours(TARGET_HOUR, TARGET_MINUTE, 0, 0)
  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }
  return next.getTime() - now.getTime()
}

const scheduleNextRun = () => {
  const delay = computeDelay()
  logger.info(`Next asset cleanup scheduled in ${Math.round(delay / 1000 / 60)} minutes.`)
  return setTimeout(async () => {
    await runAssetCleanup()
    scheduleNextRun()
  }, delay)
}

let timerRef = null

export const scheduleAssetCleanup = () => {
  if (process.env.NODE_ENV === 'test') {
    return null
  }
  if (timerRef) {
    clearTimeout(timerRef)
  }
  timerRef = scheduleNextRun()
  return timerRef
}

export const cancelAssetCleanupSchedule = () => {
  if (timerRef) {
    clearTimeout(timerRef)
    timerRef = null
  }
}

export default {
  scheduleAssetCleanup,
  cancelAssetCleanupSchedule,
  runAssetCleanup
}
