import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearModuleTableStates,
  createTableStateHandlers,
  generateTableId,
  getActiveFiltersCount,
  getAllTableStates,
  getDefaultTableState,
  getFilterSummary,
  getModuleTableConfig,
  hasActiveFilters
} from './tableStateUtils'

vi.mock('src/utils/logger', () => ({
  logger: { warn: vi.fn(), log: vi.fn(), error: vi.fn(), info: vi.fn() }
}))

beforeEach(() => {
  localStorage.clear()
})

describe('getModuleTableConfig', () => {
  it('devuelve la configuración de cada módulo', () => {
    expect(getModuleTableConfig('fleet').defaultPageSize).toBe(15)
    expect(getModuleTableConfig('lms').defaultPageSize).toBe(20)
    expect(getModuleTableConfig('iot').defaultPageSize).toBe(25)
  })

  it('un módulo desconocido usa la configuración de compras', () => {
    expect(getModuleTableConfig('no-existe')).toEqual(
      getModuleTableConfig('purchases')
    )
  })
})

describe('generateTableId', () => {
  it('une módulo y tabla con un guion', () => {
    expect(generateTableId('fleet', 'vehicles')).toBe('fleet-vehicles')
  })
})

describe('clearModuleTableStates', () => {
  it('borra solo los estados guardados de ese módulo', () => {
    localStorage.setItem('table-state-fleet-vehicles', '{}')
    localStorage.setItem('table-state-fleet-trips', '{}')
    localStorage.setItem('table-state-lms-courses', '{}')
    localStorage.setItem('table-state-fleetx-otra', '{}')
    localStorage.setItem('accessToken', 'x')

    clearModuleTableStates('fleet')

    expect(localStorage.getItem('table-state-fleet-vehicles')).toBeNull()
    expect(localStorage.getItem('table-state-fleet-trips')).toBeNull()
    expect(localStorage.getItem('table-state-lms-courses')).not.toBeNull()
    expect(localStorage.getItem('table-state-fleetx-otra')).not.toBeNull()
    expect(localStorage.getItem('accessToken')).toBe('x')
  })
})

describe('getAllTableStates', () => {
  it('devuelve los estados válidos y salta los dañados', () => {
    localStorage.setItem('table-state-a', JSON.stringify({ sorting: [] }))
    localStorage.setItem('table-state-b', '{no es json')
    localStorage.setItem('otra-cosa', '{}')
    expect(getAllTableStates()).toEqual({ 'table-state-a': { sorting: [] } })
  })
})

describe('filtros activos', () => {
  const limpio = {
    columnFilters: [],
    sorting: [],
    pagination: { pageIndex: 0, pageSize: 10 }
  }

  it('una tabla sin tocar no tiene filtros activos', () => {
    expect(hasActiveFilters(limpio)).toBe(false)
    expect(getActiveFiltersCount(limpio)).toBe(0)
    expect(getFilterSummary(limpio)).toEqual([])
  })

  it('un estado vacío tampoco', () => {
    expect(hasActiveFilters({})).toBe(false)
    expect(getActiveFiltersCount({})).toBe(0)
  })

  it('cuenta cada filtro de columna, el orden (como 1) y la página distinta de la primera', () => {
    const estado = {
      columnFilters: [
        { id: 'nombre', value: 'ana' },
        { id: 'estado', value: ['a', 'b'] }
      ],
      sorting: [
        { id: 'fecha', desc: true },
        { id: 'nombre', desc: false }
      ],
      pagination: { pageIndex: 2, pageSize: 10 }
    }
    expect(hasActiveFilters(estado)).toBe(true)
    expect(getActiveFiltersCount(estado)).toBe(4) // 2 filtros + 1 orden + 1 página
  })

  it('estar en otra página cuenta como filtro activo', () => {
    expect(hasActiveFilters({ ...limpio, pagination: { pageIndex: 1 } })).toBe(
      true
    )
  })

  it('el resumen describe filtros, orden y página', () => {
    const resumen = getFilterSummary({
      columnFilters: [
        { id: 'nombre', value: 'ana' },
        { id: 'estado', value: ['a', 'b'] },
        { id: 'vacio', value: '' }
      ],
      sorting: [{ id: 'fecha', desc: true }],
      pagination: { pageIndex: 2 }
    })
    expect(resumen).toEqual([
      'nombre: ana',
      'estado: a, b',
      'Ordenado por: fecha (desc)',
      'Página: 3'
    ])
  })
})

describe('getDefaultTableState', () => {
  it('arranca limpio y con el tamaño de página del módulo', () => {
    expect(getDefaultTableState(getModuleTableConfig('lms'))).toEqual({
      columnFilters: [],
      sorting: [],
      pagination: { pageIndex: 0, pageSize: 20 },
      columnVisibility: {},
      density: 'comfortable'
    })
  })
})

describe('createTableStateHandlers', () => {
  const base = {
    columnFilters: [],
    sorting: [],
    pagination: { pageIndex: 0, pageSize: 10 },
    onColumnFiltersChange: vi.fn(),
    onSortingChange: vi.fn(),
    onPaginationChange: vi.fn()
  }

  it('incluye solo lo esencial si no hay visibilidad ni densidad', () => {
    const handlers = createTableStateHandlers(base)
    expect(Object.keys(handlers.state)).toEqual([
      'columnFilters',
      'sorting',
      'pagination'
    ])
    expect(handlers).not.toHaveProperty('onColumnVisibilityChange')
    expect(handlers).not.toHaveProperty('onDensityChange')
  })

  it('añade visibilidad y densidad cuando existen', () => {
    const onColumnVisibilityChange = vi.fn()
    const onDensityChange = vi.fn()
    const handlers = createTableStateHandlers({
      ...base,
      columnVisibility: { nombre: false },
      density: 'compact',
      onColumnVisibilityChange,
      onDensityChange
    })
    expect(handlers.state).toMatchObject({
      columnVisibility: { nombre: false },
      density: 'compact'
    })
    expect(handlers.onColumnVisibilityChange).toBe(onColumnVisibilityChange)
    expect(handlers.onDensityChange).toBe(onDensityChange)
  })
})
