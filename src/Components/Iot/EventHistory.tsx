import { useState } from 'react'
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridRenderCellParams
} from '@mui/x-data-grid'
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Modal
} from '@mui/material'
import { format } from 'date-fns'
import { ExpandMore } from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import useEvents, { Event } from '@utils/useEvents'

interface EventosProps {
  deviceId: string
}

interface HiddenLinesState {
  temperature: boolean
  humidity: boolean
}

const EventHistory = ({ deviceId }: EventosProps) => {
  const { events, loading, error } = useEvents(deviceId as string | number)
  const [selectedRow, setSelectedRow] = useState<Event | null>(null)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  })
  const [hiddenLines, setHiddenLines] = useState<HiddenLinesState>({
    temperature: false,
    humidity: false
  })

  const handleLegendClick = (dataKey: keyof HiddenLinesState) => {
    setHiddenLines((prev) => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }))
  }

  const getSafeRawData = (rawData: any[] | null) => {
    if (!rawData || !Array.isArray(rawData)) return []

    const processedData = rawData
      .map((item) => {
        // Validación completa de cada ítem
        const timestamp = new Date(item?.timestamp)
        return {
          timestamp: isNaN(timestamp.getTime())
            ? new Date()
            : new Date(item.timestamp).getTime(),
          temperature: Number(item?.temperature) || 0,
          humidity: Number(item?.humidity) || 0
        }
      })
      .filter((item) => item !== null)

    return processedData
  }

  const columns: GridColDef[] = [
    {
      field: 'createdAt',
      headerName: 'Fecha/Hora',
      width: 180,
      valueFormatter: (params: Date) => {
        const date = new Date(params)
        return isNaN(date.getTime())
          ? 'Fecha inválida'
          : format(date, 'dd/MM/yyyy HH:mm:ss')
      }
    },
    {
      field: 'triggeredBy',
      headerName: 'Tipo',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={
            params.value === 'TEMPERATURE'
              ? 'error'
              : params.value === 'HUMIDITY'
                ? 'warning'
                : 'info'
          }
        />
      )
    },
    {
      field: 'temperature',
      headerName: 'Temperatura (°C)',
      width: 150,
      valueFormatter: (params: number) => `${params}°C`
    },
    {
      field: 'humidity',
      headerName: 'Humedad (%)',
      width: 150
    },
    {
      field: 'details',
      headerName: 'Detalles',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton onClick={() => setSelectedRow(params.row)}>
          <ExpandMore />
        </IconButton>
      )
    }
  ]

  const renderChartModal = () => (
    <Modal
      open={!!selectedRow}
      onClose={() => setSelectedRow(null)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)'
      }}
    >
      <Paper
        sx={{
          p: 4,
          width: '90%',
          maxWidth: 800,
          borderRadius: 2,
          boxShadow: 24
        }}
      >
        {selectedRow && (
          <>
            <Typography variant='h6' gutterBottom>
              Datos históricos -{' '}
              {format(new Date(selectedRow.createdAt), 'dd/MM/yyyy HH:mm')}
            </Typography>

            {getSafeRawData(selectedRow.rawData).length > 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  height: 400
                }}
              >
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={getSafeRawData(selectedRow.rawData)}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                      dataKey='timestamp'
                      tickFormatter={(ts) => format(new Date(ts), 'HH:mm:ss')}
                      type='number'
                      domain={['auto', 'auto']}
                      scale='time'
                      padding={{ left: 20, right: 20 }}
                    />
                    <YAxis yAxisId='temp' domain={['auto', 'auto']} />
                    <YAxis
                      yAxisId='hum'
                      orientation='right'
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      labelFormatter={(ts) => format(new Date(ts), 'HH:mm:ss')}
                    />
                    <Legend
                      onClick={(e) => {
                        const dataKey = e.dataKey as keyof HiddenLinesState
                        if (['temperature', 'humidity'].includes(dataKey)) {
                          handleLegendClick(dataKey)
                        }
                      }}
                      wrapperStyle={{
                        paddingTop: '20px',
                        cursor: 'pointer'
                      }}
                      formatter={(value, entry) => {
                        const dataKey = entry.dataKey as
                          | keyof HiddenLinesState
                          | undefined
                        const isHidden = dataKey ? hiddenLines[dataKey] : false
                        return (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            <div
                              style={{
                                width: 12,
                                height: 12,
                                backgroundColor: isHidden
                                  ? '#ddd'
                                  : entry.color,
                                transition: 'all 0.3s'
                              }}
                            />
                            <span
                              style={{
                                color: isHidden ? '#999' : 'inherit',
                                textDecoration: isHidden
                                  ? 'line-through'
                                  : 'none'
                              }}
                            >
                              {value}
                            </span>
                          </Box>
                        )
                      }}
                    />
                    <Line
                      yAxisId='temp'
                      dataKey='temperature'
                      stroke='#ff7300'
                      name='Temperatura (°C)'
                      strokeOpacity={hiddenLines.temperature ? 0 : 1}
                      hide={hiddenLines.temperature}
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      yAxisId='hum'
                      type='monotone'
                      dataKey='humidity'
                      stroke='#82ca9d'
                      name='Humedad (%)'
                      strokeOpacity={hiddenLines.humidity ? 0 : 1}
                      hide={hiddenLines.humidity}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box
                sx={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant='body1' color='text.secondary'>
                  No hay datos históricos disponibles para este evento
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Modal>
  )

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant='h6' gutterBottom>
        Historial de Eventos
      </Typography>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity='error'>Error al cargar eventos</Alert>
        ) : (
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={events}
              columns={columns}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              slots={{
                toolbar: GridToolbar,
                noRowsOverlay: () => (
                  <Typography
                    variant='body1'
                    color='text.secondary'
                    sx={{ p: 2 }}
                  >
                    No hay eventos registrados
                  </Typography>
                )
              }}
            />
            {renderChartModal()}
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default EventHistory
