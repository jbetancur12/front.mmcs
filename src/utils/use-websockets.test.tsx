import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GIVE_UP_FAILURES } from 'src/utils/sessionGuardRetry'
import { WebSocketProvider } from './use-websockets'

vi.mock('src/utils/syncUserAccess', () => ({ syncUserAccess: vi.fn() }))

class FakeSocket {
  static instances: FakeSocket[] = []
  static OPEN = 1
  readyState = 0
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: ((error: unknown) => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  constructor(public url: string) {
    FakeSocket.instances.push(this)
  }
  close() {
    this.onclose?.()
  }
}

// Token con `exp` lejano: el cuerpo es lo único que lee isTokenExpired
const token = `x.${btoa(JSON.stringify({ exp: 4_000_000_000, sid: 's' }))}.y`

describe('WebSocketProvider: reintentos', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeSocket.instances = []
    vi.stubGlobal('WebSocket', FakeSocket)
    vi.stubEnv('VITE_ENV', 'production')
    vi.stubEnv('VITE_WS_URL', 'wss://ejemplo.test')
    localStorage.setItem('accessToken', token)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    localStorage.clear()
  })

  it('deja de insistir cuando el servidor rechaza el socket una y otra vez', async () => {
    render(
      <WebSocketProvider>
        <span />
      </WebSocketProvider>
    )

    // Cada intento se cierra sin llegar a abrir (404 o 403 del servidor)
    for (let i = 0; i < GIVE_UP_FAILURES + 5; i += 1) {
      act(() => FakeSocket.instances[FakeSocket.instances.length - 1]?.close())
      await vi.advanceTimersByTimeAsync(600_000)
    }

    expect(FakeSocket.instances).toHaveLength(GIVE_UP_FAILURES)
  })

  it('un socket que abrió se reconecta y reinicia la cuenta de fallos', async () => {
    render(
      <WebSocketProvider>
        <span />
      </WebSocketProvider>
    )

    for (let i = 0; i < GIVE_UP_FAILURES + 3; i += 1) {
      const socket = FakeSocket.instances[FakeSocket.instances.length - 1]
      act(() => socket.onopen?.())
      act(() => socket.close())
      await vi.advanceTimersByTimeAsync(600_000)
    }

    expect(FakeSocket.instances).toHaveLength(GIVE_UP_FAILURES + 4)
  })
})
