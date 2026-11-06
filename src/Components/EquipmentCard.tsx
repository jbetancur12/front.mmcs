import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Grid,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material'
import { Settings, LocationOn, Delete, CheckCircle } from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { useQueryClient } from 'react-query'
import { notify } from 'src/utils/notify'

import { ROLE_GROUPS, hasAnyRole } from 'src/constants/roles'
import { logger } from 'src/utils/logger'
import {
  brand,
  neutral,
  intent,
  detail,
  withAlpha
} from 'src/theme/designTokens'
export interface Certificate {
  id: number
  name: string
  city: string
  location: string
  sede: string
  activoFijo: string
  serie: string
  calibrationDate: string
  nextCalibrationDate: string
  filePath: string
  customerId: number
  deviceId: number
  certificateTypeId: number
  createdAt: string
  updatedAt: string
  headquarter: string
  device: {
    id: number
    name: string
    createdAt: string
    updatedAt: string
  }
  searchMatches?: { field: string }[]
}

interface EquipmentCardProps {
  certificate: Certificate
  onDelete: (id: number) => void
  sedes: string[]
  rol: string[]
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({
  certificate,
  onDelete,
  sedes,
  rol
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [sedeModalOpen, setSedeModalOpen] = useState(false)
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  // Calculate status based on calibration dates
  const getStatus = () => {
    if (!certificate.nextCalibrationDate)
      return {
        status: 'unknown',
        color: neutral.textMuted,
        bgColor: neutral.surfaceAlt,
        label: 'Sin fecha'
      }

    const now = new Date()
    const nextDate = new Date(certificate.nextCalibrationDate)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (nextDate < now) {
      return {
        status: 'expired',
        color: intent.danger,
        bgColor: intent.dangerSoft,
        label: 'Vencido'
      }
    } else if (nextDate <= thirtyDaysFromNow) {
      return {
        status: 'warning',
        color: intent.warning,
        bgColor: intent.warningSoft,
        label: 'Próximo a vencer'
      }
    } else {
      return {
        status: 'active',
        color: brand.ink,
        bgColor: intent.successSoft,
        label: 'Activo'
      }
    }
  }

  const status = getStatus()

  const handleCardClick = () => {
    // Navegar a los detalles del certificado
    navigate(`/calibraciones/certificados/${certificate.id}`)
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleDelete = async () => {
    try {
      await onDelete(certificate.id)
      notify.success('Equipo eliminado exitosamente')
    } catch (error) {
      notify.error('Error al eliminar el equipo')
      logger.error('Error deleting equipment:', error)
    }
    handleMenuClose()
  }

  const handleChangeSede = () => {
    setSedeModalOpen(true)
    handleMenuClose()
  }

  const handleSedeChange = async (newSede: string) => {
    if (newSede === certificate.headquarter) {
      setSedeModalOpen(false)
      return
    }

    try {
      const response = await axiosPrivate.put(
        `/files/headquarter/${certificate.id}`,
        {
          headquarter: newSede
        }
      )
      if (response.status === 200) {
        notify.success(`Sede cambiada a "${newSede}" exitosamente`)
        setSedeModalOpen(false)

        // Invalidate and refetch the certificates data using React Query
        queryClient.invalidateQueries(['certificates-data'])

        // Also trigger a gentle refresh of the component data
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch (error) {
      notify.error('Error al actualizar la sede')
      logger.error('Error updating headquarter:', error)
    }
  }

  return (
    <>
      <Card
        elevation={0}
        onClick={handleCardClick}
        sx={{
          border: `1px solid ${neutral.border}`,
          borderRadius: '16px',
          cursor: 'pointer',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 12px 24px ${withAlpha(neutral.black, 0.1)}`,
            borderColor: brand.main
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header with Status */}
          {hasAnyRole(rol, ROLE_GROUPS.METROLOGY_STAFF) && (
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='flex-start'
              mb={2}
            >
              <Chip
                label={status.label}
                size='small'
                sx={{
                  backgroundColor: status.bgColor,
                  color: status.color,
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
              <IconButton
                size='small'
                onClick={handleMenuClick}
                sx={{
                  color: neutral.textMuted,
                  '&:hover': { backgroundColor: neutral.surfaceHead }
                }}
              >
                <Settings fontSize='small' />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
                PaperProps={{
                  sx: { borderRadius: '8px', minWidth: '180px' }
                }}
              >
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleChangeSede()
                  }}
                >
                  <LocationOn
                    fontSize='small'
                    sx={{ mr: 1, color: brand.ink }}
                  />
                  Cambiar Sede
                </MenuItem>
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                  }}
                  sx={{ color: intent.danger }}
                >
                  <Delete fontSize='small' sx={{ mr: 1 }} />
                  Eliminar
                </MenuItem>
              </Menu>
            </Box>
          )}

          {/* Equipment Info */}
          <Box mb={3}>
            <Box
              display='flex'
              alignItems='flex-start'
              justifyContent='space-between'
              mb={2}
            >
              <Typography
                variant='h6'
                fontWeight='bold'
                sx={{ color: neutral.text, flex: 1 }}
              >
                {certificate.device?.name || 'Equipo sin nombre'}
              </Typography>
              {!certificate.filePath && (
                <Tooltip title='No hay certificado disponible'>
                  <Chip
                    label='Sin cert.'
                    size='small'
                    sx={{
                      backgroundColor: intent.dangerSoft,
                      color: intent.danger,
                      fontSize: '0.7rem',
                      height: '20px'
                    }}
                  />
                </Tooltip>
              )}
            </Box>

            <Box display='flex' flexDirection='column' gap={1.5}>
              <Box display='flex' alignItems='center' gap={1}>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ minWidth: '80px', fontWeight: 600 }}
                >
                  Serie:
                </Typography>
                <Typography
                  variant='body2'
                  fontWeight='500'
                  sx={{
                    color: certificate.serie
                      ? neutral.textBody
                      : neutral.textFaint
                  }}
                >
                  {certificate.serie || 'No especificada'}
                </Typography>
              </Box>

              <Box display='flex' alignItems='center' gap={1}>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ minWidth: '80px', fontWeight: 600 }}
                >
                  Activo:
                </Typography>
                <Typography
                  variant='body2'
                  fontWeight='500'
                  sx={{
                    color: certificate.activoFijo
                      ? neutral.textBody
                      : neutral.textFaint
                  }}
                >
                  {certificate.activoFijo || 'No asignado'}
                </Typography>
              </Box>

              <Box display='flex' alignItems='center' gap={1}>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ minWidth: '80px', fontWeight: 600 }}
                >
                  Sede:
                </Typography>
                <Chip
                  label={certificate.headquarter || 'Sin sede'}
                  size='small'
                  sx={{
                    backgroundColor: certificate.headquarter
                      ? intent.infoSoft
                      : neutral.surfaceAlt,
                    color: certificate.headquarter
                      ? intent.infoInk
                      : neutral.textMuted,
                    fontSize: '0.75rem',
                    height: '24px',
                    fontWeight: 500
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Calibration Dates */}
          <Box>
            <Typography
              variant='body2'
              color='text.secondary'
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Información de Calibración
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: neutral.surfaceAlt,
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}
                >
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'
                  >
                    Última Calibración
                  </Typography>
                  <Typography
                    variant='body2'
                    fontWeight='600'
                    sx={{ color: neutral.textBody }}
                  >
                    {certificate.calibrationDate
                      ? new Date(
                          certificate.calibrationDate
                        ).toLocaleDateString('es-ES')
                      : 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: status.bgColor,
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: `1px solid ${status.color}20`
                  }}
                >
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'
                  >
                    Próxima Calibración
                  </Typography>
                  <Typography
                    variant='body2'
                    fontWeight='600'
                    sx={{ color: status.color }}
                  >
                    {certificate.nextCalibrationDate
                      ? new Date(
                          certificate.nextCalibrationDate
                        ).toLocaleDateString('es-ES')
                      : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Modal para cambiar sede */}
      <Dialog
        open={sedeModalOpen}
        onClose={() => setSedeModalOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: `0 20px 25px -5px ${withAlpha(neutral.black, 0.1)}`
          }
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            fontWeight: 'bold',
            pb: 1,
            borderBottom: `1px solid ${neutral.border}`
          }}
        >
          <Box
            display='flex'
            alignItems='center'
            justifyContent='center'
            gap={1}
          >
            <LocationOn sx={{ color: brand.main }} />
            Cambiar Sede del Equipo
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography
            variant='body2'
            color='text.secondary'
            gutterBottom
            sx={{ textAlign: 'center', mb: 3 }}
          >
            Selecciona la nueva sede para:{' '}
            <strong>{certificate.device?.name}</strong>
          </Typography>

          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ mb: 2, fontWeight: 600 }}
          >
            Sede actual:{' '}
            <Chip
              label={certificate.headquarter || 'Sin sede'}
              size='small'
              sx={{
                backgroundColor: intent.infoSoft,
                color: intent.infoInk,
                fontWeight: 600
              }}
            />
          </Typography>

          <Box display='flex' flexDirection='column' gap={1.5} mt={2}>
            {sedes && sedes.length > 0 ? (
              sedes.map((sede) => (
                <Button
                  key={sede}
                  variant={
                    certificate.headquarter === sede ? 'contained' : 'outlined'
                  }
                  onClick={() => handleSedeChange(sede)}
                  disabled={certificate.headquarter === sede}
                  startIcon={
                    certificate.headquarter === sede ? (
                      <CheckCircle />
                    ) : (
                      <LocationOn />
                    )
                  }
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    borderRadius: '12px',
                    py: 1.5,
                    px: 2,
                    ...(certificate.headquarter === sede
                      ? {
                          background: `linear-gradient(135deg, ${detail.from} 0%, ${detail.to} 100%)`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${detail.to} 0%, ${intent.successInk} 100%)`
                          }
                        }
                      : {
                          borderColor: neutral.borderStrong,
                          color: neutral.textBody,
                          '&:hover': {
                            borderColor: brand.main,
                            backgroundColor: intent.successSoft,
                            color: brand.ink
                          }
                        })
                  }}
                >
                  {sede}
                  {certificate.headquarter === sede && (
                    <Typography
                      variant='caption'
                      sx={{ ml: 'auto', opacity: 0.8 }}
                    >
                      (Actual)
                    </Typography>
                  )}
                </Button>
              ))
            ) : (
              <Box textAlign='center' py={3}>
                <Typography variant='body2' color='text.secondary'>
                  No hay sedes disponibles
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setSedeModalOpen(false)}
            variant='outlined'
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default EquipmentCard
