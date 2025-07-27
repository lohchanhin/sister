import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import dotenv from 'dotenv'

import dashboardRoutes from '../src/routes/dashboard.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import assetRoutes from '../src/routes/asset.routes.js'
import Asset from '../src/models/asset.model.js'
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
  app.use('/api/assets', assetRoutes)

  const role = await Role.create({ name: 'manager', permissions: ['asset:create', 'asset:read', 'asset:update'] })
  await User.create({ username: 'admin', password: 'pwd', email: 'a@test.com', roleId: role._id })

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'pwd' })
  token = res.body.token

  await Asset.create({ filename: 'a.mp4', path: '/tmp/a.mp4', type: 'raw' })
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

test('summary updates after asset creation', async () => {
  const res1 = await request(app)
    .get('/api/dashboard/summary')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
  expect(res1.body.assetStats.rawTotal).toBe(1)

  await request(app)
    .post('/api/assets')
    .set('Authorization', `Bearer ${token}`)
    .send({ filename: 'b.mp4', path: '/tmp/b.mp4' })
    .expect(201)

  const res2 = await request(app)
    .get('/api/dashboard/summary')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
  expect(res2.body.assetStats.rawTotal).toBe(2)
})

test('summary updates after asset update', async () => {
  const create = await request(app)
    .post('/api/assets')
    .set('Authorization', `Bearer ${token}`)
    .send({ filename: 'c.mp4', path: '/tmp/c.mp4', type: 'edited' })
    .expect(201)

  const id = create.body._id

  const first = await request(app)
    .get('/api/dashboard/summary')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
  expect(first.body.recentProducts[0].finalChecked).toBe(false)

  await request(app)
    .put(`/api/assets/${id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ finalChecked: true })
    .expect(200)

  const second = await request(app)
    .get('/api/dashboard/summary')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
  expect(second.body.recentProducts[0].finalChecked).toBe(true)
})
