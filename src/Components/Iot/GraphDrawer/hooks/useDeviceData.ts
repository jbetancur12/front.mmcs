// components/DeviceGraphs/GraphDrawer/useDeviceData.ts
import { useQuery } from 'react-query'
import { useState, useMemo } from 'react'
import useAxiosPrivate from '@utils/use-axios-private'
import { RangeOption } from '../types'

export const useDeviceData = (
  deviceId: number | string | null,
  selectedRange: RangeOption
) => {
  const axiosPrivate = useAxiosPrivate()
  const [visibleSeries, setVisibleSeries] = useState({
    temperature: true,
    humidity: true
  })

  const { startDateStr, endDateStr } = useMemo(() => {
    const endDate = new Date()
    const startDate = new Date(
      endDate.getTime() - selectedRange.hours * 60 * 60 * 1000
    )
    return {
      startDateStr: startDate.toISOString(),
      endDateStr: endDate.toISOString()
    }
  }, [selectedRange])

  const {
    data: graphData,
    isLoading,
    error
  } = useQuery(
    ['deviceDataPoints', deviceId, startDateStr, endDateStr],
    async () => {
      if (!deviceId) return []
      const response = await axiosPrivate.get(
        `/devicesIot/dataPoints?startDate=${startDateStr}&endDate=${endDateStr}&deviceIotId=${deviceId}`
      )
      return response.data
    },
    {
      enabled: !!deviceId,
      keepPreviousData: true,
      staleTime: 60_000
    }
  )

  const combinedData = useMemo(
    () =>
      graphData?.map((dp: any) => ({
        timestamp: new Date(dp.timestamp).getTime(),
        temperature: dp.avg_temperature,
        humidity: dp.avg_humidity
      })) || [],
    [graphData]
  )

  return {
    visibleSeries,
    setVisibleSeries,
    combinedData,
    graphData,
    isLoading,
    error,
    startDateStr,
    endDateStr
  }
}
