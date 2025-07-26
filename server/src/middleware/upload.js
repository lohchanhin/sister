/**
 * 檔案上傳設定（使用 diskStorage 暫存檔案）
 */
import multer from 'multer'
import fs from 'node:fs'

const uploadDir = process.env.UPLOAD_DIR || '/tmp/uploads'
fs.mkdirSync(uploadDir, { recursive: true })

export const upload = multer({
  storage: multer.diskStorage({ destination: uploadDir }),
  limits: { fileSize: 1500 * 1024 * 1024 } // 限制檔案大小為 1.5GB
})
