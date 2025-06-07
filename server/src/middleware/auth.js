/**
 * 驗證 JWT，並把登入者寫入 req.user
 */
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
dotenv.config();

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  /* 沒帶 Bearer Token */
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未登入或 Token 錯誤' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '使用者不存在' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token 無效' });
  }
};
