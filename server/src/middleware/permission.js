import { t } from '../i18n/messages.js'
import Role from '../models/role.model.js'

const resolveRole = async (req) => {
  if (req.user?.roleId?.permissions) {
    return req.user.roleId
  }
  if (!req.user?.roleId) return null
  if (typeof req.user.roleId === 'object' && req.user.roleId.permissions) {
    return req.user.roleId
  }
  return Role.findById(req.user.roleId)
}

export const requirePerm = (...perms) => async (req, res, next) => {
  const role = await resolveRole(req)
  const allowed = role && perms.every((p) => role.permissions.includes(p))
  if (!allowed) {
    return res.status(403).json({ message: t('PERMISSION_DENIED') })
  }
  next()
}

export const requireAnyPerm = (...perms) => async (req, res, next) => {
  const role = await resolveRole(req)
  const allowed = role && perms.some((p) => role.permissions.includes(p))
  if (!allowed) {
    return res.status(403).json({ message: t('PERMISSION_DENIED') })
  }
  next()
}
