import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import userRoutes from '../src/routes/user.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import Role from '../src/models/role.model.js'
import User from '../src/models/user.model.js'
import dotenv from 'dotenv'

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
  app.use('/api/user', userRoutes)

  const managerRole = await Role.create({ name: 'manager', permissions: ['user:manage'] })
  const employeeRole = await Role.create({ name: 'employee' })

  await User.create({
    username: 'admin',
    password: 'mypwd',
    email: 'admin@example.com',
    roleId: managerRole._id
  })

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'mypwd' })
  token = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('create user then login', () => {
  it('should create user and allow login', async () => {
    await request(app)
      .post('/api/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'u1', name: 'U1', email: 'u1@example.com', role: 'employee', password: 'pwd' })
      .expect(201)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'u1', password: 'pwd' })
      .expect(200)

    expect(res.body).toHaveProperty('token')
  })
})
