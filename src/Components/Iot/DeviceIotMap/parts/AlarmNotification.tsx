import { Paper, Typography, IconButton, Collapse, Button } from '@mui/material'
import { Close } from '@mui/icons-material'
import { useState } from 'react'
import { FilterState } from '../types'
import { $hasAlarms } from '@stores/deviceIotStore'
import { useStore } from '@nanostores/react'
// import { $hasAlarms } from 'src/store/alertsStore' // Ajusta la importación de tu store

const AlarmNotification = ({
  onFilterChange
}: {
  onFilterChange: (type: keyof FilterState, value: any) => void
}) => {
  const hasAlarms = useStore($hasAlarms)
  const [visible, setVisible] = useState(true)

  if (!hasAlarms || !visible) return null

  return (
    <Collapse in={visible}>
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1200,
          backgroundColor: 'error.light',
          color: 'common.white',
          borderRadius: 2,
          px: 3,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
      >
        <Typography variant='body1' fontWeight='bold'>
          ⚠️ Dispositivos en estado de alerta
        </Typography>
        <Button
          size='small'
          variant='contained'
          onClick={() =>
            onFilterChange(
              'alarmSeverities',
              new Set(['information', 'warning', 'critical'])
            )
          }
          sx={{
            mr: 1,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            },
            transition: 'all 0.3s ease'
          }}
          color='error'
        >
          Ver dispositivos
        </Button>
        <IconButton
          size='small'
          onClick={() => setVisible(false)}
          sx={{ color: 'inherit' }}
        >
          <Close fontSize='small' />
        </IconButton>
      </Paper>
    </Collapse>
  )
}

export default AlarmNotification
