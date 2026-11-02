import { nextRetryMs, shouldGiveUp } from './sessionGuardRetry'

describe('shouldGiveUp', () => {
  it('deja de insistir tras ocho cierres seguidos sin abrir', () => {
    expect(shouldGiveUp(7)).toBe(false)
    expect(shouldGiveUp(8)).toBe(true)
  })
})

describe('nextRetryMs', () => {
  it('empieza en 5 s y se duplica hasta 60 s', () => {
    expect([0, 1, 2, 3, 4, 5].map(nextRetryMs)).toEqual([
      5_000, 5_000, 10_000, 20_000, 40_000, 60_000
    ])
  })

  it('tras seis fallos seguidos reintenta cada 5 minutos', () => {
    expect(nextRetryMs(6)).toBe(300_000)
    expect(nextRetryMs(40)).toBe(300_000)
  })
})
