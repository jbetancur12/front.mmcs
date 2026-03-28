const isPrivateNetworkHost = (hostname: string) => {
  if (
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1') ||
    hostname === '::1'
  ) {
    return true
  }

  if (hostname.startsWith('192.168.')) return true
  if (hostname.startsWith('10.')) return true

  const match172 = hostname.match(/^172\.(\d{1,3})\./)
  if (match172) {
    const secondOctet = Number(match172[1])
    return secondOctet >= 16 && secondOctet <= 31
  }

  return false
}

const isLocalDevelopmentHost = (hostname: string) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '::1' ||
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
      ? normalizeLocalApiUrl(
          import.meta.env.VITE_API_URL_DEV || 'http://localhost:5050'
        )
      : import.meta.env.VITE_API_URL_CLOUDFLARE
  }

  return import.meta.env.VITE_API_URL_PROD
}
