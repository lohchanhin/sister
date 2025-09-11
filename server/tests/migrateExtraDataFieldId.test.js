import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Platform from '../src/models/platform.model.js'
import AdDaily from '../src/models/adDaily.model.js'
import Client from '../src/models/client.model.js'
import { migratePlatform, oldFieldMappings } from '../src/scripts/migrateExtraDataFieldId.js'

describe('migrateExtraDataFieldId 舊名稱映射', () => {
  let mongo
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create()
    await mongoose.connect(mongo.getUri())
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongo.stop()
  })

  it('舊欄位名稱可轉換為對應的欄位 id', async () => {
    oldFieldMappings.Meta = { old: 'new' }
    const client = await Client.create({ name: 'C1' })
    const platform = await Platform.create({
      clientId: client._id,
      name: 'Meta',
      fields: [{ id: 'f1', name: 'New', slug: 'new', type: 'number' }]
    })
    await AdDaily.create({
      clientId: client._id,
      platformId: platform._id,
      date: new Date(),
      extraData: { old: 5 },
      colors: { old: '#fff' }
    })

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    await migratePlatform(platform)
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()

    const doc = await AdDaily.findOne({ platformId: platform._id })
    expect(doc.extraData).toEqual({ f1: 5 })
    expect(doc.colors).toEqual({ f1: '#fff' })
  })

  it('欄位 id 已存在時應保持不變', async () => {
    oldFieldMappings.Meta = {}
    const client = await Client.create({ name: 'C2' })
    const platform = await Platform.create({
      clientId: client._id,
      name: 'Meta',
      fields: [{ id: 'f1', name: 'New', slug: 'new', type: 'number' }]
    })
    await AdDaily.create({
      clientId: client._id,
      platformId: platform._id,
      date: new Date(),
      extraData: { f1: 5 },
      colors: { f1: '#fff' }
    })

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    await migratePlatform(platform)
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()

    const doc = await AdDaily.findOne({ platformId: platform._id })
    expect(doc.extraData).toEqual({ f1: 5 })
    expect(doc.colors).toEqual({ f1: '#fff' })
  })
})
