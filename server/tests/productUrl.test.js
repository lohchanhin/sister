import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import productRoutes from '../src/routes/product.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import Asset from '../src/models/asset.model.js'
import User from '../src/models/user.model.js'
import Role from '../src/models/role.model.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let tokenNoPerm
let productId

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/products', productRoutes)

  const managerRole = await Role.create({ name: 'manager', permissions: ['asset:read'] })
  const empRole = await Role.create({ name: 'emp', permissions: [] })

  await User.create({ username: 'admin', password: 'pwd', email: 'a@test', roleId: managerRole._id })
  await User.create({ username: 'emp', password: 'pwd', email: 'e@test', roleId: empRole._id })

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'pwd' })
  token = res.body.token

  const res2 = await request(app)
    .post('/api/auth/login')
    .send({ username: 'emp', password: 'pwd' })
  tokenNoPerm = res2.body.token

  const product = await Asset.create({ filename: 'p.mp4', path: '/tmp/p.mp4', type: 'edited' })
  productId = product._id
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('Product signed url', () => {
  it('should return signed url', async () => {
    const res = await request(app)
      .get(`/api/products/${productId}/url`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.body.url).toMatch(/^https?:\/\/.*p\.mp4/)
  })

  it('should return 403 when no permission', async () => {
    await request(app)
      .get(`/api/products/${productId}/url`)
      .set('Authorization', `Bearer ${tokenNoPerm}`)
      .expect(403)
  })

  it('should return 404 when product not found', async () => {
    const id = new mongoose.Types.ObjectId()
    await request(app)
      .get(`/api/products/${id}/url`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
  })

  it('should return 400 when invalid id', async () => {
    await request(app)
      .get('/api/products/invalid-id/url')
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
  })
})

describe('Get product', () => {
  it('should return 400 when invalid id', async () => {
    await request(app)
      .get('/api/products/invalid-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
  })
})
