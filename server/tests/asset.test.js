import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import assetRoutes from '../src/routes/asset.routes.js'
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
let tokenEmp
let assetId
let assetOnlyManager
let assetByUser
let assetEmployee
let empId

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/assets', assetRoutes)

  const managerRole = await Role.create({ name: 'manager', permissions: ['review:manage', 'asset:read'] })
  const empRole = await Role.create({ name: 'employee', permissions: ['asset:read'] })

  await User.create({
    username: 'admin',
    password: 'mypwd',
    email: 'admin@example.com',
    roleId: managerRole._id
  })
  const emp = await User.create({
    username: 'emp',
    password: 'pwd',
    email: 'emp@example.com',
    roleId: empRole._id
  })
  empId = emp._id

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'mypwd' })
  token = res.body.token

  const res2 = await request(app)
    .post('/api/auth/login')
    .send({ username: 'emp', password: 'pwd' })
  tokenEmp = res2.body.token

  const a = await Asset.create({ filename: 'file.mp4', path: '/tmp/file.mp4', type: 'edited' })
  assetId = a._id
  assetOnlyManager = await Asset.create({ filename: 'm.mp4', path: '/tmp/m.mp4', type: 'edited', allowRoles: ['manager'] })
  assetByUser = await Asset.create({ filename: 'u.mp4', path: '/tmp/u.mp4', type: 'edited', allowRoles: [], allowedUsers: [emp._id] })
  assetEmployee = await Asset.create({ filename: 'e.mp4', path: '/tmp/e.mp4', type: 'edited', allowRoles: ['employee'] })
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('Asset review', () => {
  it('update reviewStatus', async () => {
    const res = await request(app)
      .put(`/api/assets/${assetId}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reviewStatus: 'approved' })
      .expect(200)
    expect(res.body.reviewStatus).toBe('approved')
  })
})

describe('Asset update permission', () => {
  it('should return 403 when no permission', async () => {
    await request(app)
      .put(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'new title' })
      .expect(403)
  })
})

describe('Asset access control', () => {
  it('manager should only see permitted assets', async () => {
    const res = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    const ids = res.body.map(a => a._id)
    expect(ids).toContain(assetId.toString())
    expect(ids).toContain(assetOnlyManager._id.toString())
    expect(ids).not.toContain(assetByUser._id.toString())
    expect(ids).not.toContain(assetEmployee._id.toString())
  })

  it('employee should see allowed assets', async () => {
    const res = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${tokenEmp}`)
      .expect(200)
    const ids = res.body.map(a => a._id)
    expect(ids).toContain(assetId.toString())
    expect(ids).toContain(assetByUser._id.toString())
    expect(ids).toContain(assetEmployee._id.toString())
    expect(ids).not.toContain(assetOnlyManager._id.toString())
  })
})

describe('Batch update viewers', () => {
  it('should update allowedUsers for multiple assets', async () => {
    const newUser = await User.create({
      username: 'view',
      password: 'pwd',
      email: 'view@example.com',
      roleId: (await Role.findOne({ name: 'employee' }))._id
    })

    await request(app)
      .put('/api/assets/viewers')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [assetId.toString(), assetEmployee._id.toString()], allowedUsers: [newUser._id.toString()] })
      .expect(200)

    const a1 = await Asset.findById(assetId)
    const a2 = await Asset.findById(assetEmployee._id)
    expect(a1.allowedUsers.map(id => id.toString())).toEqual([newUser._id.toString()])
    expect(a2.allowedUsers.map(id => id.toString())).toEqual([newUser._id.toString()])
  })
})
