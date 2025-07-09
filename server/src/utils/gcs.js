import { Storage } from '@google-cloud/storage'
import path from 'node:path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILE
})

const bucket = storage.bucket(process.env.GCS_BUCKET)

export const uploadBuffer = async (buffer, destination, contentType) => {
  const file = bucket.file(destination)
  await file.save(buffer, {
    resumable: false,
    metadata: { contentType }
  })
  return destination
}

export const uploadStream = async (filePath, destination, contentType) => {
  const opts = { destination, resumable: false, metadata: { contentType } }
  await bucket.upload(filePath, opts)
  return destination
}


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
