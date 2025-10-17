import React from 'react'
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Paper
} from '@mui/material'
import {
  Home as HomeIcon,
  School as SchoolIcon,
  Assessment as ReportsIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import ComprehensiveReportingDashboard from '../../../Components/lms/widgets/ComprehensiveReportingDashboard'

// Modern color palette
const colors = {
  primary: '#10b981',
  primaryDark: '#059669',
  primaryLight: '#f0fdf4',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#3b82f6',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937'
  }
}

const LmsReports: React.FC = () => {
  const navigate = useNavigate()

  const handleReportGenerated = (report: any) => {
    // Handle successful report generation
    console.log('Report generated:', report)
    // Could show a success notification here
  }

  const handleError = (error: string) => {
    // Handle errors
    console.error('Report error:', error)
    // Could show an error notification here
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: colors.gray[50],
      pb: 4
    }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'white',
          borderBottom: `1px solid ${colors.gray[200]}`,
          mb: 3
        }}
      >
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* Breadcrumbs */}
          <Breadcrumbs
            aria-label="breadcrumb"
            sx={{ mb: 2 }}
            separator="›"
          >
            <Link
              underline="hover"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: colors.gray[600],
                '&:hover': { color: colors.primary }
              }}
              onClick={() => navigate('/')}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Inicio
            </Link>
            <Link
              underline="hover"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: colors.gray[600],
                '&:hover': { color: colors.primary }
              }}
              onClick={() => navigate('/lms/admin')}
            >
              <SchoolIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              LMS Admin
            </Link>
            <Typography
              color="text.primary"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                fontWeight: 600
              }}
            >
              <ReportsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Reportes y Análisis
            </Typography>
          </Breadcrumbs>

          {/* Page Title */}
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: colors.gray[800],
              mb: 1
            }}>
              Reportes y Análisis Avanzado
            </Typography>
            <Typography variant="h6" sx={{ 
              color: colors.gray[600],
              fontWeight: 400
            }}>
              Centro integral para generación de reportes, análisis de tendencias y cumplimiento regulatorio
            </Typography>
          </Box>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container maxWidth="xl">
        <ComprehensiveReportingDashboard
          onReportGenerated={handleReportGenerated}
          onError={handleError}
          defaultTab={0}
        />
      </Container>
    </Box>
  )
}

export default LmsReports