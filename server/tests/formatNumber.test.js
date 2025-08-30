import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const file = readFileSync(path.resolve(__dirname, '../../client/src/views/AdData.vue'), 'utf8')
const fnMatch = /const formatNumber = val => {[\s\S]*?}/.exec(file)
if (!fnMatch) throw new Error('formatNumber not found')
const formatNumber = eval('(' + fnMatch[0].replace('const formatNumber =', '') + ')')

describe('formatNumber', () => {
  test('整數顯示為整數', () => {
    expect(formatNumber(10)).toBe('10')
  })

  test('小數保留兩位', () => {
    expect(formatNumber(10.456)).toBe('10.46')
  })
})
