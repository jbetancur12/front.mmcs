import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.hoisted(() => vi.fn())

vi.mock('@utils/use-axios-private', () => ({
  default: () => ({ get })
}))

import { useReusableCodes } from './useDataSheets'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
)

describe('useReusableCodes', () => {
  beforeEach(() => {
    get.mockReset()
    get.mockResolvedValue({ data: [{ internalCode: 'MMCS-0001' }] })
  })

  it('no llama al API mientras esté deshabilitado (diálogo cerrado o sin permiso para crear)', async () => {
    renderHook(() => useReusableCodes(undefined, { enabled: false }), {
      wrapper
    })

    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(get).not.toHaveBeenCalled()
  })

  it('pide los códigos liberados cuando está habilitado', async () => {
    const { result } = renderHook(
      () => useReusableCodes(undefined, { enabled: true }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.data).toHaveLength(1))
    expect(get).toHaveBeenCalledWith('/dataSheet/codes/reusable', {
      params: undefined
    })
  })
})
