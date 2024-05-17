import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import Router from './router.tsx'
import { ThemeProvider } from '@mui/material'
import { theme } from './theme.tsx'

import { PostHogProvider } from 'posthog-js/react'

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_POSTHOG_KEY}
      options={options}
    >
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <Router />
        </ThemeProvider>
      </BrowserRouter>
    </PostHogProvider>
  </React.StrictMode>
)
