import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import dotenv from 'dotenv'

import dashboardRoutes from '../src/routes/dashboard.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import AdDaily from '../src/models/adDaily.model.js'
import User from '../src/models/user.model.js'
import Role from '../src/models/role.model.js'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/dashboard', dashboardRoutes)

  const role = await Role.create({ name: 'manager' })
  await User.create({
    username: 'admin',
    password: 'pwd',
    email: 'admin@test.com',
    roleId: role._id
  })
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'pwd' })
  token = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('GET /api/dashboard/daily', () => {
  it('aggregates daily ad data', async () => {
    const clientId = new mongoose.Types.ObjectId()
    const platformId = new mongoose.Types.ObjectId()
    const base = new Date('2024-06-10')
    for (let i = 0; i < 3; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() - i)
      await AdDaily.create({ clientId, platformId, date: d, spent: i + 1 })
    }

    const res = await request(app)
      .get('/api/dashboard/daily?days=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body.length).toBe(3)
    expect(res.body[0].date).toBe('2024-06-08')
    expect(res.body[2].spent).toBe(1)
  })

  it('filters by client and platform', async () => {
    const c1 = new mongoose.Types.ObjectId()
    const p1 = new mongoose.Types.ObjectId()
    const c2 = new mongoose.Types.ObjectId()
    const p2 = new mongoose.Types.ObjectId()

    await AdDaily.create({ clientId: c1, platformId: p1, date: new Date('2024-06-10'), spent: 5 })
    await AdDaily.create({ clientId: c2, platformId: p2, date: new Date('2024-06-10'), spent: 2 })

    const res = await request(app)
      .get(`/api/dashboard/daily?clientId=${c1}&platformId=${p1}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body.length).toBe(1)
    expect(res.body[0].spent).toBe(5)
  })
})
