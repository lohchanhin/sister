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

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() })
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

  it('物件多陣列欄位轉換並渲染', async () => {
    const sample = {
      date: ['2024-01-01', '2024-01-02'],
      clicks: [5, 10]
    }

    const { fetchDaily } = await import('@/services/adDaily')
    const { getPlatform } = await import('@/services/platforms')
    const { fetchWeeklyNotes } = await import('@/services/weeklyNotes')

    fetchDaily.mockResolvedValue(sample)
    getPlatform.mockResolvedValue({ fields: [] })
    fetchWeeklyNotes.mockResolvedValue([])

    const wrapper = shallowMount(AdData, {
      global: {
        stubs: {
          DataTable: {
            props: ['value'],
            template: '<div><div v-for="item in value" class="row">{{ item.date }} {{ item.clicks }}</div></div>'
          }
        }
      }
    })

    await flushPromises()

    expect(wrapper.vm.adData).toEqual([
      { date: '2024-01-01', clicks: 5 },
      { date: '2024-01-02', clicks: 10 }
    ])

    const rows = wrapper.findAll('.row')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('2024-01-01')
    expect(rows[0].text()).toContain('5')
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

  it('編輯時轉換舊鍵並移除非法鍵', async () => {
    const oldId = '123456789012345678901234'
    const row = {
      _id: 'r1',
      date: '2024-01-01',
      extraData: { [oldId]: 1, f_click: 2, bad: 3 },
      colors: { [oldId]: '#fff', f_click: '#000', bad: '#111' }
    }

    const { fetchDaily, updateDaily } = await import('@/services/adDaily')
    const { getPlatform } = await import('@/services/platforms')
    const { fetchWeeklyNotes } = await import('@/services/weeklyNotes')

    fetchDaily.mockResolvedValue({ records: [] })
    updateDaily.mockResolvedValue({})
    getPlatform.mockResolvedValue({ fields: [
      { id: 'f_click', name: '點擊', slug: 'clicks', type: 'number' }
    ] })
    fetchWeeklyNotes.mockResolvedValue([])

    const wrapper = shallowMount(AdData, {
      global: {
        stubs: {
          DataTable: { template: '<div />' }
        }
      }
    })

    await flushPromises()

    wrapper.vm.fieldAliases = { [oldId]: 'f_click' }
    wrapper.vm.loadDaily = vi.fn()

    wrapper.vm.openEdit(row)
    expect(wrapper.vm.recordForm.extraData).toEqual({ f_click: 2 })

    await wrapper.vm.handleConfirm()

    expect(updateDaily).toHaveBeenCalledTimes(1)
    const payload = updateDaily.mock.calls[0][3]
    expect(payload.extraData).toEqual({ f_click: 2 })
    expect(payload.extraData).not.toHaveProperty(oldId)
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
