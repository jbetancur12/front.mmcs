export const api = () => {
  if (import.meta.env.VITE_ENV === 'development') {
    return import.meta.env.VITE_API_URL_DEV
  } else {
    return import.meta.env.VITE_API_URL_PROD
  }
}
