import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import Router from './router.tsx'
import { ThemeProvider } from '@mui/material'
import { theme } from './theme.tsx'
import * as Sentry from '@sentry/react'

import { PostHogProvider } from 'posthog-js/react'

import { QueryClient, QueryClientProvider } from 'react-query'
import { WebSocketProvider } from '@utils/use-websockets.tsx'

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST
}

const queryClient = new QueryClient()

Sentry.init({
  dsn: 'https://5023f73ba5a170f91cba618b6a135cd9@o4509155116253184.ingest.us.sentry.io/4509155117432832',
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0 // puedes bajarlo en producción
})

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
            <WebSocketProvider>
              <Router />
            </WebSocketProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </PostHogProvider>
  </React.StrictMode>
)
