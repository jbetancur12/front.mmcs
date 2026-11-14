import { useMutation, useQuery, useQueryClient } from 'react-query'
import { useStore } from '@nanostores/react'
import { axiosPrivate } from 'src/utils/api'
import {
  type FeatureFlagKey,
  featureFlagsLoaded,
  featureFlagsStore,
  setFeatureFlags
} from 'src/store/featureFlagsStore'

const FLAGS_KEY = ['feature-flags']
const ADMIN_KEY = ['feature-flags', 'admin']

/**
 * Trae el estado de las funciones y lo deja en el store. Se monta una vez, en el Layout de la sesión.
 * Se refresca al volver a la ventana, así un cambio del panel llega sin recargar.
 */
export const useFeatureFlagsSync = (enabled = true) =>
  useQuery(
    FLAGS_KEY,
    async () => {
      const { data } = await axiosPrivate.get<{
        data: Record<string, boolean>
      }>('/feature-flags')
      return data.data
    },
    {
      enabled,
      staleTime: 60 * 1000,
      onSuccess: (flags) => setFeatureFlags(flags)
    }
  )

/** ¿La función está encendida? Úsalo para menús, rutas y bloques de pantalla. */
export const useFeature = (key: FeatureFlagKey): boolean =>
  useStore(featureFlagsStore)[key]

/** ¿Ya llegó el estado real del API? Antes se muestra el último conocido. */
export const useFeatureFlagsLoaded = (): boolean =>
  useStore(featureFlagsLoaded).loaded

export interface FeatureFlagAdminRow {
  key: FeatureFlagKey
  name: string
  description: string
  defaultEnabled: boolean
  enabled: boolean
  updatedBy: number | null
  updatedAt: string | null
}

export const useFeatureFlagsAdmin = () =>
  useQuery(
    ADMIN_KEY,
    async () => {
      const { data } = await axiosPrivate.get<{ data: FeatureFlagAdminRow[] }>(
        '/feature-flags/admin'
      )
      return data.data
    },
    { staleTime: 0 }
  )

export const useSetFeatureFlag = () => {
  const queryClient = useQueryClient()
  return useMutation(
    async ({ key, enabled }: { key: FeatureFlagKey; enabled: boolean }) => {
      const { data } = await axiosPrivate.put<{ data: FeatureFlagAdminRow }>(
        `/feature-flags/${key}`,
        { enabled }
      )
      return data.data
    },
    {
      onSuccess: (flag) => {
        // El cambio se ve de inmediato en esta pestaña; las demás lo reciben al refrescar su estado.
        setFeatureFlags({ [flag.key]: flag.enabled })
        queryClient.invalidateQueries(FLAGS_KEY)
      }
    }
  )
}
