import React from 'react'
import { Box, Container, Typography } from '@mui/material'
import EnhancedCourseMetricsWidget from './EnhancedCourseMetricsWidget'
import { useEnhancedCourseMetrics } from 'src/hooks/useLms'

const EnhancedCourseMetricsTest: React.FC = () => {
  const { data, loading, error } = useEnhancedCourseMetrics({
    includePopularity: true,
    includeTimeAnalytics: true
  })

  const handleCourseClick = (courseId: number) => {
    console.log('Course clicked:', courseId)
  }

  const handleViewAll = () => {
    console.log('View all clicked')
  }

  const handleDrillDown = (type: 'performance' | 'popularity' | 'time-analysis', courseId?: number) => {
    console.log('Drill down:', type, courseId)
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        Enhanced Course Metrics Widget Test
      </Typography>
      
      <Box sx={{ maxWidth: 400 }}>
        <EnhancedCourseMetricsWidget
          data={data}
          loading={loading}
          error={error}
          onCourseClick={handleCourseClick}
          onViewAll={handleViewAll}
          onDrillDown={handleDrillDown}
        />
      </Box>
    </Container>
  )
}

export default EnhancedCourseMetricsTest
// @ts-nocheck
