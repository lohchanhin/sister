import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import authRoutes from '../src/routes/auth.routes.js'
import clientRoutes from '../src/routes/client.routes.js'
import platformRoutes from '../src/routes/platform.routes.js'
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

  const role = await Role.create({ name: 'manager' })
  await User.create({ username: 'admin', password: 'pwd', email: 'test@test', roleId: role._id })
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'pwd' })
  token = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('Platform API', () => {
  it('create client', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ClientA' })
      .expect(201)
    clientId = res.body._id
  })

  it('platform CRUD', async () => {
    const resC = await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Meta', platformType: 'Meta' })
      .expect(201)
    platformId = resC.body._id

    const resG = await request(app)
      .get(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(resG.body.length).toBe(1)

    await request(app)
      .put(`/api/clients/${clientId}/platforms/${platformId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Meta2' })
      .expect(200)

    await request(app)
      .delete(`/api/clients/${clientId}/platforms/${platformId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
  })

  it('duplicate platform name returns 409', async () => {
    await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dup', platformType: 'Meta' })
      .expect(201)

    const res = await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dup', platformType: 'Meta' })
      .expect(409)
    expect(res.body.message).toBe('平台名稱重複')
  })
})
