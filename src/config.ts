const isPrivateNetworkHost = (hostname: string) =>
  /^10\./.test(hostname) ||
  /^192\.168\./.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)

const isLocalDevelopmentHost = (hostname: string) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  isPrivateNetworkHost(hostname)

const normalizeLocalApiUrl = (baseUrl: string) => {
  try {
    const currentHost = window.location.hostname
    const parsedUrl = new URL(baseUrl)

    if (!isLocalDevelopmentHost(currentHost)) {
      return baseUrl
    }

    parsedUrl.hostname = currentHost
    return parsedUrl.toString().replace(/\/$/, '')
  } catch {
    return baseUrl
  }
}

export const api = () => {
  if (import.meta.env.VITE_ENV === 'development') {
    return isLocalDevelopmentHost(window.location.hostname)
      ? normalizeLocalApiUrl(import.meta.env.VITE_API_URL_DEV)
      : import.meta.env.VITE_API_URL_CLOUDFLARE
  } else {
    return import.meta.env.VITE_API_URL_PROD
  }
}
