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

export const api = () => {
  if (import.meta.env.VITE_ENV === 'development') {
    const hostname = window.location.hostname

    if (isPrivateNetworkHost(hostname)) {
      if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        return import.meta.env.VITE_API_URL_DEV || 'http://localhost:5050'
      }

      return `http://${hostname}:5050`
    }

    return import.meta.env.VITE_API_URL_CLOUDFLARE
  }

  return import.meta.env.VITE_API_URL_PROD
}
