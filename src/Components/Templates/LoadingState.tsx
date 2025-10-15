// Loading State Component with Skeleton Screens
import React from 'react'
import { Box, Skeleton, Typography, CircularProgress } from '@mui/material'
import { PageHeader, SkeletonContainer } from './styles'

interface LoadingStateProps {
  variant?: 'page' | 'table' | 'cards' | 'inline'
  message?: string
}

const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'page',
  message = 'Cargando plantillas...'
}) => {
  if (variant === 'inline') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4
        }}
      >
        <CircularProgress size={24} sx={{ marginRight: 2 }} />
        <Typography variant='body2' color='text.secondary'>
          {message}
        </Typography>
      </Box>
    )
  }

  if (variant === 'table') {
    return <TableSkeleton />
  }

  if (variant === 'cards') {
    return <CardsSkeleton />
  }

  // Default page variant
  return (
    <>
      {/* Header Skeleton */}
      <PageHeader>
        <Box>
          <Skeleton variant='text' width={300} height={40} />
          <Skeleton variant='text' width={400} height={24} />
        </Box>
        <Skeleton
          variant='rectangular'
          width={200}
          height={48}
          sx={{ borderRadius: '12px' }}
        />
      </PageHeader>

      <TableSkeleton />
    </>
  )
}

// Table Skeleton Component
export const TableSkeleton: React.FC = () => {
  return (
    <SkeletonContainer>
      <Box sx={{ marginBottom: 2 }}>
        <Typography variant='h6' gutterBottom>
          Cargando plantillas...
        </Typography>
      </Box>

      {/* Search Bar Skeleton */}
      <Box sx={{ marginBottom: 3 }}>
        <Skeleton
          variant='rectangular'
          width={500}
          height={56}
          sx={{ borderRadius: '8px' }}
        />
      </Box>

      {/* Table Header Skeleton */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          marginBottom: 2,
          padding: 2,
          backgroundColor: '#f9fafb',
          borderRadius: '12px 12px 0 0',
          border: '1px solid #e5e7eb'
        }}
      >
        <Skeleton variant='text' width={60} height={24} />
        <Skeleton variant='text' width={120} height={24} />
        <Skeleton variant='text' width={150} height={24} />
        <Skeleton variant='text' width={100} height={24} />
        <Skeleton variant='text' width={100} height={24} />
        <Skeleton variant='text' width={80} height={24} />
        <Skeleton variant='text' width={120} height={24} />
        <Skeleton variant='text' width={100} height={24} />
        <Skeleton variant='text' width={100} height={24} />
      </Box>

      {/* Table Rows Skeleton */}
      {Array.from({ length: 5 }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            gap: 2,
            marginBottom: 1,
            padding: 2,
            backgroundColor: '#ffffff',
            borderRadius: index === 4 ? '0 0 12px 12px' : '0',
            border: '1px solid #e5e7eb',
            borderTop: index === 0 ? '1px solid #e5e7eb' : 'none'
          }}
        >
          <Skeleton variant='text' width={60} height={32} />
          <Skeleton variant='text' width={120} height={32} />
          <Skeleton variant='text' width={150} height={32} />
          <Skeleton variant='text' width={100} height={32} />
          <Skeleton variant='text' width={100} height={32} />
          <Skeleton variant='text' width={80} height={32} />
          <Skeleton variant='text' width={120} height={32} />
          <Skeleton variant='text' width={100} height={32} />
          <Box sx={{ display: 'flex', gap: 1, marginLeft: 'auto' }}>
            <Skeleton variant='circular' width={32} height={32} />
            <Skeleton variant='circular' width={32} height={32} />
            <Skeleton variant='circular' width={32} height={32} />
          </Box>
        </Box>
      ))}
    </SkeletonContainer>
  )
}

// Cards Skeleton Component
export const CardsSkeleton: React.FC = () => {
  return (
    <SkeletonContainer>
      <Box sx={{ marginBottom: 2 }}>
        <Typography variant='h6' gutterBottom>
          Cargando plantillas...
        </Typography>
      </Box>

      {/* Search Bar Skeleton */}
      <Box sx={{ marginBottom: 3 }}>
        <Skeleton
          variant='rectangular'
          width={500}
          height={56}
          sx={{ borderRadius: '8px' }}
        />
      </Box>

      {/* Cards Grid Skeleton */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: 3
        }}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <Box
            key={index}
            sx={{
              padding: 3,
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              backgroundColor: '#ffffff'
            }}
          >
            {/* Card Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 2
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Skeleton variant='text' width='80%' height={28} />
                <Skeleton variant='text' width='60%' height={20} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant='circular' width={32} height={32} />
                <Skeleton variant='circular' width={32} height={32} />
                <Skeleton variant='circular' width={32} height={32} />
              </Box>
            </Box>

            {/* Card Content */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
                marginBottom: 2
              }}
            >
              <Box>
                <Skeleton variant='text' width='40%' height={16} />
                <Skeleton variant='text' width='80%' height={20} />
                <Skeleton variant='text' width='60%' height={16} />
              </Box>
              <Box>
                <Skeleton variant='text' width='40%' height={16} />
                <Skeleton variant='text' width='70%' height={20} />
                <Skeleton variant='text' width='50%' height={16} />
              </Box>
            </Box>

            {/* Card Footer */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Skeleton variant='text' width='40%' height={16} />
              <Skeleton variant='text' width='20%' height={16} />
            </Box>
          </Box>
        ))}
      </Box>
    </SkeletonContainer>
  )
}

export default LoadingState
