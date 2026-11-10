import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Alert,
  AlertTitle,
  useMediaQuery,
  useTheme,
  Divider,
  Chip,
  CircularProgress,
  Tooltip
} from '@mui/material'
import { AttachMoney, Close, Receipt } from '@mui/icons-material'
import { formatCurrency } from 'src/pages/maintenance/ticket-details/maintenanceTicketDetailUtils'
import { logger } from 'src/utils/logger'
import { confirmDialog } from 'src/utils/confirm'
import { neutral, brand } from 'src/theme/designTokens'

// --- Interfaces ---

interface Cost {
  name: string
  description?: string
  // Permitimos number o string, pero aseguramos que se parsea en el cálculo
  amount: number | string
}

interface CostsListDialogProps {
  open: boolean
  onClose: () => void
  costs?: Cost[]
  isInitiallyInvoiced: boolean
  onInvoice: () => Promise<void>
  isProcessingInvoice: boolean // Estado de carga para la acción de facturar
  /** Quien no puede facturar (capacidad de Facturación) ve el costo pero no el botón. */
  canInvoice: boolean
}

// --- Componente Principal ---

const CostsListDialog: React.FC<CostsListDialogProps> = ({
  open,
  onClose,
  costs: initialCosts = [],
  isInitiallyInvoiced,
  onInvoice,
  isProcessingInvoice,
  canInvoice
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // 👈 Estado interno para manejar si se ha facturado (inicializado con la prop)
  const [isInvoiced, setIsInvoiced] = useState(isInitiallyInvoiced)

  // Sincronización del estado si la prop inicial cambia (ej. si el padre resetea el ticket)
  useMemo(() => {
    setIsInvoiced(isInitiallyInvoiced)
  }, [isInitiallyInvoiced])

  // Cálculo del total
  const totalCost = useMemo(() => {
    return initialCosts.reduce(
      (sum, cost) => sum + parseFloat(cost.amount.toString() || '0'),
      0
    )
  }, [initialCosts])

  // Manejador del botón de facturación
  const handleInvoice = async () => {
    const { isConfirmed } = await confirmDialog({
      title: '¿Marcar el ticket como facturado?',
      text: 'Quedará registrado como facturado. Podrás revertirlo desde Facturación.',
      confirmLabel: 'Marcar como facturado'
    })
    if (!isConfirmed) return
    try {
      await onInvoice()
      // Una vez que la acción del padre es exitosa, actualizamos el estado interno
      setIsInvoiced(true)
      // Opcional: podrías cerrar el diálogo aquí, o dejarlo abierto.
      // onClose();
    } catch (error) {
      logger.error('Error al facturar el ticket:', error)
      // El componente padre debe manejar el error y mostrar una notificación al usuario
    }
  }

  // --- Renderizado del Componente ---

  // Determinar el color y texto del Chip de estado
  const statusChip = useMemo(() => {
    if (isInvoiced) {
      return (
        <Chip
          label='Facturado'
          color='primary'
          icon={<Receipt />}
          size='small'
        />
      )
    }
    return (
      <Chip
        label='No Facturado'
        color='warning'
        icon={<AttachMoney />}
        size='small'
      />
    )
  }, [isInvoiced])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Box display='flex' alignItems='center'>
            <AttachMoney sx={{ mr: 1, color: brand.ink }} />
            <Typography variant='h6'>Costo del Servicio</Typography>
            <Box ml={2}>{statusChip}</Box> {/* 👈 Colocamos el Chip aquí */}
          </Box>
          <Tooltip title='Cerrar'>
            <span>
              <IconButton
                onClick={onClose}
                disabled={isProcessingInvoice}
                aria-label='Cerrar'
              >
                <Close />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {initialCosts.length === 0 ? (
          <Alert severity='info'>
            <AlertTitle>Sin costos de materiales</AlertTitle>
            Este ticket no tiene costos de materiales registrados. Solo se
            capturó el tiempo técnico del servicio. Puedes marcarlo como
            facturado.
          </Alert>
        ) : (
          <>
            {/* Lista de Costos */}
            {initialCosts.map((cost, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: '12px',
                  border: `1px solid ${neutral.border}`,
                  background: neutral.surfaceAlt,
                  '&:hover': {
                    background: brand.soft,
                    borderColor: brand.main
                  },
                  '&:last-child': { mb: 0 }
                }}
              >
                <Grid container spacing={2} alignItems='center'>
                  {/* Index */}
                  <Grid item xs='auto'>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: brand.soft,
                        color: brand.ink,
                        fontSize: '0.875rem',
                        fontWeight: 700
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  </Grid>

                  {/* Name & Description */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body1' fontWeight={600}>
                      {cost.name}
                    </Typography>
                    {cost.description && (
                      <Typography variant='caption' color='text.secondary'>
                        {cost.description}
                      </Typography>
                    )}
                  </Grid>

                  {/* Amount */}
                  <Grid item xs={12} sm={4}>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      display='block'
                    >
                      Monto
                    </Typography>
                    <Typography variant='h6' fontWeight={700} color={brand.ink}>
                      {formatCurrency(parseFloat(cost.amount.toString()))}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            ))}

            <Divider sx={{ my: 2 }} />

            {/* Resumen Total */}
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='center'
              sx={{
                p: 2,
                borderRadius: '12px',
                backgroundColor: neutral.surfaceAlt,
                border: `1px solid ${neutral.border}`
              }}
            >
              <Typography variant='h6' fontWeight={600}>
                Total de Costos
              </Typography>
              <Typography variant='h5' fontWeight={700} color={brand.ink}>
                {formatCurrency(totalCost)}
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Button
          onClick={onClose}
          color='inherit'
          disabled={isProcessingInvoice}
        >
          Cerrar
        </Button>
        {canInvoice && (
          <Button
            onClick={handleInvoice}
            color='primary'
            variant='contained'
            disabled={isInvoiced || isProcessingInvoice}
            startIcon={
              isProcessingInvoice ? (
                <CircularProgress size={20} color='inherit' />
              ) : (
                <Receipt />
              )
            }
            sx={{
              backgroundColor: brand.main,
              '&:hover': { backgroundColor: brand.hover }
            }}
          >
            {isProcessingInvoice
              ? 'Facturando...'
              : isInvoiced
                ? 'Ya Facturado'
                : initialCosts.length === 0
                  ? 'Marcar como Facturado'
                  : 'Facturar Costos'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default CostsListDialog
