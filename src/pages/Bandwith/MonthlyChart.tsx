import React, { useEffect, useState } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private' // Asumiendo ruta correcta

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid // Añadido para mejor visualización
} from 'recharts'

// Tipo (sin cambios)
type MonthlyData = {
  month: string // Ej: "2024-04" o "Abril"
  incomingMB: string // Asume string numérico
  outgoingMB: string // Asume string numérico
}

// Helper para convertir string MB a número para el gráfico
const parseMB = (mbString: string): number => {
  const value = parseFloat(mbString)
  return isNaN(value) ? 0 : value
}

const MonthlyChart: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState<boolean>(true) // Estado de carga añadido
  const [error, setError] = useState<string | null>(null) // Estado de error añadido

  useEffect(() => {
    setLoading(true)
    setError(null) // Limpiar error anterior
    let isMounted = true

    axiosPrivate
      .get<MonthlyData[]>('/bandwidth-logs/monthly')
      .then((res) => {
        if (isMounted) {
          // Procesar los datos para asegurarse que son números para el gráfico
          const processedData = res.data.map((item) => ({
            ...item,
            incomingMB_num: parseMB(item.incomingMB),
            outgoingMB_num: parseMB(item.outgoingMB)
          }))
          setMonthlyData(processedData as any) // 'as any' es un pequeño hack, idealmente ajustarías el tipo MonthlyData
        }
      })
      .catch((err) => {
        console.error('Error fetching monthly bandwidth data:', err)
        if (isMounted) {
          const errorMsg = 'No se pudo cargar el gráfico de uso mensual.'
          setError(errorMsg)
          // Alerta opcional con SweetAlert, podría ser redundante si muestras el error en la UI
          // Swal.fire({ icon: 'error', title: 'Error', text: errorMsg });
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [axiosPrivate]) // axiosPrivate como dependencia

  return (
    <Box my={6}>
      <Typography variant='h5' gutterBottom>
        Uso Mensual de Ancho de Banda (MB)
      </Typography>
      <Box sx={{ width: '100%', height: 300, position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              zIndex: 1
            }}
          >
            <CircularProgress />
          </Box>
        )}
        {error && !loading && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <Typography color='error'>{error}</Typography>
          </Box>
        )}
        {!loading && !error && monthlyData.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <Typography color='text.secondary'>
              No hay datos mensuales para mostrar.
            </Typography>
          </Box>
        )}
        {!loading && !error && monthlyData.length > 0 && (
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={monthlyData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='month' />
              {/* Añadir label a YAxis */}
              <YAxis
                label={{ value: 'MB', angle: -90, position: 'insideLeft' }}
              />
              {/* Tooltip con formato */}
              <Tooltip
                formatter={(value: number) => `${value.toFixed(2)} MB`}
              />
              <Legend />
              {/* Usar los datos numéricos procesados */}
              <Bar
                dataKey='incomingMB_num'
                fill='#8884d8'
                name='Entrante (MB)'
              />
              <Bar
                dataKey='outgoingMB_num'
                fill='#82ca9d'
                name='Saliente (MB)'
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Box>
  )
}

export default MonthlyChart
