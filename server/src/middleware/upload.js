/**
 * 檔案上傳設定（使用 memoryStorage 串流不落地）
 */
import multer from 'multer'

export const upload = multer({
  storage: multer.memoryStorage(),       // ✅ 改為記憶體儲存，不寫磁碟  
})
