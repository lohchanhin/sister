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
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

describe('getAdDaily slug key migration', () => {
  let mongo
  let app
  let token
  let clientId
  let platformId
  let fieldId
  const date = new Date('2024-09-01').toISOString()

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
    await User.create({ username: 'admin', password: 'pwd', email: 'admin@test', roleId: role._id })
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'pwd' })
    token = res.body.token
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongo.stop()
  })

  it('將舊 slug 的 extraData 與 colors 轉換為欄位 id', async () => {
    const clientRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'C1' })
      .expect(201)
    clientId = clientRes.body._id

    const platformRes = await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'P1', fields: [{ name: 'F1', slug: 'f1', type: 'number' }] })
      .expect(201)
    platformId = platformRes.body._id
    fieldId = platformRes.body.fields[0].id

    await AdDaily.create({
      clientId,
      platformId,
      date: new Date(date),
      extraData: { f1: 10 },
      colors: { f1: '#123456' }
    })

    const res = await request(app)
      .get(`/api/clients/${clientId}/platforms/${platformId}/ad-daily?start=${date}&end=${date}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body[0].extraData).toEqual({ [fieldId]: 10 })
    expect(res.body[0].colors).toEqual({ [fieldId]: '#123456' })

    const saved = await AdDaily.findOne({ clientId, platformId }).lean()
    expect(saved.extraData).toEqual({ [fieldId]: 10 })
    expect(saved.colors).toEqual({ [fieldId]: '#123456' })
  })

  it('拒絕未授權客戶存取', async () => {
    const otherClient = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'C2' })
      .expect(201)

    const role = await Role.create({ name: 'staff' })
    await User.create({
      username: 'limited',
      password: 'pwd',
      email: 'limited@test',
      roleId: role._id,
      allowedClients: [otherClient.body._id]
    })
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'limited', password: 'pwd' })
    const limitedToken = login.body.token

    await request(app)
      .get(`/api/clients/${clientId}/platforms/${platformId}/ad-daily`)
      .set('Authorization', `Bearer ${limitedToken}`)
      .expect(403)
  })
})
