import { afterEach, describe, expect, it, vi } from 'vitest'

const loadApi = async (env: Record<string, string>, host: string) => {
  vi.resetModules()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  vi.stubGlobal('location', { ...window.location, hostname: host })
  const { api } = await import('./config')
  return api()
}

const base = {
  VITE_API_URL_PROD: 'https://api.metromedicslab.com',
  VITE_API_URL_DEV: 'http://127.0.0.1:5050',
  VITE_API_URL_CLOUDFLARE: 'https://v1-mmcs.betancur.work'
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('api()', () => {
  it('en producción (dominio real) usa la API de producción', async () => {
    expect(
      await loadApi({ ...base, VITE_ENV: 'production' }, 'app.metromedicslab.com')
    ).toBe('https://api.metromedicslab.com')
  })

  it('en desarrollo usa la API local con el host de la página', async () => {
    expect(
      await loadApi({ ...base, VITE_ENV: 'development' }, 'localhost')
    ).toBe('http://localhost:5050')
  })

  it('en localhost con VITE_ENV de producción NO llama a producción', async () => {
    expect(
      await loadApi({ ...base, VITE_ENV: 'production' }, 'localhost')
    ).toBe('http://localhost:5050')
  })

  it('en una IP privada con VITE_ENV mal cargado usa la API local de ese host', async () => {
    expect(await loadApi({ ...base, VITE_ENV: '' }, '192.168.1.20')).toBe(
      'http://192.168.1.20:5050'
    )
  })

  it('VITE_ALLOW_PROD_API=true permite apuntar a producción a propósito', async () => {
    expect(
      await loadApi(
        { ...base, VITE_ENV: 'production', VITE_ALLOW_PROD_API: 'true' },
        'localhost'
      )
    ).toBe('https://api.metromedicslab.com')
  })
})
