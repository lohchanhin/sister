import Role from '../models/role.model.js'

export const requirePerm = (perm) => async (req, res, next) => {
  const role = await Role.findOne({ name: req.user.role })
  if (!role || !role.permissions.includes(perm)) {
    return res.status(403).json({ message: '\u6b0a\u9650\u4e0d\u8db3' })
  }
  next()
}
