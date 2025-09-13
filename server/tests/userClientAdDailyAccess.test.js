import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import dotenv from 'dotenv'

import authRoutes from '../src/routes/auth.routes.js'
import adDailyRoutes from '../src/routes/adDaily.routes.js'
import Role from '../src/models/role.model.js'
import User from '../src/models/user.model.js'
import Client from '../src/models/client.model.js'
import Platform from '../src/models/platform.model.js'
import AdDaily from '../src/models/adDaily.model.js'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

describe('使用者客戶授權與廣告資料存取', () => {
  let mongo
  let app
  let tokenA
  let tokenB
  let clientX
  let clientY
  let platformX
  let platformY

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create()
    await mongoose.connect(mongo.getUri())

    app = express()
    app.use(express.json())
    app.use('/api/auth', authRoutes)
    app.use('/api/clients/:clientId/platforms/:platformId/ad-daily', adDailyRoutes)

    const role = await Role.create({ name: 'staff' })

    clientX = await Client.create({ name: 'ClientX' })
    clientY = await Client.create({ name: 'ClientY' })

    platformX = await Platform.create({ clientId: clientX._id, name: 'P1' })
    platformY = await Platform.create({ clientId: clientY._id, name: 'P2' })

    const date = new Date('2024-01-01')
    await AdDaily.create({ clientId: clientX._id, platformId: platformX._id, date, spent: 100 })
    await AdDaily.create({ clientId: clientY._id, platformId: platformY._id, date, spent: 200 })

    await User.create({
      username: 'userA',
      password: 'pwd',
      email: 'a@test.com',
      roleId: role._id,
      allowedClients: [clientX._id]
    })

    await User.create({
      username: 'userB',
      password: 'pwd',
      email: 'b@test.com',
      roleId: role._id,
      allowedClients: [clientX._id, clientY._id]
    })

    const resA = await request(app)
      .post('/api/auth/login')
      .send({ username: 'userA', password: 'pwd' })
    tokenA = resA.body.token

    const resB = await request(app)
      .post('/api/auth/login')
      .send({ username: 'userB', password: 'pwd' })
    tokenB = resB.body.token
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongo.stop()
  })

  it('使用者 A 只能存取客戶 X 的資料', async () => {
    const res = await request(app)
      .get(`/api/clients/${clientX._id}/platforms/${platformX._id}/ad-daily`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].clientId).toBe(String(clientX._id))

    await request(app)
      .get(`/api/clients/${clientY._id}/platforms/${platformY._id}/ad-daily`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403)
  })

  it('使用者 B 可存取客戶 X 與 Y 的資料', async () => {
    const resX = await request(app)
      .get(`/api/clients/${clientX._id}/platforms/${platformX._id}/ad-daily`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200)
    expect(resX.body[0].clientId).toBe(String(clientX._id))

    const resY = await request(app)
      .get(`/api/clients/${clientY._id}/platforms/${platformY._id}/ad-daily`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200)
    expect(resY.body[0].clientId).toBe(String(clientY._id))
  })
})
