import Notification from '../models/notification.model.js'

export const createNotifications = async (recipients = [], data = {}) => {
  const ids = Array.from(new Set((recipients || []).filter(Boolean)))
  if (!ids.length) return []
  const payload = ids.map((recipient) => ({
    recipient,
    type: data.type || 'general',
    title: data.title || '通知',
    message: data.message || '',
    link: data.link || '',
    payload: data.payload || {}
  }))
  return Notification.insertMany(payload)
}

export const listNotificationsByUser = async (userId, { limit = 10 } = {}) => {
  if (!userId) return []
  return Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
}

export const markNotificationRead = async (id, userId) => {
  if (!id || !userId) return null
  return Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { $set: { read: true } },
    { new: true }
  )
}
