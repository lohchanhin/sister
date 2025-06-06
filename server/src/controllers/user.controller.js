import User from '../models/user.model.js'

/* ---------- GET /api/user/profile ---------- */
export const getProfile = async (req, res) => {
  res.json(req.user)
}

/* ---------- PUT /api/user/profile ---------- */
export const updateProfile = async (req, res) => {
  const { username, email, password } = req.body
  const user = await User.findById(req.user._id).select('+password')
  if (!user) return res.status(404).json({ message: '使用者不存在' })
  if (username) user.username = username
  if (email) user.email = email
  if (password) user.password = password
  await user.save()
  const updated = await User.findById(user._id).select('-password')
  res.json(updated)
}
