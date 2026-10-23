import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography
} from '@mui/material'
import { Save } from '@mui/icons-material'
import { useCan } from '@utils/functions'
import { getApiErrorMessage } from '@utils/apiError'
import { PERMISSIONS } from 'src/constants/permissions'
import { useSaveIndicatorObservations } from 'src/hooks/useCustomerIndicators'
import { IndicatorObservations } from 'src/types/customerIndicators'
import { notify } from 'src/utils/notify'
import { emeraldButtonSx, formatDate } from './indicatorFormat'

export const OBSERVATIONS_MAX_LENGTH = 2000

interface Props {
  customerId: number | string
  year: number
  observations: IndicatorObservations
}

/** Observaciones del año para el comité: texto plano, se guardan por cliente y año. */
const IndicatorObservationsCard: React.FC<Props> = ({
  customerId,
  year,
  observations
}) => {
  const canEdit = useCan(PERMISSIONS.CUSTOMERS_INDICATOR_OBSERVATIONS)
  const saved = observations.text ?? ''
  const [text, setText] = useState(saved)
  const { mutateAsync, isLoading } = useSaveIndicatorObservations()

  // Al cambiar de año o de cliente, o tras guardar, el texto vuelve al guardado.
  useEffect(() => {
    setText(saved)
  }, [saved, year, customerId])

  const dirty = text !== saved
  const tooLong = text.length > OBSERVATIONS_MAX_LENGTH

  const handleSave = async () => {
    try {
      await mutateAsync({ customerId, year, text })
      notify.success('Observaciones guardadas')
    } catch (error) {
      notify.error(
        getApiErrorMessage(error, 'No se pudieron guardar las observaciones.')
      )
    }
  }

  return (
    <Card
      elevation={0}
      sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant='h6' fontWeight='bold' gutterBottom>
          Observaciones para el comité · {year}
        </Typography>
        {canEdit ? (
          <TextField
            label='Observaciones'
            placeholder='Escribe aquí los comentarios que acompañarán el informe del comité…'
            value={text}
            onChange={(event) => setText(event.target.value)}
            multiline
            minRows={4}
            fullWidth
            error={tooLong}
            helperText={`${text.length.toLocaleString('es-CO')} / ${OBSERVATIONS_MAX_LENGTH.toLocaleString('es-CO')} caracteres`}
            inputProps={{ 'aria-label': 'Observaciones del año' }}
          />
        ) : (
          <Typography
            variant='body2'
            sx={{
              whiteSpace: 'pre-wrap',
              color: saved ? 'text.primary' : 'text.secondary'
            }}
          >
            {saved || 'Aún no hay observaciones para este año.'}
          </Typography>
        )}
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Typography variant='caption' color='text.secondary'>
            {observations.updatedAt
              ? `Última edición: ${observations.updatedBy?.name ?? 'usuario'}, ${formatDate(observations.updatedAt)}`
              : 'Sin ediciones todavía'}
          </Typography>
          {canEdit && (
            <Button
              variant='contained'
              onClick={handleSave}
              disabled={!dirty || tooLong || isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <Save />
                )
              }
              sx={emeraldButtonSx}
            >
              Guardar observaciones
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default IndicatorObservationsCard
