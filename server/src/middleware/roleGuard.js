import { t } from '../i18n/messages.js'
/**
 * \u9650\u5236\u7279\u5b9a\u89d2\u8272\u624d\u80fd\u5b58\u53d6
 */
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.roleId?.name)) {
      return res.status(403).json({ message: t('PERMISSION_DENIED') })
    }
    next()
  }
