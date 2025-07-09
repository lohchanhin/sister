/**
 * \u6a94\u6848\u4e0a\u50b3\u8a2d\u5b9a\uff08multer\uff09
 */
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'

const tmpDir = path.resolve('tmp')
fs.mkdirSync(tmpDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, unique + ext)
  }
})

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
})
