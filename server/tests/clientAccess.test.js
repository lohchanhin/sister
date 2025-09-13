import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import dotenv from 'dotenv'

import clientRoutes from '../src/routes/client.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import User from '../src/models/user.model.js'
import Role from '../src/models/role.model.js'
import Client from '../src/models/client.model.js'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let app
let mongo
let adminToken
let limitedToken
let clientA

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/clients', clientRoutes)

  clientA = await Client.create({ name: 'Client A' })
  await Client.create({ name: 'Client B' })

  const role = await Role.create({ name: 'staff' })

  await User.create({ username: 'admin', password: 'pwd', email: 'admin@test.com', roleId: role._id })
  const adminRes = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'pwd' })
  adminToken = adminRes.body.token

  await User.create({ username: 'limited', password: 'pwd', email: 'limited@test.com', roleId: role._id, allowedClients: [clientA._id] })
  const limitedRes = await request(app).post('/api/auth/login').send({ username: 'limited', password: 'pwd' })
  limitedToken = limitedRes.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('GET /api/clients', () => {
  it('只回傳被授權的客戶', async () => {
    await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${limitedToken}`)
      .expect(200)

    expect(res.body).toHaveLength(1)
    expect(res.body[0]._id).toBe(clientA._id.toString())
  })
})
