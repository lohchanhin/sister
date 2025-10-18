import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import path from 'node:path'
import fs from 'node:fs/promises'
import dotenv from 'dotenv'
import { PERMISSIONS } from '../src/config/permissions.js'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let limitedToken
let clientId
let ideaId
let uploadFileMock
let getSignedUrlMock
let Role
let User
let Client
let ScriptIdea

beforeAll(async () => {
  jest.unstable_mockModule('../src/utils/gcs.js', () => ({
    uploadFile: jest.fn().mockImplementation((_filePath, destination) => Promise.resolve(destination)),
    getSignedUrl: jest.fn().mockImplementation((filePath) => `https://signed.example.com/${filePath}`)
  }))

  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  const [
    { default: scriptIdeaRoutes },
    { default: authRoutes },
    { default: clientRoutes }
  ] = await Promise.all([
    import('../src/routes/scriptIdea.routes.js'),
    import('../src/routes/auth.routes.js'),
    import('../src/routes/client.routes.js')
  ])

  ;[{ default: User }, { default: Role }, { default: Client }, { default: ScriptIdea }] = await Promise.all([
    import('../src/models/user.model.js'),
    import('../src/models/role.model.js'),
    import('../src/models/client.model.js'),
    import('../src/models/scriptIdea.model.js')
  ])

  const gcs = await import('../src/utils/gcs.js')
  uploadFileMock = gcs.uploadFile
  getSignedUrlMock = gcs.getSignedUrl

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/clients', clientRoutes)
  app.use('/api/clients/:clientId/script-ideas', scriptIdeaRoutes)

  const managerRole = await Role.create({
    name: 'script-manager',
    menus: ['script-ideas'],
    permissions: [PERMISSIONS.SCRIPT_IDEA_READ, PERMISSIONS.SCRIPT_IDEA_MANAGE]
  })
  await User.create({ username: 'admin', password: 'pwd', email: 'admin@test.com', roleId: managerRole._id })

  const viewerRole = await Role.create({ name: 'script-viewer', menus: ['script-ideas'], permissions: [] })
  await User.create({ username: 'viewer', password: 'pwd', email: 'viewer@test.com', roleId: viewerRole._id })

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'pwd' })
    .expect(200)

  token = loginRes.body.token
  const viewerLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'viewer', password: 'pwd' })
    .expect(200)

  limitedToken = viewerLoginRes.body.token
  const client = await Client.create({ name: '腳本客戶' })
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

describe('Script Ideas API', () => {
  it('缺少腳本權限時應回傳 403', async () => {
    await request(app)
      .get(`/api/clients/${clientId}/script-ideas`)
      .set('Authorization', `Bearer ${limitedToken}`)
      .expect(403)
  })

  it('建立腳本記錄', async () => {
    const res = await request(app)
      .post(`/api/clients/${clientId}/script-ideas`)
      .set('Authorization', `Bearer ${token}`)
      .field('date', '2024-02-01T00:00:00.000Z')
      .field('location', '台北')
      .field('scriptCount', '2')
      .field(
        'scripts',
        JSON.stringify([
          { title: '腳本 A', paragraphs: ['第一段', '第二段'] }
        ])
      )
      .field('status', 'pending')
      .expect(201)

    expect(res.body.location).toBe('台北')
    expect(res.body.scriptCount).toBe(2)
    expect(Array.isArray(res.body.scripts)).toBe(true)
    expect(res.body.scripts).toHaveLength(2)
    expect(res.body.scripts[0]).toMatchObject({ title: '腳本 A' })
    expect(res.body.scripts[0].paragraphs).toEqual(['第一段', '第二段'])
    expect(res.body.scripts[1]).toMatchObject({ title: '', paragraphs: [] })
    ideaId = res.body._id
  })

  it('列出腳本記錄並使用快取', async () => {
    const first = await request(app)
      .get(`/api/clients/${clientId}/script-ideas`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(first.body).toHaveLength(1)
    expect(first.body[0].location).toBe('台北')

    const second = await request(app)
      .get(`/api/clients/${clientId}/script-ideas`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(second.body).toHaveLength(1)
  })

  it('更新腳本詳情並上傳影片', async () => {
    const videoDir = path.join(process.cwd(), 'server', 'tests', 'tmp')
    const videoPath = path.join(videoDir, 'idea.mp4')
    await fs.mkdir(videoDir, { recursive: true })
    await fs.writeFile(videoPath, 'video')

    const res = await request(app)
      .put(`/api/clients/${clientId}/script-ideas/${ideaId}`)
      .set('Authorization', `Bearer ${token}`)
      .field('summaryScript', '更新後腳本')
      .field('headline', '更新後標題')
      .field(
        'scripts',
        JSON.stringify([
          { title: '腳本 A', paragraphs: ['第一段更新', '第二段更新'] },
          { title: '腳本 B', paragraphs: ['B 段落'] }
        ])
      )
      .attach('video', videoPath)
      .expect(200)

    await fs.unlink(videoPath)

    expect(uploadFileMock).toHaveBeenCalled()
    expect(res.body.summaryScript).toBe('更新後腳本')
    expect(res.body.videoName).toBe('idea.mp4')
    expect(res.body.scripts).toHaveLength(2)
    expect(res.body.scripts[0].paragraphs).toEqual(['第一段更新', '第二段更新'])
  })

  it('取得腳本詳情時附帶簽署網址', async () => {
    const res = await request(app)
      .get(`/api/clients/${clientId}/script-ideas/${ideaId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(getSignedUrlMock).toHaveBeenCalled()
    expect(res.body.videoUrl).toContain('https://signed.example.com/')
    expect(res.body.scripts).toHaveLength(2)
  })

  it('移除影片並刪除腳本記錄', async () => {
    await request(app)
      .put(`/api/clients/${clientId}/script-ideas/${ideaId}`)
      .set('Authorization', `Bearer ${token}`)
      .field('removeVideo', 'true')
      .expect(200)

    const detail = await request(app)
      .get(`/api/clients/${clientId}/script-ideas/${ideaId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(detail.body.videoUrl).toBe('')

    await request(app)
      .delete(`/api/clients/${clientId}/script-ideas/${ideaId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const afterDelete = await request(app)
      .get(`/api/clients/${clientId}/script-ideas`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(afterDelete.body).toHaveLength(0)
  })
})
