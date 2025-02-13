import Cookies from 'js-cookie'
import { useEffect } from 'react'
import { Toast } from 'src/Components/ExcelManipulation/Utils'

interface UseSessionTimeoutWarningProps {
  warningMinutesBefore: number
}

const useSessionTimeoutWarning = ({
  warningMinutesBefore
}: UseSessionTimeoutWarningProps) => {
  useEffect(() => {
    const calculateNextSundayMidnight = () => {
      const now = new Date()
      const nextSunday = new Date(now)

      // Avanzar al próximo domingo
      nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7))
      nextSunday.setHours(0, 0, 0, 0)

      // Si ya pasó el domingo de esta semana, sumar 7 días
      if (nextSunday <= now) {
        nextSunday.setDate(nextSunday.getDate() + 7)
      }

      return nextSunday.getTime()
    }

    // Obtener el tiempo de expiración del cookie o calcularlo
    const expirationTime =
      Number(Cookies.get('expiresIn')) || calculateNextSundayMidnight()
    const timeLeft = expirationTime - Date.now()

    if (timeLeft <= 0) return

    // Calcular el momento para mostrar la advertencia
    const warningTime = Math.max(timeLeft - warningMinutesBefore * 60 * 1000, 0)

    const timeoutId = setTimeout(() => {
      Toast.fire(
        `Tu sesión se cerrará en ${warningMinutesBefore} minutos. Por favor, guarda tu trabajo.`,
        '',
        'warning'
      )
    }, warningTime)

    return () => clearTimeout(timeoutId)
  }, [warningMinutesBefore])
}

export default useSessionTimeoutWarning
