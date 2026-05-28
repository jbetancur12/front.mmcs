import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import Router from './router.tsx'
import { ThemeProvider } from '@mui/material'
import { theme } from './theme.tsx'
// import * as Sentry from '@sentry/react'

import { PostHogProvider } from 'posthog-js/react'

import { QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { WebSocketProvider } from '@utils/use-websockets.tsx'
import { queryClient } from './config/queryClient'
import { ToastProvider } from './Components/lms/Notifications/ToastNotifications'
import NewVersionBanner from './Components/NewVersionBanner'

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST
}

// Sentry.init({
//   dsn: 'https://5023f73ba5a170f91cba618b6a135cd9@o4509155116253184.ingest.us.sentry.io/4509155117432832',
//   integrations: [Sentry.browserTracingIntegration()],
//   tracesSampleRate: 1.0 // puedes bajarlo en producción
// })

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
            <ToastProvider
              maxToasts={5}
              defaultDuration={5000}
              position={{ vertical: 'top', horizontal: 'right' }}
            >
              <WebSocketProvider>
                <Router />
              </WebSocketProvider>
            </ToastProvider>
            <NewVersionBanner />
          </ThemeProvider>
        </BrowserRouter>
        {/* React Query DevTools - only in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </PostHogProvider>
  </React.StrictMode>
)

// Unregister any existing service workers to avoid caching issues from other branches/projects
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister()
    }
  })
}
