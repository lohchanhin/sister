import { listNotificationsByUser, markNotificationRead } from '../services/notification.service.js'

export const getNotifications = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50)
  const notifications = await listNotificationsByUser(req.user._id, { limit })
  res.json(
    notifications.map((item) => ({
      id: item._id,
      type: item.type,
      title: item.title,
      message: item.message,
      link: item.link,
      payload: item.payload,
      read: item.read,
      createdAt: item.createdAt
    }))
  )
}

export const readNotification = async (req, res) => {
  const updated = await markNotificationRead(req.params.id, req.user._id)
  if (!updated) return res.status(404).json({ message: 'Notification not found' })
  res.json({
    id: updated._id,
    type: updated.type,
    title: updated.title,
    message: updated.message,
    link: updated.link,
    payload: updated.payload,
    read: updated.read,
    createdAt: updated.createdAt
  })
}
