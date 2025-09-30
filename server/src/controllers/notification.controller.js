import Notification from '../models/notification.model.js'
import { markNotificationsAsRead } from '../services/notification.service.js'

const normalizeLimit = (value) => {
  const limit = Number.parseInt(value, 10)
  if (Number.isNaN(limit) || limit <= 0) return 10
  return Math.min(limit, 50)
}

export const listNotifications = async (req, res) => {
  const limit = normalizeLimit(req.query.limit)
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
  const payload = notifications.map((item) => ({
    id: item._id.toString(),
    type: item.type,
    title: item.title,
    message: item.message,
    link: item.link,
    read: item.read,
    createdAt: item.createdAt,
    metadata: item.metadata || {}
  }))
  res.json(payload)
}

export const markAsRead = async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : []
  if (!ids.length) {
    return res.json({ updated: 0 })
  }
  const updated = await markNotificationsAsRead(req.user._id, ids)
  res.json({ updated })
}

export default { listNotifications, markAsRead }
