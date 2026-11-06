import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { parseIdentification } from 'src/utils/identification'

/** Cliente que ya usa la identificación que se está escribiendo. */
export interface CustomerIdentificationMatch {
  id: number
  nombre: string
  identificacion: string
}

interface IdentificationCheckResponse {
  exists: boolean
  customer: CustomerIdentificationMatch | null
}

/** Debajo de 4 dígitos cualquier coincidencia sería ruido. */
const MIN_DIGITS_TO_CHECK = 4
const DEBOUNCE_MS = 400

/**
 * Consulta si la identificación ya está registrada en otro cliente. La
 * comparación la hace el servidor ignorando puntos, espacios y guiones, y
 * admite el documento con o sin dígito de verificación.
 */
export const useCustomerIdentificationCheck = (
  value: string,
  excludeCustomerId?: number | null
) => {
  const axiosPrivate = useAxiosPrivate()
  const base = parseIdentification(value).base
  const [debouncedBase, setDebouncedBase] = useState('')

  useEffect(() => {
    if (base.length < MIN_DIGITS_TO_CHECK) {
      setDebouncedBase('')
      return
    }

    const timer = window.setTimeout(() => setDebouncedBase(base), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [base])

  const enabled = debouncedBase.length >= MIN_DIGITS_TO_CHECK
  const { data, isFetching } = useQuery<IdentificationCheckResponse>(
    ['customer-identification-check', debouncedBase, excludeCustomerId ?? null],
    async () => {
      const response = await axiosPrivate.get<IdentificationCheckResponse>(
        '/customers/identification-check',
        {
          params: {
            identificacion: debouncedBase,
            excludeId: excludeCustomerId || undefined
          }
        }
      )
      return response.data
    },
    {
      enabled,
      retry: false,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false
    }
  )

  // Solo vale la respuesta de la base que se está mostrando: mientras se
  // escribe, la consulta anterior puede llegar tarde.
  const isCurrent = debouncedBase === base
  const match = isCurrent && data?.exists ? data.customer : null

  return {
    match,
    duplicate: Boolean(match),
    isChecking: enabled && isFetching
  }
}
