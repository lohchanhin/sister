import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import WorkDiary from './WorkDiary.vue'
import { useAuthStore } from '@/stores/auth'

const toastMock = { add: vi.fn() }
vi.mock('primevue/usetoast', () => ({ useToast: () => toastMock }))

const workDiaryServiceMock = vi.hoisted(() => ({
  listWorkDiaries: vi.fn(),
  getWorkDiary: vi.fn(),
  updateWorkDiary: vi.fn(),
  uploadWorkDiaryImages: vi.fn(),
  removeWorkDiaryImage: vi.fn()
}))

vi.mock('@/services/workDiary', () => workDiaryServiceMock)

const {
  listWorkDiaries: listWorkDiariesMock,
  getWorkDiary: getWorkDiaryMock,
  updateWorkDiary: updateWorkDiaryMock
} = workDiaryServiceMock

const formatInputDate = (value) => {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date?.getTime?.())) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const CalendarStub = defineComponent({
  name: 'CalendarStub',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        class: 'calendar-stub',
        value: formatInputDate(props.modelValue),
        onInput: (event) => emit('update:modelValue', new Date(event.target.value))
      })
  }
})

const DropdownStub = defineComponent({
  name: 'DropdownStub',
  props: ['modelValue', 'options', 'disabled'],
  emits: ['update:modelValue', 'change'],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        'select',
        {
          class: ['dropdown-stub', attrs.class].filter(Boolean).join(' '),
          value: props.modelValue ?? '',
          disabled: props.disabled,
          onChange: (event) => {
            const value = event.target.value || null
            emit('update:modelValue', value)
            emit('change', value)
          }
        },
        (props.options || []).map((option) =>
          h('option', { value: option.value }, option.label)
        )
      )
  }
})

const ButtonStub = defineComponent({
  name: 'ButtonStub',
  props: ['label', 'icon', 'loading', 'disabled'],
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

const TextareaStub = defineComponent({
  name: 'TextareaStub',
  props: ['modelValue', 'readonly'],
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('textarea', {
        class: ['textarea-stub', attrs.class].filter(Boolean).join(' '),
        value: props.modelValue ?? '',
        readOnly: props.readonly ?? attrs.readonly ?? false,
        onInput: (event) => emit('update:modelValue', event.target.value)
      })
  }
})

const InputTextStub = defineComponent({
  name: 'InputTextStub',
  props: ['modelValue', 'disabled'],
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        class: ['input-stub', attrs.class].filter(Boolean).join(' '),
        value: props.modelValue ?? '',
        disabled: props.disabled ?? attrs.disabled ?? false,
        onInput: (event) => emit('update:modelValue', event.target.value)
      })
  }
})

const TagStub = defineComponent({
  name: 'TagStub',
  props: ['value', 'severity'],
  setup(props) {
    return () =>
      h(
        'span',
        { class: ['tag-stub', props.severity ? `tag-${props.severity}` : ''] },
        props.value
      )
  }
})

const CardStub = defineComponent({
  name: 'CardStub',
  setup(_, { slots }) {
    return () =>
      h('section', { class: 'card-stub' }, [
        slots.title?.(),
        slots.content?.(),
        slots.default?.()
      ])
  }
})

const FileUploadStub = defineComponent({
  name: 'FileUploadStub',
  emits: ['select'],
  setup(_, { slots }) {
    return () => h('div', { class: 'file-upload-stub' }, slots.default?.())
  }
})

const DividerStub = defineComponent({
  name: 'DividerStub',
  setup() {
    return () => h('hr', { class: 'divider-stub' })
  }
})

const SkeletonStub = defineComponent({
  name: 'SkeletonStub',
  setup() {
    return () => h('div', { class: 'skeleton-stub' })
  }
})

const globalStubs = {
  Card: CardStub,
  Calendar: CalendarStub,
  Dropdown: DropdownStub,
  Button: ButtonStub,
  Textarea: TextareaStub,
  InputText: InputTextStub,
  Tag: TagStub,
  FileUpload: FileUploadStub,
  Divider: DividerStub,
  Skeleton: SkeletonStub
}

