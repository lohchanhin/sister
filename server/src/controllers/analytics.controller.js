/**
 * \u6b64 controller \u672a\u4f7f\u7528\uff0c\u50c5\u4f5c\u70ba\u65b9\u6848\u4f9d\u4f5c\u8655\u3002
 * \u9019\u88e1\u50c5\u793a\u7bc4\u53d6\u5f97\u5047\u6578\u64da\uff1b\u5be6\u52d9\u4e0a\u53ef\u4e32\u63a5 Facebook / XHS API
 */
import { getCache, setCache } from '../utils/cache.js'

export const getSummary = async (_req, res) => {
  const cacheKey = 'analytics:summary'
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  // TODO: 待串接第三方服務取得統計資料
  const data = []
  await setCache(cacheKey, data)
  res.json(data)
}
