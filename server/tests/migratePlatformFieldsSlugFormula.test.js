import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Client from '../src/models/client.model.js'
import Platform from '../src/models/platform.model.js'
import { migratePlatform } from '../src/scripts/migratePlatformFieldsSlugFormula.js'

describe('migratePlatformFieldsSlugFormula', () => {
  let mongo
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create()
    await mongoose.connect(mongo.getUri())
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongo.stop()
  })

  it('補齊 slug 與 formula 並確保 slug 唯一', async () => {
    const client = await Client.create({ name: 'C1' })
    const platform = await Platform.create({
      clientId: client._id,
      name: 'Meta',
      fields: [
        { id: 'f1', name: 'Field One' },
        { id: 'f2', name: 'Field One', slug: '' },
        { id: 'f3', name: 'Field Two', slug: 'field_two' }
      ]
    })

    await migratePlatform(platform)

    const p = await Platform.findById(platform._id)
    const slugs = p.fields.map(f => f.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    const field1 = p.fields.find(f => f.id === 'f1')
    const field2 = p.fields.find(f => f.id === 'f2')
    const field3 = p.fields.find(f => f.id === 'f3')
    expect(field1.slug).toBe('field_one')
    expect(field2.slug).toBe('f_1')
    expect(field3.slug).toBe('field_two')
    p.fields.forEach(f => {
      expect(f.formula).toBe('')
    })
  })
})
