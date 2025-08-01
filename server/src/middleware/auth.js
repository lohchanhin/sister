import { t } from '../i18n/messages.js'
/**
 * 驗證 JWT，並把登入者寫入 req.user
 */
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import User from '../models/user.model.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  /* 沒帶 Bearer Token */
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: t('NOT_LOGGED_IN') });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('roleId');
    if (!user) {
      return res.status(404).json({ message: t('USER_NOT_FOUND') });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: t('TOKEN_INVALID') });
  }
};
