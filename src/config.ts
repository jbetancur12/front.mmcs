export const api = () => {
  if (import.meta.env.VITE_ENV === 'development') {
    return window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1')
      ? import.meta.env.VITE_API_URL_DEV // Usar localhost si estás en casa
      : import.meta.env.VITE_API_URL_CLOUDFLARE // Usar Cloudflare si estás fuera
  } else {
    return import.meta.env.VITE_API_URL_PROD
  }
}
