import React from 'react'
import { Card, CardContent, Box, Skeleton } from '@mui/material'

const StatCardSkeleton: React.FC = () => {
  return (
    <Card aria-label='Cargando estadística'>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Box flex={1}>
            <Skeleton 
              variant='text' 
              width='60%' 
              height={48} 
              sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' } }} 
            />
            <Skeleton 
              variant='text' 
              width='80%' 
              height={20} 
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mt: 1 }} 
            />
          </Box>
          <Skeleton
            variant='circular'
            sx={{
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 }
            }}
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export default StatCardSkeleton
