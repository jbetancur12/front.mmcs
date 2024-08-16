import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import Router from './router.tsx'
import { ThemeProvider } from '@mui/material'
import { theme } from './theme.tsx'

import { PostHogProvider } from 'posthog-js/react'

import { QueryClient, QueryClientProvider } from 'react-query'

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST
}

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={
        import.meta.env.VITE_ENV === 'production'
          ? import.meta.env.VITE_POSTHOG_KEY
          : ''
      }
      options={options}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Router />
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </PostHogProvider>
  </React.StrictMode>
)
