/**
 * \u8cac\u4efb\u9023\u7dda MongoDB
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('\u2705 MongoDB \u5df2\u9023\u7dda')
  } catch (err) {
    console.error('\u274C MongoDB \u9023\u7dda\u5931\u6557\uff1a', err.message)
    process.exit(1)
  }
}

export default connectDB