const createTestRouter = async (initialPath = '/work-diaries') => {
  const { createRouter, createMemoryHistory } = await import('vue-router')
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/work-diaries/:date?/:userId?',
        name: 'WorkDiaries',
        component: { template: '<div />' }
      }
    ]
  })
  await router.push(initialPath)
  await router.isReady()
  return router
}

const mountWorkDiary = async ({ user, path = '/work-diaries' }) => {
  listWorkDiariesMock.mockResolvedValueOnce([
    {
      id: 'd1',
      title: '日誌 A',
      status: 'submitted',
      author: { _id: 'emp1', name: '一般員工' }
    }
  ])

  const detail = {
    id: 'd1',
    title: '日誌 A',
    content: '今日完成任務。',
    status: 'submitted',
    supervisorComment: '請再補充銷售結果',
    images: []
  }

  getWorkDiaryMock.mockResolvedValueOnce(detail)
  updateWorkDiaryMock.mockImplementation((id, payload) =>
    Promise.resolve({ ...detail, id, ...payload })
  )

  const router = await createTestRouter(path)
  const pinia = createPinia()
  setActivePinia(pinia)
  const authStore = useAuthStore()
  authStore.$patch(user)

  const wrapper = mount(WorkDiary, {
    global: {
      plugins: [pinia, router],
      stubs: globalStubs
    }
  })

  await flushPromises()
  await flushPromises()

  return { wrapper, router }
}

describe('WorkDiary.vue', () => {
  beforeEach(() => {
    toastMock.add.mockClear()
    listWorkDiariesMock.mockReset()
    getWorkDiaryMock.mockReset()
    updateWorkDiaryMock.mockReset()
  })

  afterAll(() => {
    vi.resetModules()
  })

  it('一般員工僅可編輯自身內容且不可調整狀態', async () => {
    const user = {
      token: 'token',
      user: {
        _id: 'emp1',
        name: '一般員工',
        permissions: [],
        menus: ['work-diaries']
      }
    }

    const { wrapper } = await mountWorkDiary({ user })

    expect(listWorkDiariesMock).toHaveBeenCalled()
    expect(getWorkDiaryMock).toHaveBeenCalledWith('d1')

    const statusDropdown = wrapper.find('select.status-dropdown')
    expect(statusDropdown.exists()).toBe(false)

    const statusTag = wrapper.find('.status-control .tag-stub')
    expect(statusTag.exists()).toBe(true)
    expect(statusTag.text()).toContain('待審核')

    const supervisorTextarea = wrapper.find('.supervisor-comment textarea')
    expect(supervisorTextarea.exists()).toBe(true)
    expect(supervisorTextarea.element.readOnly).toBe(true)

    const saveButton = wrapper.find('button.save-button')
    expect(saveButton.exists()).toBe(true)
    expect(saveButton.element.disabled).toBe(false)
  })

  it('主管可調整狀態並寫入留言', async () => {
    const user = {
      token: 'token',
      user: {
        _id: 'leader',
        name: '主管',
        permissions: ['work-diary:review'],
        menus: ['work-diaries']
      }
    }

    const { wrapper } = await mountWorkDiary({ user, path: '/work-diaries/2024-05-01' })

    await flushPromises()

    const statusDropdown = wrapper.find('select.status-dropdown')
    expect(statusDropdown.exists()).toBe(true)
    expect(statusDropdown.element.disabled).toBe(false)

    await statusDropdown.setValue('approved')

    const supervisorTextarea = wrapper.find('.supervisor-comment textarea')
    expect(supervisorTextarea.element.readOnly).toBe(false)
    await supervisorTextarea.setValue('辛苦了，保持品質。')

    const saveButton = wrapper.find('button.save-button')
    await saveButton.trigger('click')
    await flushPromises()

    expect(updateWorkDiaryMock).toHaveBeenCalledWith('d1', {
      title: '日誌 A',
      content: '今日完成任務。',
      status: 'approved',
      supervisorComment: '辛苦了，保持品質。'
    })
  })
})
