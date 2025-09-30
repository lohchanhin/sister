import Notification from '../models/notification.model.js'
import { includeManagers } from '../utils/includeManagers.js'
import { formatISODate } from '../utils/time.js'

const toObjectId = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value._id) return value._id
  return value
}

export const createNotifications = async (notifications = []) => {
  if (!Array.isArray(notifications) || notifications.length === 0) return []
  const payload = notifications
    .map((item) => ({
      ...item,
      recipient: toObjectId(item.recipient),
      actor: toObjectId(item.actor) || undefined
    }))
    .filter((item) => item.recipient)
  if (!payload.length) return []
  return Notification.insertMany(payload)
}

export const notifyDiarySubmitted = async ({ diary, actor }) => {
  if (!diary) return []
  const managerIds = await includeManagers([])
  const actorId = toObjectId(actor)
  const recipients = managerIds.filter((id) => id.toString() !== actorId?.toString())
  if (!recipients.length) return []
  const authorName = diary.author?.name || diary.author?.username || '同仁'
  const date = formatISODate(diary.date)
  const authorId =
    diary.author?._id?.toString?.() ||
    diary.author?.id ||
    diary.author?.toString?.() ||
    ''
  const queryParts = [`date=${encodeURIComponent(date)}`]
  if (authorId) queryParts.push(`user=${authorId}`)
  const link = `/work-diaries?${queryParts.join('&')}`
  const title = `${authorName} 已提交 ${date} 的工作日誌`
  return createNotifications(
    recipients.map((recipient) => ({
      recipient,
      actor: actorId,
      type: 'work-diary:submitted',
      title,
      message: diary.title || '',
      link,
      metadata: {
        diaryId: diary._id?.toString?.() || diary.id,
        status: diary.status,
        date,
        authorId
      }
    }))
  )
}

export const notifyDiaryReviewed = async ({ diary, actor }) => {
  if (!diary) return []
  const recipient = toObjectId(diary.author)
  if (!recipient) return []
  const reviewerName = actor?.name || actor?.username || '主管'
  const date = formatISODate(diary.date)
  const status = diary.status
  const title = `${reviewerName} 已審核你的 ${date} 日誌`
  const message = diary.managerComment?.text || ''
  const authorId = diary.author?._id?.toString?.() || diary.author?.id || diary.author?.toString?.()
  const queryParts = [`date=${encodeURIComponent(date)}`]
  if (authorId) queryParts.push(`user=${authorId}`)
  const link = `/work-diaries?${queryParts.join('&')}`
  return createNotifications([
    {
      recipient,
      actor: toObjectId(actor),
      type: 'work-diary:reviewed',
      title,
      message,
      link,
      metadata: {
        diaryId: diary._id?.toString?.() || diary.id,
        status,
        date,
        authorId
      }
    }
  ])
}

export const markNotificationsAsRead = async (recipientId, ids = []) => {
  if (!recipientId || !ids.length) return 0
  const { acknowledged, modifiedCount } = await Notification.updateMany(
    { recipient: recipientId, _id: { $in: ids } },
    { $set: { read: true } }
  )
  return acknowledged ? modifiedCount : 0
}

export default {
  createNotifications,
  notifyDiarySubmitted,
  notifyDiaryReviewed,
  markNotificationsAsRead
}
