import React from 'react'
import Table from '../Components/TableFiles/TableFiles'
import { Box, Typography, Paper, Container } from '@mui/material'
import { CalendarMonth } from '@mui/icons-material'

const Files: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3, height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '20px',
          p: 3,
          mb: 3,
          flexShrink: 0,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            zIndex: 0
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            zIndex: 0
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box display="flex" alignItems="center" mb={1}>
            <CalendarMonth sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h4" fontWeight="bold">
              Cronograma de Calibraciones
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: '800px' }}>
            Gestiona y consulta los certificados de calibración de equipos.
            Visualiza fechas, descargas archivos y mantén el control de las próximas calibraciones.
          </Typography>
        </Box>
      </Paper>

      {/* Table Section */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          '& .MuiPaper-root': {
            boxShadow: 'none'
          }
        }}
      >
        <Table />
      </Paper>
    </Container>
  )
}

export default Files
