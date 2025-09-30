import { vi } from 'vitest'

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: vi.fn(),
    close: vi.fn()
  })
}))
