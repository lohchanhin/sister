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
import { migratePlatform } from '../src/scripts/migrateExtraDataFieldId.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let clientId
let platformId
const date = new Date('2024-01-01').toISOString()

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
  await User.create({ username: 'admin', password: 'pwd', email: 'test@test', roleId: role._id })
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'pwd' })
  token = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('migrate old adDaily data and ensure API returns field id', () => {
  it('migrates old data without field id and still accessible after field rename', async () => {
    const clientRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ClientA' })
      .expect(201)
    clientId = clientRes.body._id

    const platformRes = await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Meta', fields: [{ id: 'f1', name: 'Old', slug: 'old', type: 'number' }] })
      .expect(201)
    platformId = platformRes.body._id

    await AdDaily.create({
      clientId,
      platformId,
      date,
      extraData: { old: 5 }
    })

    const platformDoc = await Platform.findById(platformId)
    await migratePlatform(platformDoc)

    await request(app)
      .put(`/api/clients/${clientId}/platforms/${platformId}/rename-field`)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 'f1', name: 'New', slug: 'new' })
      .expect(200)

    const list = await request(app)
      .get(`/api/clients/${clientId}/platforms/${platformId}/ad-daily?start=${date}&end=${date}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(list.body[0].extraData).toEqual({ f1: 5 })
  })
})
