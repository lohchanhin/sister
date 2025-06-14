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
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let clientId
let platformId

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

describe('Client and AdDaily', () => {
  it('create client', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '測試客戶', email: 'a@test.com' })
      .expect(201)
    expect(res.body.name).toBe('測試客戶')
    clientId = res.body._id
  })

  it('create platform', async () => {
    const res = await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Meta', platformType: 'Meta' })
      .expect(201)
    platformId = res.body._id
  })

  it('weekly aggregate', async () => {
    const start = new Date('2024-01-01')
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      await request(app)
        .post(`/api/clients/${clientId}/platforms/${platformId}/ad-daily`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: d.toISOString(), spent: 10 })
        .expect(201)
    }

    const res = await request(app)
      .get(`/api/clients/${clientId}/platforms/${platformId}/ad-daily/weekly`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.body[0].spent).toBe(70)
  })

  it('create adDaily with currency string', async () => {
    const res = await request(app)
      .post(`/api/clients/${clientId}/platforms/${platformId}/ad-daily`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: new Date('2024-02-01').toISOString(),
        spent: '$10',
        enquiries: '5件',
        reach: '1,000',
        impressions: '2,000',
        clicks: '7'
      })
      .expect(201)
    expect(res.body.spent).toBe(10)
    expect(res.body.enquiries).toBe(5)
    expect(res.body.reach).toBe(1000)
    expect(res.body.impressions).toBe(2000)
    expect(res.body.clicks).toBe(7)
  })
})
