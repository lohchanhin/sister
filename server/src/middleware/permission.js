import Role from '../models/role.model.js'

export const requirePerm = (perm) => async (req, res, next) => {
  const role = await Role.findById(req.user.roleId)
  if (!role || !role.permissions.includes(perm)) {
    return res.status(403).json({ message: '權限不足' })
  }
  next()
}
