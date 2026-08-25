import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Grid,
  Stack
} from '@mui/material'

// Skeleton for metric cards
export const MetricCardSkeleton: React.FC = () => (
  <Card sx={{
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    height: '100%'
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={32} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
      <Skeleton variant="rectangular" width="80%" height={24} sx={{ borderRadius: 1 }} />
    </CardContent>
  </Card>
)

// Skeleton for widget cards
export const WidgetCardSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <Card sx={{
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    height: height
  }}>
    <CardContent sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width="40%" height={28} />
        <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
      </Box>
      
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="text" width="20%" height={20} />
        </Box>
        <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: 1 }} />
      </Stack>

      <Stack spacing={1.5}>
        {[1, 2, 3].map((item) => (
          <Box key={item} sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="70%" height={16} />
              <Skeleton variant="text" width="40%" height={14} sx={{ mt: 0.5 }} />
            </Box>
            <Skeleton variant="text" width="15%" height={16} />
          </Box>
        ))}
      </Stack>
    </CardContent>
  </Card>
)

// Skeleton for chart components
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 200 }) => (
  <Box sx={{ width: '100%', height }}>
    <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 2 }} />
  </Box>
)

// Skeleton for table rows
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', py: 2, px: 1 }}>
    {Array.from({ length: columns }).map((_, index) => (
      <Box key={index} sx={{ flex: 1, mx: 1 }}>
        <Skeleton variant="text" width={index === 0 ? "80%" : "60%"} height={20} />
      </Box>
    ))}
  </Box>
)

// Skeleton for activity feed
export const ActivityFeedSkeleton: React.FC = () => (
  <Stack spacing={2}>
    {[1, 2, 3, 4].map((item) => (
      <Box key={item} sx={{
        display: 'flex',
        alignItems: 'center',
        p: 2,
        borderRadius: '12px',
        bgcolor: '#f9fafb',
        border: '1px solid #f3f4f6'
      }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="80%" height={18} />
          <Skeleton variant="text" width="50%" height={14} sx={{ mt: 0.5 }} />
        </Box>
        <Skeleton variant="text" width="15%" height={14} />
      </Box>
    ))}
  </Stack>
)

// Skeleton for quick action cards
export const QuickActionSkeleton: React.FC = () => (
  <Card sx={{
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    height: '100%'
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Skeleton variant="circular" width={56} height={56} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="90%" height={16} sx={{ mt: 1, mb: 2 }} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
      </Box>
    </CardContent>
  </Card>
)

// Skeleton for notification items
export const NotificationSkeleton: React.FC = () => (
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    p: 2,
    borderRadius: '8px',
    border: '1px solid #f3f4f6'
  }}>
    <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="80%" height={16} />
      <Skeleton variant="text" width="60%" height={14} sx={{ mt: 0.5 }} />
    </Box>
    <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} />
  </Box>
)

// Skeleton for system status items
export const SystemStatusSkeleton: React.FC = () => (
  <Stack spacing={2}>
    {[1, 2, 3].map((item) => (
      <Box key={item} sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        borderRadius: '12px',
        bgcolor: '#f0fdf4'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
          <Skeleton variant="text" width={120} height={16} />
        </Box>
        <Skeleton variant="rectangular" width={50} height={24} sx={{ borderRadius: 1 }} />
      </Box>
    ))}
  </Stack>
)

// Skeleton for dashboard header
export const DashboardHeaderSkeleton: React.FC = () => (
  <Box sx={{ mb: 4 }}>
    <Skeleton variant="text" width="60%" height={48} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
    <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 2 }} />
  </Box>
)

// Composite skeleton for entire dashboard sections
export const DashboardSectionSkeleton: React.FC<{
  title?: boolean
  cards?: number
  height?: number
}> = ({ title = true, cards = 3, height = 200 }) => (
  <Box sx={{ mb: 4 }}>
    {title && (
      <Skeleton variant="text" width="30%" height={32} sx={{ mb: 3 }} />
    )}
    <Grid container spacing={3}>
      {Array.from({ length: cards }).map((_, index) => (
        <Grid item xs={12} sm={6} lg={4} key={index}>
          <WidgetCardSkeleton height={height} />
        </Grid>
      ))}
    </Grid>
  </Box>
)

export default {
  MetricCardSkeleton,
  WidgetCardSkeleton,
  ChartSkeleton,
  TableRowSkeleton,
  ActivityFeedSkeleton,
  QuickActionSkeleton,
  NotificationSkeleton,
  SystemStatusSkeleton,
  DashboardHeaderSkeleton,
  DashboardSectionSkeleton
}