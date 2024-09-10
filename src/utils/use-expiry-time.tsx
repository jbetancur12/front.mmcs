import Cookies from 'js-cookie'
import { useEffect } from 'react'
import { Toast } from 'src/Components/ExcelManipulation/Utils'

// Definimos el tipo de las propiedades del hook
interface UseSessionTimeoutWarningProps {
  expirationTimeInMinutes: number
}

// Función para obtener el tiempo de expiración del token

const useSessionTimeoutWarning = ({
  expirationTimeInMinutes
}: UseSessionTimeoutWarningProps) => {
  useEffect(() => {
    // Obtén el tiempo restante de la sesión
    // const token = localStorage.getItem('accessToken');

    const expirationTime = Number(Cookies.get('expiresIn'))

    const timeLeft = expirationTime - Date.now()

    if (timeLeft <= 0) return

    // Configura el tiempo para mostrar la advertencia
    const warningTime = Math.max(
      timeLeft - expirationTimeInMinutes * 60 * 1000,
      0
    )
    const timeoutId = setTimeout(() => {
      Toast.fire(
        'Tu sesión se cerrará en 1 minuto. Por favor, guarda tu trabajo.',
        '',
        'warning'
      )
    }, warningTime)

    // Limpiar timeout cuando el componente se desmonte o cuando el tiempo expire
    return () => clearTimeout(timeoutId)
  }, [expirationTimeInMinutes])
}

export default useSessionTimeoutWarning
