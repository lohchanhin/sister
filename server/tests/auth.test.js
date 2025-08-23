import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import authRoutes from '../src/routes/auth.routes.js'
import User from '../src/models/user.model.js'
import Role from '../src/models/role.model.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })

let mongo
let app

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)

  const role = await Role.create({ name: 'manager' })
  await User.create({
    username: 'admin',
    password: 'mypwd',
    email: 'admin@example.com',
    roleId: role._id
  })
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('POST /api/auth/login', () => {
  it('should return token and user role when credentials are correct', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'mypwd' })
      .expect(200)

    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('user.role')
    expect(res.body.user).toHaveProperty('permissions')
  })

  it('should return 400 if username is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'mypwd' })
      .expect(400)

    expect(res.body.message).toBe('Username is required')
  })
})

describe('POST /api/auth/register', () => {
  it('should return 400 if email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'new', password: 'mypwd', email: 'notemail', role: 'manager' })
      .expect(400)

    expect(res.body.message).toBe('Email is invalid')
  })
})
