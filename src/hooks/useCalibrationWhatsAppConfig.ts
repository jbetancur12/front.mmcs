import { useQuery, useMutation, useQueryClient } from 'react-query'
import { axiosPrivate } from '@utils/api'

export interface WhatsAppConfig {
  id: number
  notificationType: string
  phoneNumbers: string[]
  description: string | null
  createdAt: string
  updatedAt: string
}

const QUERY_KEY = 'calibration-whatsapp-configs'

const fetchConfigs = async (): Promise<WhatsAppConfig[]> => {
  const { data } = await axiosPrivate.get<WhatsAppConfig[]>('/calibration-services/whatsapp-configs')
  return data
}

const updateConfig = async ({ type, phoneNumbers }: { type: string; phoneNumbers: string[] }): Promise<WhatsAppConfig> => {
  const { data } = await axiosPrivate.put<WhatsAppConfig>(`/calibration-services/whatsapp-configs/${type}`, { phoneNumbers })
  return data
}

export const WHATSAPP_CONFIG_OPTIONS = [
  { type: 'ods_issued', label: 'ODS emitida', description: 'Notificar cuando se emite una orden de servicio' },
  { type: 'cut_ready_for_invoicing', label: 'Corte listo para facturar', description: 'Notificar cuando un corte está listo para facturar' },
  { type: 'cut_invoiced', label: 'Corte facturado', description: 'Notificar cuando un corte es facturado' },
  { type: 'adjustment_reported', label: 'Novedad reportada', description: 'Notificar cuando se reporta una novedad de ejecución' },
  { type: 'adjustment_approved', label: 'Novedad aprobada', description: 'Notificar cuando una novedad es aprobada técnicamente (compras)' },
]

export const useCalibrationWhatsAppConfigs = () => {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchConfigs,
    staleTime: 30 * 1000,
  })
}

export const useCalibrationWhatsAppConfigMutation = () => {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEY])
    }
  })

  return {
    updateConfig: updateMutation,
  }
}
