import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

const fetchDashboardSummaryMock = vi.fn()
const fetchProductStagesMock = vi.fn(() => Promise.resolve([]))
const updateProductStageMock = vi.fn(() => Promise.resolve({}))
const updateProductMock = vi.fn(() => Promise.resolve({}))

vi.mock('../services/dashboard', () => ({
  fetchDashboardSummary: fetchDashboardSummaryMock
}));

vi.mock('../services/products', () => ({
  fetchProductStages: fetchProductStagesMock,
  updateProductStage: updateProductStageMock,
  updateProduct: updateProductMock
}));

const ButtonStub = defineComponent({
  name: 'Button',
  props: ['label', 'icon', 'iconPos', 'disabled'],
  emits: ['click'],
  setup(props, { emit, slots, attrs }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          class: ['button-stub', attrs.class].filter(Boolean).join(' '),
          disabled: props.disabled ?? attrs.disabled ?? false,
          onClick: (event) => {
            if (props.disabled ?? attrs.disabled) return
            emit('click', event)
            attrs.onClick?.(event)
          }
        },
        slots.default?.() || props.label || props.icon || 'button'
      )
  }
})

const CardStub = defineComponent({
  name: 'Card',
  setup(_, { slots }) {
    return () =>
      h('section', { class: 'card-stub' }, [slots.title?.(), slots.content?.(), slots.default?.()])
  }
})

const DataTableStub = defineComponent({
  name: 'DataTable',
  props: ['value', 'paginator', 'rows', 'totalRecords', 'first', 'rowsPerPageOptions'],
  emits: ['page'],
  setup(props, { slots, emit }) {
    return () =>
      h('div', { class: 'datatable-stub' }, [
        h(
          'button',
          {
            class: 'datatable-page-trigger',
            onClick: () => emit('page', { page: 1, rows: props.rows || 20 })
          },
          'page'
        ),
        slots.default?.()
      ])
  }
})

const ColumnStub = defineComponent({
  name: 'Column',
  setup(_, { slots }) {
    return () => h('div', { class: 'column-stub' }, slots.default?.())
  }
})

const TagStub = defineComponent({
  name: 'Tag',
  props: ['value', 'severity'],
  setup(props) {
    return () => h('span', { class: `tag-stub ${props.severity || ''}` }, props.value)
  }
})

const DialogStub = defineComponent({
  name: 'Dialog',
  props: ['visible'],
  emits: ['update:visible'],
  setup(props, { slots }) {
    return () => (props.visible ? h('div', { class: 'dialog-stub' }, [slots.default?.(), slots.footer?.()]) : null)
  }
})

const CheckboxStub = defineComponent({
  name: 'Checkbox',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        type: 'checkbox',
        class: ['checkbox-stub', attrs.class].filter(Boolean).join(' '),
        checked: props.modelValue,
        onChange: (event) => emit('update:modelValue', event.target.checked)
      })
  }
})

const ProgressBarStub = defineComponent({
  name: 'ProgressBar',
  props: ['value'],
  setup(props) {
    return () => h('div', { class: 'progressbar-stub' }, `${props.value ?? 0}`)
  }
})

const InputTextStub = defineComponent({
  name: 'InputText',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        value: props.modelValue ?? '',
        onInput: (event) => emit('update:modelValue', event.target.value)
      })
  }
})

const DropdownStub = defineComponent({
  name: 'Dropdown',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('select', {
        value: props.modelValue ?? '',
        onChange: (event) => emit('update:modelValue', event.target.value)
      })
  }
})

const DatePickerStub = defineComponent({
  name: 'DatePicker',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        type: 'date',
        value: props.modelValue ?? '',
        onInput: (event) => emit('update:modelValue', event.target.value)
      })
  }
})

const globalStubs = {
  Button: ButtonStub,
  Card: CardStub,
  DataTable: DataTableStub,
  Column: ColumnStub,
  Tag: TagStub,
  Dialog: DialogStub,
  Checkbox: CheckboxStub,
  ProgressBar: ProgressBarStub,
  InputText: InputTextStub,
  Dropdown: DropdownStub,
  DatePicker: DatePickerStub
}

const mountDashboard = async () => {
  const Dashboard = (await import('./Dashboard.vue')).default
  const wrapper = mount(Dashboard, {
    global: {
      stubs: globalStubs,
      directives: {
        tooltip: () => {}
      }
    }
  })
  await flushPromises()
  return wrapper
}

describe('Dashboard 分頁摘要', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    fetchDashboardSummaryMock.mockReset()
    fetchDashboardSummaryMock.mockResolvedValue({
      recentAssets: [],
      recentReviews: [],
      recentProducts: {
        items: [
          { _id: 'p1', fileName: 'A.mp4', progress: { done: 0, total: 1 } }
        ],
        total: 25,
        page: 1,
        pageSize: 20
      },
      assetStats: {}
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('初始化時載入分頁資料', async () => {
    const wrapper = await mountDashboard()
    await flushPromises()

    expect(fetchDashboardSummaryMock).toHaveBeenCalledWith({ page: 1, pageSize: 20 })

    const dataTable = wrapper.findComponent(DataTableStub)
    expect(dataTable.props('value')).toHaveLength(1)
    expect(dataTable.props('totalRecords')).toBe(25)

    wrapper.unmount()
  })

  it('切換分頁時重新載入資料', async () => {
    fetchDashboardSummaryMock.mockImplementationOnce(() =>
      Promise.resolve({
        recentAssets: [],
        recentReviews: [],
        recentProducts: {
          items: Array.from({ length: 20 }, (_, index) => ({
            _id: `p${index + 1}`,
            fileName: `P${index + 1}`,
            progress: { done: 0, total: 1 }
          })),
          total: 30,
          page: 1,
          pageSize: 20
        },
        assetStats: {}
      })
    )
    fetchDashboardSummaryMock.mockImplementationOnce(() =>
      Promise.resolve({
        recentAssets: [],
        recentReviews: [],
        recentProducts: {
          items: [{ _id: 'p21', fileName: 'P21', progress: { done: 1, total: 1 } }],
          total: 30,
          page: 2,
          pageSize: 20
        },
        assetStats: {}
      })
    )
    
    const wrapper = await mountDashboard()
    await flushPromises()

    const dataTable = wrapper.findComponent(DataTableStub)
    await dataTable.vm.$emit('page', { page: 1, rows: 20 })
    await flushPromises()

    expect(fetchDashboardSummaryMock).toHaveBeenLastCalledWith({ page: 2, pageSize: 20 })

    const updatedTable = wrapper.findComponent(DataTableStub)
    expect(updatedTable.props('value')[0]._id).toBe('p21')

    wrapper.unmount()
  })
})
