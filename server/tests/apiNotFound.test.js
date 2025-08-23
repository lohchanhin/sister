import request from 'supertest'
import express from 'express'
import { notFound, errorHandler } from '../src/utils/handleError.js'
// 建立模擬的伺服器，只加入前端 fallback 與錯誤處理
const app = express()
// 模擬 server.js 的非 /api fallback
app.get(/^\/(?!api).*/, (_, res) => res.send('index'))
app.use(notFound)
app.use(errorHandler)

describe('GET /api/non-existent', () => {
  it('should return 404 for unknown API routes', async () => {
    await request(app).get('/api/non-existent').expect(404)
  })
})
