import '@testing-library/jest-dom/vitest'

// jsdom no implementa el canvas: devuelve un contexto 2D que no hace nada
// para que SignaturePad y similares monten sin llenar el log de errores.
const noopContext = new Proxy(
  { canvas: null },
  { get: (target, prop) => (prop in target ? target[prop as keyof typeof target] : () => undefined) }
)
HTMLCanvasElement.prototype.getContext = (() =>
  noopContext) as unknown as HTMLCanvasElement['getContext']
