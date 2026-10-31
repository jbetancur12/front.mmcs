import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { frequentPaths, recentPaths, recordVisit } from './quickSearchUsage'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 31)

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

const visit = (user: string, path: string, times: number, at = NOW) => {
  for (let i = 0; i < times; i++) recordVisit(user, path, at)
}

describe('frequentPaths', () => {
  it('sin visitas no hay sugerencias', () => {
    expect(frequentPaths('u1', 5)).toEqual([])
  })

  it('una sola visita no hace "más usada" a una pantalla', () => {
    visit('u1', '/a', 1)
    expect(frequentPaths('u1', 5, [], NOW)).toEqual([])
  })

  it('ordena de la más a la menos visitada', () => {
    visit('u1', '/poco', 2)
    visit('u1', '/mucho', 5)
    visit('u1', '/medio', 3)
    expect(frequentPaths('u1', 5, [], NOW)).toEqual(['/mucho', '/medio', '/poco'])
  })

  it('respeta el límite y las exclusiones', () => {
    visit('u1', '/a', 5)
    visit('u1', '/b', 4)
    visit('u1', '/c', 3)
    expect(frequentPaths('u1', 2, [], NOW)).toEqual(['/a', '/b'])
    expect(frequentPaths('u1', 5, ['/a'], NOW)).toEqual(['/b', '/c'])
  })

  it('el uso reciente pesa más: cada 14 días una visita vale la mitad', () => {
    visit('u1', '/vieja', 4, NOW - 60 * DAY)
    visit('u1', '/nueva', 2, NOW)
    expect(frequentPaths('u1', 5, [], NOW)).toEqual(['/nueva', '/vieja'])
  })
})

describe('recentPaths', () => {
  it('de la más nueva a la más vieja, incluso con una sola visita', () => {
    recordVisit('u1', '/primera', NOW - 3000)
    recordVisit('u1', '/segunda', NOW - 2000)
    recordVisit('u1', '/tercera', NOW - 1000)
    expect(recentPaths('u1', 5)).toEqual(['/tercera', '/segunda', '/primera'])
  })

  it('volver a una pantalla la sube al primer lugar', () => {
    recordVisit('u1', '/a', NOW - 3000)
    recordVisit('u1', '/b', NOW - 2000)
    recordVisit('u1', '/a', NOW - 1000)
    expect(recentPaths('u1', 5)).toEqual(['/a', '/b'])
  })

  it('respeta el límite y las exclusiones', () => {
    recordVisit('u1', '/a', NOW - 3000)
    recordVisit('u1', '/b', NOW - 2000)
    recordVisit('u1', '/c', NOW - 1000)
    expect(recentPaths('u1', 2)).toEqual(['/c', '/b'])
    expect(recentPaths('u1', 5, ['/c'])).toEqual(['/b', '/a'])
  })
})

describe('almacenamiento', () => {
  it('cada usuario tiene su propio historial', () => {
    visit('ana', '/a', 3)
    visit('luis', '/b', 3)
    expect(frequentPaths('ana', 5, [], NOW)).toEqual(['/a'])
    expect(frequentPaths('luis', 5, [], NOW)).toEqual(['/b'])
  })

  it('conserva como máximo 60 pantallas', () => {
    for (let i = 0; i < 65; i++) recordVisit('u1', `/p${i}`, NOW + i)
    const saved = JSON.parse(localStorage.getItem('quick-search-usage:u1') ?? '{}')
    expect(Object.keys(saved)).toHaveLength(60)
  })

  it('datos corruptos en el navegador se ignoran sin fallar', () => {
    localStorage.setItem('quick-search-usage:u1', '{no es json')
    expect(frequentPaths('u1', 5, [], NOW)).toEqual([])
    expect(recentPaths('u1', 5)).toEqual([])
    expect(() => recordVisit('u1', '/a', NOW)).not.toThrow()
  })

  it('si no hay almacenamiento, no falla y no hay sugerencias', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('sin espacio')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(() => recordVisit('u1', '/a', NOW)).not.toThrow()
    expect(frequentPaths('u1', 5, [], NOW)).toEqual([])
    expect(recentPaths('u1', 5)).toEqual([])
  })
})
