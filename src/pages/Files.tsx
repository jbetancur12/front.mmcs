import React from 'react'
import Table from '../Components/TableFiles/TableFiles'
import { Container } from '@mui/material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import { CalendarMonth } from '@mui/icons-material'

const Files: React.FC = () => {
  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Cronograma de Calibraciones'
        subtitle='Certificados de calibración de equipos: fechas, descargas y próximas calibraciones.'
        icon={<CalendarMonth />}
      />
      <Table />
    </Container>
  )
}

export default Files
