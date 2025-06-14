import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Asset from '../models/asset.model.js'
import User from '../models/user.model.js'
import Role from '../models/role.model.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI)

  const assets = await Asset.find({})

  for (const a of assets) {
    if (!a.uploadedBy) continue
    const user = await User.findById(a.uploadedBy).populate('roleId', 'name')
    const role = user?.roleId?.name
    if (role && !a.allowRoles.includes(role)) {
      a.allowRoles.push(role)
      await a.save()
    }
  }

  await mongoose.disconnect()
}

run().catch(err => {
  console.error(err)
  mongoose.disconnect()
})
