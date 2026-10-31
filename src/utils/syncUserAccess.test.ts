import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROLES } from 'src/constants/roles'
import { userStore, type UserData } from '../store/userStore'

const { mockGet, mockInfo } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockInfo: vi.fn()
}))

vi.mock('./api', () => ({ axiosPrivate: { get: mockGet } }))
vi.mock('./notify', () => ({ notify: { info: mockInfo } }))

import { formatSessionUser, syncUserAccess } from './syncUserAccess'

const usuario = (data: Record<string, unknown>) =>
  data as unknown as UserData

beforeEach(() => {
  vi.clearAllMocks()
  userStore.set(
    usuario({ nombre: 'Ana', email: 'ana@example.com', rol: ['admin'], permissions: ['a', 'b'] })
  )
})

describe('formatSessionUser', () => {
  it('usa `rol` si ya es una lista de nombres', () => {
    expect(formatSessionUser({ rol: [ROLES.ADMIN, ROLES.USER] }).rol).toEqual([
      'admin',
      'user'
    ])
  })

  it('si vienen `roles` como objetos, toma sus nombres', () => {
    expect(
      formatSessionUser({ roles: [{ name: 'admin' }, { name: 'metrologist' }] })
        .rol
    ).toEqual(['admin', 'metrologist'])
  })

  it('acepta `roles` como lista de textos', () => {
    expect(formatSessionUser({ roles: [ROLES.ADMIN] }).rol).toEqual([
      ROLES.ADMIN
    ])
  })

  it('`rol` tiene prioridad sobre `roles`', () => {
    expect(
      formatSessionUser({ rol: ['admin'], roles: [{ name: 'otro' }] }).rol
    ).toEqual(['admin'])
  })

  it('sin roles devuelve una lista vacía', () => {
    expect(formatSessionUser({}).rol).toEqual([])
  })

  it('lmsOnly siempre es booleano y el resto de campos se conserva', () => {
    expect(formatSessionUser({}).lmsOnly).toBe(false)
    expect(formatSessionUser({ lmsOnly: 1 }).lmsOnly).toBe(true)
    expect(formatSessionUser({ nombre: 'Ana', userType: 'client' })).toMatchObject({
      nombre: 'Ana',
      userType: 'client'
    })
  })
})

describe('syncUserAccess', () => {
  it('guarda en el store lo que devuelve /auth/validateToken', async () => {
    mockGet.mockResolvedValue({
      data: { nombre: 'Ana', email: 'ana@example.com', rol: ['admin'], permissions: ['a', 'b'] }
    })
    await syncUserAccess()
    expect(userStore.get().rol).toEqual(['admin'])
    expect(mockGet.mock.calls[0][0]).toContain('/auth/validateToken')
  })

  it('avisa si los permisos cambiaron', async () => {
    mockGet.mockResolvedValue({
      data: { email: 'ana@example.com', rol: ['admin'], permissions: ['a', 'b', 'c'] }
    })
    await syncUserAccess()
    expect(mockInfo).toHaveBeenCalledWith('Tus permisos se actualizaron')
  })

  it('avisa si cambiaron los roles', async () => {
    mockGet.mockResolvedValue({
      data: { email: 'ana@example.com', rol: ['user'], permissions: ['a', 'b'] }
    })
    await syncUserAccess()
    expect(mockInfo).toHaveBeenCalledTimes(1)
  })

  it('no avisa si todo es igual, aunque el orden cambie', async () => {
    mockGet.mockResolvedValue({
      data: { email: 'ana@example.com', rol: ['admin'], permissions: ['b', 'a'] }
    })
    await syncUserAccess()
    expect(mockInfo).not.toHaveBeenCalled()
  })

  it('no avisa si todavía no había un usuario cargado (primer ingreso)', async () => {
    userStore.set(usuario({ nombre: '', email: '', rol: [''], permissions: [] }))
    mockGet.mockResolvedValue({
      data: { email: 'ana@example.com', rol: ['admin'], permissions: ['x'] }
    })
    await syncUserAccess()
    expect(mockInfo).not.toHaveBeenCalled()
    expect(userStore.get().email).toBe('ana@example.com')
  })

  it('si la petición falla, no lanza error ni cambia al usuario', async () => {
    mockGet.mockRejectedValue(new Error('sin red'))
    await expect(syncUserAccess()).resolves.toBeUndefined()
    expect(userStore.get().rol).toEqual(['admin'])
    expect(mockInfo).not.toHaveBeenCalled()
  })

  it('varias llamadas a la vez comparten una sola petición', async () => {
    mockGet.mockResolvedValue({
      data: { email: 'ana@example.com', rol: ['admin'], permissions: ['a', 'b'] }
    })
    await Promise.all([syncUserAccess(), syncUserAccess(), syncUserAccess()])
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('al terminar, una llamada nueva hace otra petición', async () => {
    mockGet.mockResolvedValue({
      data: { email: 'ana@example.com', rol: ['admin'], permissions: ['a', 'b'] }
    })
    await syncUserAccess()
    await syncUserAccess()
    expect(mockGet).toHaveBeenCalledTimes(2)
  })
})
