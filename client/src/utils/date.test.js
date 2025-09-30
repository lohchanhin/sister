import { describe, it, expect } from 'vitest'
import { formatDateOnly } from './date'

describe('formatDateOnly', () => {
  it('可以將 Date 物件格式化為 yyyy-MM-dd', () => {
    const result = formatDateOnly(new Date('2024-05-15T15:30:00Z'))
    expect(result).toBe('2024-05-15')
  })

  it('可以處理字串輸入', () => {
    const result = formatDateOnly('2024-01-01T00:00:00+08:00')
    expect(result).toBe('2024-01-01')
  })

  it('遇到無效日期時回傳空字串', () => {
    expect(formatDateOnly('invalid')).toBe('')
    expect(formatDateOnly(null)).toBe('')
  })
})
