import { CalendarToday, Devices, Download } from '@mui/icons-material'
import { Box, Button, CircularProgress, Grid, Typography } from '@mui/material'
import React from 'react'

import { TabValue } from './types'

interface OverviewTabProps {
  handleTabChange: (tab: TabValue) => void
  isDownloading: boolean
  handleDownloadOverviewReport: () => void
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  handleTabChange,
  isDownloading,
  handleDownloadOverviewReport
}) => (
  <Box>
    <Typography variant='h5' fontWeight='bold' gutterBottom>
      Resumen del Cliente
    </Typography>
    <Typography variant='body1' color='text.secondary' paragraph>
      Vista general de la información y estadísticas del cliente.
    </Typography>

    {/* Quick Actions */}
    <Grid container spacing={2} sx={{ mt: 2 }}>
      <Grid item xs={12} sm={6} md={4}>
        <Button
          fullWidth
          variant='outlined'
          startIcon={<Devices />}
          onClick={() => handleTabChange('equipment')}
          sx={{
            py: 2,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Ver Equipos
        </Button>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Button
          fullWidth
          variant='outlined'
          startIcon={<CalendarToday />}
          onClick={() => handleTabChange('schedule')}
          sx={{
            py: 2,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Ver Programación
        </Button>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Button
          fullWidth
          variant='contained'
          startIcon={
            isDownloading ? <CircularProgress size={16} /> : <Download />
          }
          onClick={handleDownloadOverviewReport}
          disabled={isDownloading}
          sx={{
            py: 2,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            }
          }}
        >
          {isDownloading ? 'Generando Reporte...' : 'Descargar Reporte'}
        </Button>
      </Grid>
    </Grid>
  </Box>
)

export default OverviewTab
