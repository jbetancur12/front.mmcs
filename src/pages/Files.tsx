import React from 'react'
import Table from '../Components/TableFiles/TableFiles'
import { Box, Typography } from '@mui/material'

const Files: React.FC = () => {
  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <Typography variant='h6' gutterBottom>
          Cronograma de Calibraciones
        </Typography>

        <Table />
      </Box>
    </>
  )
}

export default Files
