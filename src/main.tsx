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

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST
}

// Sentry.init({
//   dsn: 'https://5023f73ba5a170f91cba618b6a135cd9@o4509155116253184.ingest.us.sentry.io/4509155117432832',
//   integrations: [Sentry.browserTracingIntegration()],
//   tracesSampleRate: 1.0 // puedes bajarlo en producción
// })

const APP_VERSION = '1.0.0'; // Cambia esto en cada deploy

// Limpiar cache cuando cambie la versión
const currentVersion = localStorage.getItem('app-version');
if (currentVersion !== APP_VERSION) {
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  localStorage.setItem('app-version', APP_VERSION);
  window.location.reload();
}

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
          </ThemeProvider>
        </BrowserRouter>
        {/* React Query DevTools - only in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </PostHogProvider>
  </React.StrictMode>
)
