import { Storage } from '@google-cloud/storage'
import path from 'node:path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const storageOptions = {
  projectId: process.env.GCS_PROJECT_ID
}

if (process.env.GCS_KEY_FILE) {
  storageOptions.keyFilename = process.env.GCS_KEY_FILE
}

const storage = new Storage(storageOptions)

const bucket = storage.bucket(process.env.GCS_BUCKET)

/**
 * ✅ 使用記憶體 buffer 寫入 GCS（完全串流）
 */
export const uploadStream = (buffer, destination, contentType) => {
  return new Promise((resolve, reject) => {
    const file = bucket.file(destination)
    const stream = file.createWriteStream({
      resumable: false,
      metadata: { contentType }
    })

    stream.on('error', reject)
    stream.on('finish', () => resolve(destination))
    stream.end(buffer)
  })
}

/**
 * 直接將檔案路徑內容串流寫入 GCS
 */
export const uploadFile = (filePath, destination, contentType) => {
  return new Promise((resolve, reject) => {
    const file = bucket.file(destination)
    const stream = file.createWriteStream({
      resumable: false,
      metadata: { contentType }
    })
    fs.createReadStream(filePath)
      .on('error', reject)
      .pipe(stream)
      .on('error', reject)
      .on('finish', () => resolve(destination))
  })
}

/**
 * （可選）備用：直接使用 GCS 的 save 方法寫 buffer（非 stream）
 */
export const uploadBuffer = async (buffer, destination, contentType) => {
  const file = bucket.file(destination)
  await file.save(buffer, {
    resumable: false,
    metadata: { contentType }
  })
  return destination
}

/**
 * 取得 GCS 檔案的簽署 URL（預設有效 1 小時）
 */
export const getSignedUrl = async (filePath, options = {}) => {
  if (process.env.NODE_ENV === 'test') {
    return `https://signed.example.com/${filePath}`
  }
  const file = bucket.file(filePath)
  const opts = {
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000,
    ...options
  }
  const [url] = await file.getSignedUrl(opts)
  return url
}

export default bucket
