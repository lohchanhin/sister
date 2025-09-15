import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import dotenv from 'dotenv'

import clientRoutes from '../src/routes/client.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import User from '../src/models/user.model.js'
import Role from '../src/models/role.model.js'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let app
let mongo
let managerToken

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/clients', clientRoutes)

  const role = await Role.create({ name: 'manager' })
  await User.create({ username: 'manager', password: 'pwd', email: 'manager@test.com', roleId: role._id })

  const res = await request(app).post('/api/auth/login').send({ username: 'manager', password: 'pwd' })
  managerToken = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('新客戶自動授權給管理員', () => {
  it('manager 可以看到新建立的客戶', async () => {
    const createRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Client X' })
      .expect(201)

    const listRes = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200)

    expect(listRes.body.some(c => c._id === createRes.body._id)).toBe(true)
  })
})
