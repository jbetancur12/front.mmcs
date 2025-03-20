// components/DeviceGraphs/GraphDrawer/tabs/HistoryTab.tsx

import { RANGE_OPTIONS } from 'src/Components/Iot/constants'
import { RangeSelector } from '../parts/RangeSelector'
import { StatsTable } from '../parts/StatsTable'

import { RangeOption } from '../types'
import { Skeleton, Typography } from '@mui/material'
import MainChart from 'src/Components/Iot/MainChart'

interface HistoryTabProps {
  combinedData: any[]
  visibleSeries: any
  onToggleSeries: any
  temperatureAlarms: any
  humidityAlarms: any
  selectedRange: RangeOption
  onSelectRange: (range: RangeOption) => void
  aggregateStats: any
  isLoading: boolean
  error: any
}

export const HistoryTab = ({
  combinedData,
  visibleSeries,
  onToggleSeries,
  temperatureAlarms,
  humidityAlarms,
  selectedRange,
  onSelectRange,
  aggregateStats,
  isLoading,
  error
}: HistoryTabProps) => {
  return (
    <>
      <RangeSelector
        selectedRange={selectedRange}
        onSelect={onSelectRange}
        options={RANGE_OPTIONS}
      />

      {isLoading ? (
        <Skeleton variant='rectangular' width='100%' height={400} />
      ) : error ? (
        <Typography color='error'>Error al cargar datos históricos</Typography>
      ) : (
        <MainChart
          graphData={combinedData}
          visibleSeries={visibleSeries}
          onToggleSeries={onToggleSeries}
          temperatureAlarms={temperatureAlarms}
          humidityAlarms={humidityAlarms}
        />
      )}

      {aggregateStats && <StatsTable stats={aggregateStats} />}
    </>
  )
}
