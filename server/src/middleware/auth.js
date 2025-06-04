/**
 * \u9a57\u8b49 JWT\uff0c\u4e26\u5c07\u4f7f\u7528\u8005\u5beb\u5165 req.user
 */
import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import dotenv from 'dotenv'
dotenv.config()

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: '\u672a\u767b\u5165\u6216 Token \u932f\u8aa4' })
  }
  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
    if (!req.user) throw new Error('\u4f7f\u7528\u8005\u4e0d\u5b58\u5728')
    next()
  } catch (err) {
    res.status(401).json({ message: 'Token \u7121\u6548' })
  }
}
