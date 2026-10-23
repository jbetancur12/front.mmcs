import React, { useState } from 'react'
import { Box, Button, Card, CardContent, Chip, Typography } from '@mui/material'
import { Flag } from '@mui/icons-material'
import { useCan } from '@utils/functions'
import { getApiErrorMessage } from '@utils/apiError'
import { MySwal } from '@utils/sweetAlert'
import { PERMISSIONS } from 'src/constants/permissions'
import { useSaveIndicatorGoal } from 'src/hooks/useCustomerIndicators'
import { IndicatorGoal } from 'src/types/customerIndicators'
import { notify } from 'src/utils/notify'
import GoalOverrideDialog from './GoalOverrideDialog'
import {
  TEAL_TEXT,
  formatCount,
  formatDate,
  emeraldButtonSx
} from './indicatorFormat'

interface Props {
  customerId: number | string
  year: number
  goal: IndicatorGoal
}

/** Solo personal interno: meta del año (automática o manual) y quién la fijó. */
const IndicatorGoalCard: React.FC<Props> = ({ customerId, year, goal }) => {
  const canManage = useCan(PERMISSIONS.CUSTOMERS_INDICATOR_GOAL_MANAGE)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { mutateAsync, isLoading } = useSaveIndicatorGoal()
  const isManual = goal.mode === 'manual'

  const handleBackToAuto = async () => {
    const result = await MySwal.fire({
      title: '¿Volver a la meta automática?',
      text: `Se quitará la meta manual de ${year} y se usará el total de las ODS del año.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, volver a automática',
      cancelButtonText: 'Cancelar'
    })
    if (!result.isConfirmed) return
    try {
      await mutateAsync({ customerId, year, mode: 'auto' })
      notify.success('Meta automática restablecida')
    } catch (error) {
      notify.error(getApiErrorMessage(error, 'No se pudo cambiar la meta.'))
    }
  }

  return (
    <Card
      elevation={0}
      sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap'
              }}
            >
              <Flag sx={{ color: TEAL_TEXT }} aria-hidden />
              <Typography variant='h6' fontWeight='bold'>
                Meta de calibración {year}
              </Typography>
              <Chip size='small' variant='outlined' label='Solo Metromedics' />
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 1.5,
                mt: 1.5,
                flexWrap: 'wrap'
              }}
            >
              <Typography
                variant='h4'
                fontWeight='bold'
                sx={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatCount(goal.value)}
              </Typography>
              <Chip
                size='small'
                color={isManual ? 'warning' : 'success'}
                variant='outlined'
                label={isManual ? 'Meta manual' : 'Meta automática'}
              />
            </Box>
            {isManual ? (
              <Typography variant='body2' sx={{ mt: 1 }}>
                Contratado según ODS: {formatCount(goal.contracted)}. Motivo:{' '}
                {goal.reason}
              </Typography>
            ) : (
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                Suma de los equipos de {formatCount(goal.contractedServices)}{' '}
                ODS del año.
              </Typography>
            )}
            {goal.updatedAt && (
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ display: 'block', mt: 0.5 }}
              >
                {isManual ? 'Fijada' : 'Devuelta a automática'}
                {goal.updatedBy ? ` por ${goal.updatedBy.name}` : ''},{' '}
                {formatDate(goal.updatedAt)}
              </Typography>
            )}
          </Box>
          {canManage && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
                alignSelf: { sm: 'center' }
              }}
            >
              <Button
                variant='contained'
                onClick={() => setDialogOpen(true)}
                sx={emeraldButtonSx}
              >
                Fijar otra meta
              </Button>
              {isManual && (
                <Button
                  variant='outlined'
                  onClick={handleBackToAuto}
                  disabled={isLoading}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Volver a automática
                </Button>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
      {canManage && (
        <GoalOverrideDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          customerId={customerId}
          year={year}
          contracted={goal.contracted}
          currentManualGoal={isManual ? goal.value : null}
          currentReason={isManual ? goal.reason : null}
        />
      )}
    </Card>
  )
}

export default IndicatorGoalCard
