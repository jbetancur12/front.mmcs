import { Box, Skeleton } from '@mui/material'
import React from 'react'

// Skeleton loader component for better loading UX
export const TableSkeleton: React.FC = () => (
  <Box sx={{ p: 3 }}>
    {/* Header skeleton */}
    <Box
      sx={{
        mb: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <Skeleton variant='text' width={200} height={40} />
      <Skeleton
        variant='rectangular'
        width={180}
        height={36}
        sx={{ borderRadius: '8px' }}
      />
    </Box>

    {/* Table header skeleton */}
    <Box
      sx={{
        mb: 1,
        display: 'flex',
        gap: 2,
        px: 3,
        py: 2,
        backgroundColor: '#f8fafc',
        borderRadius: '8px 8px 0 0'
      }}
    >
      <Skeleton variant='text' width={100} height={20} />
      <Skeleton variant='text' width={120} height={20} />
      <Skeleton variant='text' width={80} height={20} />
      <Skeleton variant='text' width={60} height={20} />
    </Box>

    {/* Table rows skeleton */}
    {Array.from({ length: 5 }).map((_, index) => (
      <Box
        key={index}
        sx={{
          display: 'flex',
          gap: 2,
          px: 3,
          py: 2,
          borderBottom: '1px solid #f0f0f0',
          alignItems: 'center'
        }}
      >
        <Skeleton variant='text' width={100} height={24} />
        <Skeleton variant='text' width={180} height={24} />
        <Skeleton variant='text' width={90} height={24} />
        <Skeleton variant='text' width={150} height={24} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant='circular' width={32} height={32} />
          <Skeleton variant='circular' width={32} height={32} />
        </Box>
      </Box>
    ))}
  </Box>
)

// Loading state for buttons
export const ButtonSkeleton: React.FC<{ width?: number }> = ({
  width = 120
}) => (
  <Skeleton
    variant='rectangular'
    width={width}
    height={36}
    sx={{ borderRadius: '8px' }}
  />
)

// Loading state for form fields
export const FormFieldSkeleton: React.FC = () => (
  <Box sx={{ mb: 2 }}>
    <Skeleton variant='text' width={80} height={20} sx={{ mb: 1 }} />
    <Skeleton
      variant='rectangular'
      width='100%'
      height={56}
      sx={{ borderRadius: '8px' }}
    />
  </Box>
)
