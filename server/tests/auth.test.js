import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import authRoutes from '../src/routes/auth.routes.js'
import User from '../src/models/user.model.js'
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

  await User.create({
    username: 'admin',
    password: 'mypwd',
    email: 'admin@example.com',
    role: 'manager'
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
  })
})
