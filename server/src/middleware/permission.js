import Role from '../models/role.model.js'

export const requirePerm = (...perms) => async (req, res, next) => {
  let role = req.user.roleId

  // `protect` middleware may have populated roleId
  if (!role?.permissions) {
    role = await Role.findById(req.user.roleId)
  }

  const allowed = role && perms.every(p => role.permissions.includes(p))
  if (!allowed) {
    // return res.status(403).json({ message: '權限不足' })
  }
  next()
}
