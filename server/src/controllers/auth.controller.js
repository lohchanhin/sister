import User from '../models/user.model.js'
import Role from '../models/role.model.js'
import { generateToken } from '../utils/generateToken.js'

/* ---------- POST /api/auth/login ---------- */
export const login = async (req, res) => {
  const { username, password } = req.body
  const user = await User.findOne({ username })
    .select('+password')
    .populate('roleId')
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: '\u5e33\u865f\u6216\u5bc6\u78bc\u932f\u8aa4' })
  }
  const token = generateToken(user._id)
  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      role: user.roleId?.name,
      menus: user.roleId?.menus || []
    }
  })
}

/* ---------- POST /api/auth/register (\u53ef\u9078) ---------- */
export const register = async (req, res) => {
  const { username, password, email, role } = req.body
  const exists = await User.findOne({ username })
  if (exists) return res.status(400).json({ message: '\u4f7f\u7528\u8005\u5df2\u5b58\u5728' })
  const roleDoc = await Role.findOne({ name: role })
  const newUser = await User.create({
    username,
    password,
    email,
    roleId: roleDoc?._id
  })
  res.status(201).json({
    user: {
      id: newUser._id,
      username: newUser.username,
      role: roleDoc?.name,
      menus: roleDoc?.menus || []
    }
  })
}
