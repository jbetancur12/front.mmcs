import { useMutation, useQuery, useQueryClient } from 'react-query'
import { axiosPrivate } from '@utils/api'
import {
  CalibrationService,
  CalibrationServiceFilters,
  CalibrationServiceListResponse,
  CalibrationServicePayload
} from '../types/calibrationService'

export const CALIBRATION_SERVICE_QUERY_KEYS = {
  all: 'calibration-services',
  detail: 'calibration-service-detail'
} as const

const calibrationServiceApi = {
  getServices: async (
    filters?: CalibrationServiceFilters
  ): Promise<CalibrationServiceListResponse> => {
    const response = await axiosPrivate.get<CalibrationServiceListResponse>(
      '/calibration-services',
      {
        params: filters
      }
    )
    return response.data
  },

  getServiceById: async (serviceId: string): Promise<CalibrationService> => {
    const response = await axiosPrivate.get<CalibrationService>(
      `/calibration-services/${serviceId}`
    )
    return response.data
  },

  createService: async (
    payload: CalibrationServicePayload
  ): Promise<CalibrationService> => {
    const response = await axiosPrivate.post<CalibrationService>(
      '/calibration-services',
      payload
    )
    return response.data
  },

  updateService: async ({
    serviceId,
    payload
  }: {
    serviceId: string
    payload: CalibrationServicePayload
  }): Promise<CalibrationService> => {
    const response = await axiosPrivate.put<CalibrationService>(
      `/calibration-services/${serviceId}`,
      payload
    )
    return response.data
  }
}

export const useCalibrationServices = (filters?: CalibrationServiceFilters) => {
  return useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.all, filters],
    queryFn: () => calibrationServiceApi.getServices(filters),
    staleTime: 60 * 1000,
    retry: 1
  })
}

export const useCalibrationService = (serviceId?: string) => {
  return useQuery({
    queryKey: [CALIBRATION_SERVICE_QUERY_KEYS.detail, serviceId],
    queryFn: () => calibrationServiceApi.getServiceById(serviceId as string),
    enabled: Boolean(serviceId),
    staleTime: 60 * 1000,
    retry: 1
  })
}

export const useCalibrationServiceMutations = () => {
  const queryClient = useQueryClient()

  const createService = useMutation(calibrationServiceApi.createService, {
    onSuccess: () => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
    }
  })

  const updateService = useMutation(calibrationServiceApi.updateService, {
    onSuccess: (service) => {
      queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
      queryClient.invalidateQueries([
        CALIBRATION_SERVICE_QUERY_KEYS.detail,
        String(service.id)
      ])
    }
  })

  return {
    createService,
    updateService
  }
}
