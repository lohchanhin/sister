/**
 * \u8cac\u4efb\u9023\u7dda MongoDB
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import logger from './logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    logger.info('\u2705 MongoDB \u5df2\u9023\u7dda')
  } catch (err) {
    logger.error('\u274C MongoDB \u9023\u7dda\u5931\u6557\uff1a', err.message)
    process.exit(1)
  }
}

export default connectDB
