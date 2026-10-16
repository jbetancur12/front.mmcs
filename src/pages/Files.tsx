import React from 'react'
import Table from '../Components/TableFiles/TableFiles'
import { Paper, Container } from '@mui/material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import { CalendarMonth } from '@mui/icons-material'

const Files: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3, height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <LmsPageHeader
        title='Cronograma de Calibraciones'
        subtitle='Certificados de calibración de equipos: fechas, descargas y próximas calibraciones.'
        icon={<CalendarMonth />}
      />

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
