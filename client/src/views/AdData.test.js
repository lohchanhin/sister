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
  it('載入後更新 adData', async () => {
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
          DataTable: { template: '<div />' }
        }
      }
    })

    await flushPromises()

    expect(wrapper.vm.adData).toEqual(sample)
  })
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

  it('自動推斷舊欄位別名後顯示資料', async () => {
    const sample = [
      { date: '2024-01-01', extraData: { 點擊: 5 } }
    ]

    const { fetchDaily } = await import('@/services/adDaily')
    const { getPlatform } = await import('@/services/platforms')
    const { fetchWeeklyNotes } = await import('@/services/weeklyNotes')

    fetchDaily.mockResolvedValue({ records: sample })
    getPlatform.mockResolvedValue({ fields: [
      { id: 'f_click', name: '點擊', order: 1 },
      { id: 'f_view', name: '曝光', order: 2 }
    ] })
    fetchWeeklyNotes.mockResolvedValue([])

    const wrapper = shallowMount(AdData, {
      global: {
        stubs: {
          DataTable: {
            props: ['value'],
            template: `<div><div v-for="row in value" class="row">{{$parent.valByField(row, $parent.customColumns[0])}}</div></div>`
          }
        }
      }
    })

    await flushPromises()

    expect(wrapper.vm.fieldAliases).toEqual({ 點擊: 'f_click' })
    const rows = wrapper.findAll('.row')
    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toBe('5')
  })

  it('後端回傳根層欄位時 valByField 可顯示資料', async () => {
    const sample = [
      { date: '2024-01-01', clicks: 15 }
    ]

    const { fetchDaily } = await import('@/services/adDaily')
    const { getPlatform } = await import('@/services/platforms')
    const { fetchWeeklyNotes } = await import('@/services/weeklyNotes')

    fetchDaily.mockResolvedValue({ records: sample })
    getPlatform.mockResolvedValue({ fields: [
      { id: 'clicks', name: '點擊' }
    ] })
    fetchWeeklyNotes.mockResolvedValue([])

    const wrapper = shallowMount(AdData, {
      global: {
        stubs: {
          DataTable: {
            props: ['value'],
            template: `<div><div v-for="row in value" class="row">{{$parent.valByField(row, $parent.customColumns[0])}}</div></div>`
          }
        }
      }
    })

    await flushPromises()

    const rows = wrapper.findAll('.row')
    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toBe('15')
  })

  it('傳入日期範圍時使用正確參數呼叫 fetchDaily', async () => {
    const { fetchDaily } = await import('@/services/adDaily')
    const { getPlatform } = await import('@/services/platforms')
    const { fetchWeeklyNotes } = await import('@/services/weeklyNotes')

    fetchDaily.mockResolvedValue({ records: [] })
    getPlatform.mockResolvedValue({ fields: [] })
    fetchWeeklyNotes.mockResolvedValue([])

    const wrapper = shallowMount(AdData, {
      global: {
        stubs: {
          DataTable: { template: '<div />' }
        }
      }
    })

    await flushPromises()

    fetchDaily.mockClear()

    wrapper.vm.startDate = '2024-01-01'
    wrapper.vm.endDate = '2024-01-31'
    await flushPromises()

    expect(fetchDaily).toHaveBeenCalledTimes(1)
    const params = fetchDaily.mock.calls[0][2]
    expect(params).toEqual({ start: '2024-01-01', end: '2024-01-31' })
  })
})
