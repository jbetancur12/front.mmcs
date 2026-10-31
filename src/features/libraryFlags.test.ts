describe('libraryEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  const load = async () => (await import('./libraryFlags')).libraryEnabled

  it('está apagado si la variable no existe o no es "true"', async () => {
    vi.stubEnv('VITE_LIBRARY_ENABLED', '')
    expect(await load()).toBe(false)
    vi.resetModules()
    vi.stubEnv('VITE_LIBRARY_ENABLED', 'false')
    expect(await load()).toBe(false)
  })

  it('se enciende con VITE_LIBRARY_ENABLED=true (sin importar mayúsculas ni espacios)', async () => {
    vi.stubEnv('VITE_LIBRARY_ENABLED', ' TRUE ')
    expect(await load()).toBe(true)
  })

  it('con el flag apagado la ruta /library no existe', async () => {
    vi.stubEnv('VITE_LIBRARY_ENABLED', 'false')
    const { default: LibraryRoutes } = await import('src/routes/LibraryRoutes')
    expect(LibraryRoutes(['admin'])).toBeNull()
  })

  it('con el flag encendido la ruta /library se registra', async () => {
    vi.stubEnv('VITE_LIBRARY_ENABLED', 'true')
    const { default: LibraryRoutes } = await import('src/routes/LibraryRoutes')
    expect(LibraryRoutes(['admin'])).not.toBeNull()
  })
})
