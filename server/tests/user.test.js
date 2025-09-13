import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import userRoutes from '../src/routes/user.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import Role from '../src/models/role.model.js'
import User from '../src/models/user.model.js'
import Client from '../src/models/client.model.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let client1

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

  client1 = await Client.create({ name: 'ClientA' })

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
      .send({ username: 'u1', name: 'U1', email: 'u1@example.com', role: 'employee', password: 'pwd', allowedClients: [client1._id] })
      .expect(201)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'u1', password: 'pwd' })
      .expect(200)

    expect(res.body).toHaveProperty('token')
    expect(res.body.user.allowedClients[0]).toEqual(client1._id.toString())
  })
})

describe('validation', () => {
  it('should return 400 when creating user without username', async () => {
    const res = await request(app)
      .post('/api/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'U2', email: 'u2@example.com', role: 'employee', password: 'pwd' })
      .expect(400)

    expect(res.body.message).toBe('Username is required')
  })

  it('should return 400 when updating user with invalid email', async () => {
    const created = await request(app)
      .post('/api/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'u3', name: 'U3', email: 'u3@example.com', role: 'employee', password: 'pwd' })

    const res = await request(app)
      .put(`/api/user/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'notanemail' })
      .expect(400)

    expect(res.body.message).toBe('Email is invalid')
  })
})

describe('授權客戶清單管理', () => {
  it('可新增與刪除授權客戶', async () => {
    const client2 = await Client.create({ name: 'ClientB' })

    const created = await request(app)
      .post('/api/user')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'u4', name: 'U4', email: 'u4@example.com', role: 'employee', password: 'pwd', allowedClients: [client1._id] })
      .expect(201)

    const updated = await request(app)
      .put(`/api/user/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ allowedClients: [client1._id, client2._id] })
      .expect(200)
    expect(updated.body.allowedClients).toContain(client1._id.toString())
    expect(updated.body.allowedClients).toContain(client2._id.toString())
    expect(updated.body.allowedClients.length).toBe(2)

    const removed = await request(app)
      .put(`/api/user/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ allowedClients: [] })
      .expect(200)
    expect(removed.body.allowedClients.length).toBe(0)
  })
})
