import Cookies from 'js-cookie'
import { useEffect } from 'react'
import { Toast } from 'src/Components/ExcelManipulation/Utils'

interface UseSessionTimeoutWarningProps {
  warningMsBefore?: number
}

const useSessionTimeoutWarning = ({
  warningMsBefore = 30_000
}: UseSessionTimeoutWarningProps) => {
  useEffect(() => {
    const expirationTime = Number(Cookies.get('expiresIn'))

    if (!expirationTime || !localStorage.getItem('accessToken')) {
      sessionStorage.removeItem('session-expiry-warning-for')
      return
    }

    const timeLeft = expirationTime - Date.now()

    if (timeLeft <= 0) return

    const warningTime = Math.max(timeLeft - warningMsBefore, 0)
    const warningKey = expirationTime.toString()
    const timeoutId = setTimeout(() => {
      if (sessionStorage.getItem('session-expiry-warning-for') === warningKey) {
        return
      }

      const secondsLeft = Math.max(
        Math.ceil((expirationTime - Date.now()) / 1000),
        1
      )

      sessionStorage.setItem('session-expiry-warning-for', warningKey)
      Toast.fire(
        `Tu sesión expirará en aproximadamente ${secondsLeft} segundos. Guarda tu trabajo o renueva la sesión.`,
        '',
        'warning'
      )
    }, warningTime)

    return () => clearTimeout(timeoutId)
  }, [warningMsBefore])
}

export default useSessionTimeoutWarning
