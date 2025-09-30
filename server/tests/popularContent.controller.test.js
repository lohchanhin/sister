import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import path from 'node:path'
import fs from 'node:fs/promises'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let clientId
let uploadFileMock
let getSignedUrlMock
let Role
let User
let Client

beforeAll(async () => {
  jest.unstable_mockModule('../src/utils/gcs.js', () => ({
    uploadFile: jest.fn().mockResolvedValue('popular-content/cover.png'),
    getSignedUrl: jest.fn().mockImplementation((p) => `https://signed.example.com/${p}`)
  }))

  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  const [{ default: popularRoutes }, { default: authRoutes }, { default: clientRoutes }] = await Promise.all([
    import('../src/routes/popularContent.routes.js'),
    import('../src/routes/auth.routes.js'),
    import('../src/routes/client.routes.js')
  ])

  const gcs = await import('../src/utils/gcs.js')
  uploadFileMock = gcs.uploadFile
  getSignedUrlMock = gcs.getSignedUrl

  ;[{ default: User }, { default: Role }, { default: Client }] = await Promise.all([
    import('../src/models/user.model.js'),
    import('../src/models/role.model.js'),
    import('../src/models/client.model.js')
  ])

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/clients', clientRoutes)
  app.use('/api/clients/:clientId/popular-contents', popularRoutes)

  const role = await Role.create({ name: 'manager', menus: ['popular-data'] })
  await User.create({ username: 'admin', password: 'pwd', email: 'admin@test.com', roleId: role._id })

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'pwd' })

  token = loginRes.body.token
  const client = await Client.create({ name: '測試客戶' })
  clientId = client._id.toString()
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

beforeEach(() => {
  uploadFileMock.mockClear()
  getSignedUrlMock.mockClear()
})

describe('Popular Content API', () => {
  let contentId

  it('建立爆款內容並預設截至日期', async () => {
    const res = await request(app)
      .post(`/api/clients/${clientId}/popular-contents`)
      .set('Authorization', `Bearer ${token}`)
      .send({ platformKey: 'xhs', title: '影片一', publishDate: '2024-01-01T00:00:00.000Z' })
      .expect(201)

    contentId = res.body._id
    expect(res.body.title).toBe('影片一')
    const publish = new Date('2024-01-01T00:00:00.000Z')
    const due = new Date(res.body.dueDate)
    expect(Math.round((due - publish) / (1000 * 60 * 60 * 24))).toBe(7)
  })

  it('上傳封面並回傳簽名網址', async () => {
    const coverPath = path.join(process.cwd(), 'server', 'tests', 'fixtures', 'cover.png')
    await fs.mkdir(path.dirname(coverPath), { recursive: true })
    await fs.writeFile(coverPath, 'cover')

    const res = await request(app)
      .post(`/api/clients/${clientId}/popular-contents/${contentId}/cover`)
      .set('Authorization', `Bearer ${token}`)
      .attach('cover', coverPath)
      .expect(200)

    await fs.unlink(coverPath)

    expect(uploadFileMock).toHaveBeenCalled()
    expect(getSignedUrlMock).toHaveBeenCalled()
    expect(res.body.coverUrl).toContain('https://signed.example.com/')
  })

  it('更新指標資料', async () => {
    const res = await request(app)
      .put(`/api/clients/${clientId}/popular-contents/${contentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ exposure: 5200, viewCount: 1200 })
      .expect(200)

    expect(res.body.exposure).toBe(5200)
    expect(res.body.viewCount).toBe(1200)
  })

  it('列出爆款內容', async () => {
    const res = await request(app)
      .get(`/api/clients/${clientId}/popular-contents?platformKey=xhs`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body.length).toBe(1)
    expect(res.body[0].coverUrl).toContain('https://signed.example.com/')
  })

  it('刪除爆款內容', async () => {
    await request(app)
      .delete(`/api/clients/${clientId}/popular-contents/${contentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const res = await request(app)
      .get(`/api/clients/${clientId}/popular-contents`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(res.body).toHaveLength(0)
  })

  it('拒絕未授權客戶的請求', async () => {
    const otherClient = await Client.create({ name: '其他客戶' })
    const role = await Role.create({ name: 'staff' })
    await User.create({
      username: 'limited',
      password: 'pwd',
      email: 'limit@test.com',
      roleId: role._id,
      allowedClients: [otherClient._id]
    })

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'limited', password: 'pwd' })

    const limitedToken = login.body.token

    await request(app)
      .get(`/api/clients/${clientId}/popular-contents`)
      .set('Authorization', `Bearer ${limitedToken}`)
      .expect(403)
  })
})
