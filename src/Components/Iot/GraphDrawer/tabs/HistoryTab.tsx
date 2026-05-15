// components/DeviceGraphs/GraphDrawer/tabs/HistoryTab.tsx

import { RANGE_OPTIONS } from 'src/Components/Iot/constants'
import { RangeSelector } from '../parts/RangeSelector'
import { StatsTable } from '../parts/StatsTable'

import { RangeOption } from '../types'
import { Skeleton, TextField, Typography } from '@mui/material'
import MainChart from 'src/Components/Iot/GraphDrawer/parts/MainChart'
import { useState } from 'react'
import { DatePicker } from '@mui/x-date-pickers'

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
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleCustomDateSelect = (date: Date | null) => {
    if (!date) return;
    
    // Calcular rango de 24 horas (de 00:00 a 23:59)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    onSelectRange({
      label: 'Personalizado',
      isCustom: true,
      startDate,
      endDate
    });
    
    setDatePickerOpen(false);
  };

  return (
    <>
      <RangeSelector
        selectedRange={selectedRange}
        onSelect={(range) => {
          if (range.isCustom) {
            setDatePickerOpen(true);
          } else {
            onSelectRange(range);
          }
        }}
        options={RANGE_OPTIONS}
      />

{datePickerOpen && (
        <DatePicker
          open
          value={null}
          onChange={handleCustomDateSelect}
          onClose={() => setDatePickerOpen(false)}
          slotProps={{
            textField: (params) => <TextField {...params} fullWidth />
          }}
          sx={{ mt: 2, mb: 2 }}
        />
      )}

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
