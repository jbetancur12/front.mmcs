import React from 'react'
import { Card, CardContent, Box, Skeleton, Stack } from '@mui/material'

const TicketCardSkeleton: React.FC = () => {
  return (
    <Card aria-label='Cargando ticket'>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header: Title and badges */}
        <Box display='flex' justifyContent='space-between' alignItems='flex-start' mb={2}>
          <Box flex={1} mr={2}>
            <Skeleton variant='text' width='70%' height={32} sx={{ mb: 1 }} />
          </Box>
          <Stack direction='row' spacing={1}>
            <Skeleton variant='rounded' width={80} height={24} />
            <Skeleton variant='rounded' width={60} height={24} />
          </Stack>
        </Box>

        {/* Content: Service type and device */}
        <Stack spacing={1} mb={2}>
          <Skeleton variant='text' width='50%' height={20} />
          <Skeleton variant='text' width='60%' height={20} />
        </Stack>

        {/* Footer: Timestamp and actions */}
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Skeleton variant='text' width={150} height={20} />
          <Skeleton variant='rounded' width={100} height={36} />
        </Box>
      </CardContent>
    </Card>
  )
}

export default TicketCardSkeleton
