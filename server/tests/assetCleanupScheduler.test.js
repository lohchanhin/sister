import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Asset from '../src/models/asset.model.js'
import AssetDeletionLog from '../src/models/assetDeletionLog.model.js'
import { runAssetCleanup } from '../src/services/assetCleanupScheduler.js'

let mongo

describe('asset cleanup scheduler', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    mongo = await MongoMemoryServer.create()
    await mongoose.connect(mongo.getUri())
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongo.stop()
  })

  beforeEach(async () => {
    await Asset.deleteMany({})
    await AssetDeletionLog.deleteMany({})
  })

  it('removes assets older than 90 days and records logs', async () => {
    const oldAsset = await Asset.create({ filename: 'old.mp4', path: '/tmp/old.mp4', type: 'raw' })
    await Asset.updateOne(
      { _id: oldAsset._id },
      { createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) }
    )
    const recentAsset = await Asset.create({ filename: 'recent.mp4', path: '/tmp/recent.mp4', type: 'raw' })

    const result = await runAssetCleanup()

    const removed = await Asset.findById(oldAsset._id)
    const remained = await Asset.findById(recentAsset._id)
    const logs = await AssetDeletionLog.find({ assetId: oldAsset._id })

    expect(result.deletedCount).toBe(1)
    expect(removed).toBeNull()
    expect(remained).not.toBeNull()
    expect(logs).toHaveLength(1)
    expect(logs[0].method).toBe('scheduled')
  })
})
