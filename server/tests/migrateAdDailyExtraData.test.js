import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import authRoutes from '../src/routes/auth.routes.js'
import clientRoutes from '../src/routes/client.routes.js'
import platformRoutes from '../src/routes/platform.routes.js'
import adDailyRoutes from '../src/routes/adDaily.routes.js'
import User from '../src/models/user.model.js'
import Role from '../src/models/role.model.js'
import AdDaily from '../src/models/adDaily.model.js'
import Platform from '../src/models/platform.model.js'
import { migratePlatform } from '../src/scripts/migrateAdDailyExtraData.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

describe('migrateAdDailyExtraData', () => {
  let mongo
  let app
  let token
  let clientId
  let platformId
  const date = new Date('2024-01-02').toISOString()

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create()
    await mongoose.connect(mongo.getUri())

    app = express()
    app.use(express.json())
    app.use('/api/auth', authRoutes)
    app.use('/api/clients', clientRoutes)
    app.use('/api/clients/:clientId/platforms', platformRoutes)
    app.use('/api/clients/:clientId/platforms/:platformId/ad-daily', adDailyRoutes)

    const role = await Role.create({ name: 'manager' })
    await User.create({ username: 'admin', password: 'pwd', email: 'a@b.c', roleId: role._id })
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'pwd' })
    token = res.body.token
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongo.stop()
  })

  it('舊欄位名稱或 slug 可轉為欄位 id 並可由 API 讀取', async () => {
    const clientRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'C1' })
      .expect(201)
    clientId = clientRes.body._id

    const platformRes = await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Meta', fields: [{ id: 'f1', name: 'Name1', slug: 'slug1', type: 'number' }] })
      .expect(201)
    platformId = platformRes.body._id

    await AdDaily.create({
      clientId,
      platformId,
      date,
      extraData: { slug1: 10 },
      colors: { Name1: '#123456' }
    })

    const platformDoc = await Platform.findById(platformId)
    await migratePlatform(platformDoc)

    const doc = await AdDaily.findOne({ platformId })
    expect(doc.extraData).toEqual({ f1: 10 })
    expect(doc.colors).toEqual({ f1: '#123456' })

    const listRes = await request(app)
      .get(`/api/clients/${clientId}/platforms/${platformId}/ad-daily?start=${date}&end=${date}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(listRes.body[0].extraData).toEqual({ f1: 10 })
    expect(listRes.body[0].colors).toEqual({ f1: '#123456' })
  })
})
