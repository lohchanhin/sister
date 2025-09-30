import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import userRoutes from '../src/routes/user.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import Role from '../src/models/role.model.js'
import User from '../src/models/user.model.js'
import { PERMISSIONS } from '../src/config/permissions.js'
import { requirePerm, requireAnyPerm } from '../src/middleware/permission.js'
import { protect } from '../src/middleware/auth.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let tokenLimited
let tokenAssetOnly
let tokenNoPermission

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/user', userRoutes)
  app.get(
    '/api/multi',
    protect,
    requirePerm(PERMISSIONS.USER_MANAGE, PERMISSIONS.ASSET_CREATE),
    (req, res) => res.status(200).end()
  )
  app.get(
    '/api/either',
    protect,
    requireAnyPerm(PERMISSIONS.USER_MANAGE, PERMISSIONS.ASSET_CREATE),
    (req, res) => res.status(200).end()
  )

  const role = await Role.create({
    name: 'manager',
    permissions: [PERMISSIONS.USER_MANAGE, PERMISSIONS.ASSET_CREATE]
  })

  await User.create({
    username: 'admin',
    password: 'mypwd',
    email: 'admin@example.com',
    roleId: role._id
  })

  const roleLimited = await Role.create({
    name: 'limited',
    permissions: [PERMISSIONS.USER_MANAGE]
  })

  await User.create({
    username: 'limited',
    password: 'pwd',
    email: 'limited@example.com',
    roleId: roleLimited._id
  })

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'mypwd' })
  token = res.body.token

  const res2 = await request(app)
    .post('/api/auth/login')
    .send({ username: 'limited', password: 'pwd' })
  tokenLimited = res2.body.token

  const roleAssetOnly = await Role.create({
    name: 'assetOnly',
    permissions: [PERMISSIONS.ASSET_CREATE]
  })

  await User.create({
    username: 'asset',
    password: 'pwd',
    email: 'asset@example.com',
    roleId: roleAssetOnly._id
  })

  const res3 = await request(app)
    .post('/api/auth/login')
    .send({ username: 'asset', password: 'pwd' })
  tokenAssetOnly = res3.body.token

  const roleNoPermission = await Role.create({
    name: 'viewer',
    permissions: []
  })

  await User.create({
    username: 'viewer',
    password: 'pwd',
    email: 'viewer@example.com',
    roleId: roleNoPermission._id
  })

  const res4 = await request(app)
    .post('/api/auth/login')
    .send({ username: 'viewer', password: 'pwd' })
  tokenNoPermission = res4.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('permission middleware with populated role', () => {
  it('allows access when role has permission', async () => {
    await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
  })

  it('allows access when role has all required permissions', async () => {
    await request(app)
      .get('/api/multi')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
  })

  it('denies access when missing some permissions', async () => {
    await request(app)
      .get('/api/multi')
      .set('Authorization', `Bearer ${tokenLimited}`)
      .expect(403)
  })

  it('allows access when user 任一權限即通過', async () => {
    await request(app)
      .get('/api/either')
      .set('Authorization', `Bearer ${tokenLimited}`)
      .expect(200)

    await request(app)
      .get('/api/either')
      .set('Authorization', `Bearer ${tokenAssetOnly}`)
      .expect(200)
  })

  it('denies access when no permission matches', async () => {
    await request(app)
      .get('/api/either')
      .set('Authorization', `Bearer ${tokenNoPermission}`)
      .expect(403)
  })
})
