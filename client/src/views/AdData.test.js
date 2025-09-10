import { shallowMount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import AdData from './AdData.vue'

vi.mock('@/services/adDaily', () => ({
  fetchDaily: vi.fn(),
  createDaily: vi.fn(),
  bulkCreateDaily: vi.fn(),
  updateDaily: vi.fn(),
  deleteDaily: vi.fn()
}))

vi.mock('@/services/weeklyNotes', () => ({
  fetchWeeklyNote: vi.fn(),
  fetchWeeklyNotes: vi.fn(),
  createWeeklyNote: vi.fn(),
  updateWeeklyNote: vi.fn(),
  getWeeklyNoteImageUrl: vi.fn()
}))

vi.mock('@/services/platforms', () => ({
  getPlatform: vi.fn()
}))

describe('AdData.vue', () => {
  it('渲染每日資料', async () => {
    const sample = [
      { date: '2024-01-01', extraData: { clicks: 10 } },
      { date: '2024-01-02', extraData: { clicks: 20 } }
    ]

    const { fetchDaily } = await import('@/services/adDaily')
    const { getPlatform } = await import('@/services/platforms')
    const { fetchWeeklyNotes } = await import('@/services/weeklyNotes')

    fetchDaily.mockResolvedValue({ records: sample })
    getPlatform.mockResolvedValue({ fields: [] })
    fetchWeeklyNotes.mockResolvedValue([])

    const wrapper = shallowMount(AdData, {
      global: {
        stubs: {
          DataTable: {
            props: ['value'],
            template: '<div><div v-for="item in value" class="row">{{ item.date }} {{ item.extraData.clicks }}</div></div>'
          }
        }
      }
    })

    await flushPromises()

    const rows = wrapper.findAll('.row')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('2024-01-01')
    expect(rows[0].text()).toContain('10')
  })
})
