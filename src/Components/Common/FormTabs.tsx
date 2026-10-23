import React from 'react'
import { Chip, Paper, Stack, Tab, Tabs } from '@mui/material'

export interface FormTab {
  key: string
  label: string
  icon?: React.ReactElement
  /** Campos con error en la pestaña; con 0 no se muestra el contador. */
  errorCount?: number
}

interface FormTabsProps {
  tabs: FormTab[]
  value: string
  onChange: (key: string) => void
}

/**
 * Barra de pestañas de un formulario largo (`FormPage`): ícono, nombre y un
 * contador naranja con los campos que tienen error. Mismo estilo que la
 * navegación del servicio de calibración.
 */
const FormTabs: React.FC<FormTabsProps> = ({ tabs, value, onChange }) => (
  <Paper
    elevation={0}
    sx={{
      mb: 3,
      maxWidth: 1100,
      borderRadius: '14px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}
  >
    <Tabs
      value={value}
      onChange={(_, key: string) => onChange(key)}
      variant='scrollable'
      scrollButtons={false}
      sx={{
        minHeight: 48,
        px: 1.5,
        '& .MuiTab-root': {
          minHeight: 48,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8rem',
          px: 2,
          gap: 1,
          color: 'text.secondary',
          '&.Mui-selected': { color: '#00897B' }
        },
        '& .MuiTabs-indicator': {
          backgroundColor: '#00BFA5',
          height: 3,
          borderRadius: '3px 3px 0 0'
        }
      }}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.key}
          value={tab.key}
          icon={tab.icon}
          iconPosition='start'
          label={
            <Stack direction='row' alignItems='center' spacing={1}>
              <span>{tab.label}</span>
              {tab.errorCount ? (
                <Chip
                  size='small'
                  color='warning'
                  variant='outlined'
                  label={tab.errorCount}
                  aria-label={`${tab.errorCount} campos con error`}
                  sx={{
                    height: 20,
                    minWidth: 22,
                    '& .MuiChip-label': {
                      fontSize: '0.7rem',
                      px: 0.8,
                      fontWeight: 700
                    }
                  }}
                />
              ) : null}
            </Stack>
          }
        />
      ))}
    </Tabs>
  </Paper>
)

export default FormTabs
