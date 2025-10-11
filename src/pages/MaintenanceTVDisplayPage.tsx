import React from 'react'
import { Box } from '@mui/material'
import { QueryClient, QueryClientProvider } from 'react-query'
import MaintenanceTVDisplayPublic from '../Components/Maintenance/TVDisplayModern'

// Create a separate query client for the TV display to avoid conflicts
const tvDisplayQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
      staleTime: 30000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  }
})

/**
 * MaintenanceTVDisplayPage - A public page for displaying maintenance tickets on TV screens
 *
 * This page is designed to be displayed on large screens (TVs/monitors) in office environments
 * to show real-time maintenance ticket status without requiring authentication.
 *
 * Features:
 * - No authentication required (public access)
 * - Optimized for large screens (1920x1080+)
 * - Real-time data updates every 30 seconds
 * - Dark theme for office environments
 * - Auto-sliding for tickets when there are many
 * - Urgent ticket animations and highlighting
 */
const MaintenanceTVDisplayPage: React.FC = () => {
  return (
    <QueryClientProvider client={tvDisplayQueryClient}>
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#121212',
          overflow: 'hidden'
        }}
      >
        <MaintenanceTVDisplayPublic />
      </Box>
    </QueryClientProvider>
  )
}

export default MaintenanceTVDisplayPage
