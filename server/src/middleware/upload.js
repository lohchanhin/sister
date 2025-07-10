/**
 * 檔案上傳設定（使用 memoryStorage 串流不落地）
 */
import multer from 'multer'

export const upload = multer({
  storage: multer.memoryStorage(),       // ✅ 改為記憶體儲存，不寫磁碟
  limits: { fileSize: 10 * 1024 * 1024 }  // ✅ 限制單檔最大 10MB，可依需要調整
})
