/**
 * \u6a94\u6848\u4e0a\u50b3\u8a2d\u5b9a\uff08multer\uff09
 */
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const storage = multer.diskStorage({
  destination: (req, __, cb) => {
    const base = process.env.UPLOAD_DIR || 'uploads'
    const folderId = req.body.folderId
    const dir = folderId ? path.join(base, folderId) : base
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})

export const upload = multer({ storage })
