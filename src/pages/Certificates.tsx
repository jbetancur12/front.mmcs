import SignalLoader from 'src/Components/Common/SignalLoader'
import { useNavigate, useParams } from 'react-router-dom'
import React, { useState } from 'react'
import { useQueryClient } from 'react-query'
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography
} from '@mui/material'
import {
  ArrowBack,
  CheckCircle,
  Devices,
  Edit,
  Error as ErrorIcon,
  Info,
  SwapHoriz,
  Update,
  Warning
} from '@mui/icons-material'
import CertificatesList from '../Components/CertificatesList'
import UpdateCertificateModal from '../Components/UpdateCertificateModal'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import {
  DetailCell,
  DetailField,
  DetailSection
} from 'src/Components/Common/DetailBlocks'
import CertificateEditDialog from '../Components/certificateDetail/CertificateEditDialog'
import BulkReassignDialog from '../Components/certificateDetail/BulkReassignDialog'
import { notify } from 'src/utils/notify'
import {
  FILE_QUERY_KEYS,
  useBulkReassignFileDevice,
  useFile,
  useUpdateFile
} from '@hooks/files/useFiles'
import { CERTIFICATE_HISTORY_QUERY_KEYS } from '@hooks/certificates/useCertificateHistory'
import { formatDateOnly } from '@utils/dateOnly'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

interface DeviceDetailsProps {
  id: number
  name: string
  city: string
  location: string
  sede: string
  activoFijo: string
  serie: string
  headquarter: string
  calibrationDate: string
  nextCalibrationDate: string
  filePath: string
  customerId: number
  deviceId: number
  device: { name?: string } | null
  customer: { nombre?: string } | null
  certificateTypeId: number
  createdAt: string
  updatedAt: string
}

type StatusTone = 'success' | 'warning' | 'error' | 'default'

const OUTLINE_BUTTON_SX = {
  textTransform: 'none',
  fontWeight: 600,
  color: '#00695C',
  borderColor: '#00BFA5',
  '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
} as const

const CARD_SX = {
  p: { xs: 2, md: 3 },
  borderRadius: '16px',
  border: '1px solid #e5e7eb'
} as const

const STATUS_STYLE: Record<
  StatusTone,
  { ink: string; soft: string; border: string; Icon: typeof CheckCircle }
> = {
  success: {
    ink: '#2e7d32',
    soft: '#e8f5e9',
    border: '#a5d6a7',
    Icon: CheckCircle
  },
  warning: {
    ink: '#b45309',
    soft: '#fff3e0',
    border: '#fdba74',
    Icon: Warning
  },
  error: {
    ink: '#b91c1c',
    soft: '#fee2e2',
    border: '#fca5a5',
    Icon: ErrorIcon
  },
  default: { ink: '#4b5563', soft: '#f3f4f6', border: '#d1d5db', Icon: Info }
}

const DAY_MS = 24 * 60 * 60 * 1000

const Certificates: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const canBulkReassign = useCan(PERMISSIONS.CALIBRATION_FILE_BULK_REASSIGN)
  const canEditFile = useCan(PERMISSIONS.CALIBRATION_FILE_UPDATE)

  const queryClient = useQueryClient()
  const updateFileMutation = useUpdateFile()
  const bulkReassignMutation = useBulkReassignFileDevice()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const { data: certificateDataResponse, isLoading: loading } =
    useFile<DeviceDetailsProps>(id)
  const certificateData = certificateDataResponse ?? null

  const refreshCertificate = () => {
    queryClient.invalidateQueries(FILE_QUERY_KEYS.detail(id))
  }

  const refreshCertificateHistory = () => {
    queryClient.invalidateQueries(CERTIFICATE_HISTORY_QUERY_KEYS.byFile(id))
  }

  // Estado según la próxima calibración: vencido, por vencer (30 días) o activo
  const getCalibrationStatus = (): {
    label: string
    detail: string
    tone: StatusTone
  } => {
    if (!certificateData?.nextCalibrationDate) {
      return {
        label: 'Sin fecha',
        detail: 'No hay próxima calibración registrada',
        tone: 'default'
      }
    }
    const now = new Date()
    const nextDate = new Date(certificateData.nextCalibrationDate)
    const days = Math.ceil((nextDate.getTime() - now.getTime()) / DAY_MS)
    const plural = (n: number) => (n === 1 ? 'día' : 'días')
    if (days < 0) {
      const late = Math.abs(days)
      return {
        label: 'Vencido',
        detail: `Venció hace ${late} ${plural(late)}`,
        tone: 'error'
      }
    }
    if (days <= 30) {
      return {
        label: 'Próximo a vencer',
        detail: days === 0 ? 'Vence hoy' : `Vence en ${days} ${plural(days)}`,
        tone: 'warning'
      }
    }
    return {
      label: 'Activo',
      detail: `Vigente por ${days} ${plural(days)} más`,
      tone: 'success'
    }
  }

  const calibrationStatus = getCalibrationStatus()

  const handleUpdateSuccess = () => {
    refreshCertificate()
    refreshCertificateHistory()
    notify.success('Certificado actualizado exitosamente')
  }

  const handleSaveEdit = async (payload: Record<string, unknown>) => {
    try {
      const response = await updateFileMutation.mutateAsync({
        id: id as string,
        payload
      })
      if (response.status === 200) {
        notify.success('Datos del certificado actualizados')
        refreshCertificate()
      }
    } catch (error) {
      notify.error('No se pudieron actualizar los datos del certificado')
      throw error
    }
  }

  const handleBulkApply = async (
    sourceDeviceId: number,
    targetDeviceId: number
  ) => {
    const response = await bulkReassignMutation.mutateAsync({
      sourceDeviceId,
      targetDeviceId,
      customerId: certificateData?.customerId
    })
    refreshCertificate()
    refreshCertificateHistory()
    return Number(response.data?.updatedCount ?? 0)
  }

  if (loading) {
    return <SignalLoader message='Cargando certificado...' fullPage />
  }

  const missing = 'No especificado'

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title={certificateData?.device?.name || 'Detalles del equipo'}
        subtitle={certificateData?.customer?.nombre}
        icon={<Devices />}
        actions={
          <>
            <Button
              variant='outlined'
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={OUTLINE_BUTTON_SX}
            >
              Volver
            </Button>
            {canBulkReassign && (
              <>
                <Button
                  variant='outlined'
                  startIcon={<SwapHoriz />}
                  onClick={() => setBulkOpen(true)}
                  sx={OUTLINE_BUTTON_SX}
                >
                  Cambio masivo
                </Button>
                <Button
                  variant='contained'
                  startIcon={<Update />}
                  onClick={() => setIsModalOpen(true)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: '#00BFA5',
                    '&:hover': { bgcolor: '#00897B' }
                  }}
                >
                  Actualizar
                </Button>
              </>
            )}
          </>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={CARD_SX}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                mb: 2
              }}
            >
              <Typography variant='subtitle1' fontWeight={700}>
                Información del equipo
              </Typography>
              {canEditFile && (
                <Button
                  variant='outlined'
                  size='small'
                  startIcon={<Edit />}
                  onClick={() => setEditOpen(true)}
                  sx={OUTLINE_BUTTON_SX}
                >
                  Editar datos
                </Button>
              )}
            </Box>
            <DetailSection title='Equipo y empresa'>
              <DetailCell>
                <DetailField label='Empresa'>
                  {certificateData?.customer?.nombre || missing}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Equipo'>
                  {certificateData?.device?.name || missing}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Serie'>
                  {certificateData?.serie || missing}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Activo fijo'>
                  {certificateData?.activoFijo || missing}
                </DetailField>
              </DetailCell>
            </DetailSection>
            <DetailSection title='Ubicación'>
              <DetailCell>
                <DetailField label='Sede'>
                  {certificateData?.headquarter?.toUpperCase() || missing}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Ciudad'>
                  {certificateData?.city || missing}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Ubicación'>
                  {certificateData?.location || missing}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Dirección'>
                  {certificateData?.sede || missing}
                </DetailField>
              </DetailCell>
            </DetailSection>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={CARD_SX}>
            <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 2 }}>
              Estado de calibración
            </Typography>
            <Box
              role='status'
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: '12px',
                textAlign: 'center',
                bgcolor: STATUS_STYLE[calibrationStatus.tone].soft,
                border: `1px solid ${STATUS_STYLE[calibrationStatus.tone].border}`,
                color: STATUS_STYLE[calibrationStatus.tone].ink
              }}
            >
              {React.createElement(STATUS_STYLE[calibrationStatus.tone].Icon, {
                sx: { fontSize: 40, mb: 0.5 },
                'aria-hidden': true
              })}
              <Typography variant='h6' component='p' fontWeight={700}>
                {calibrationStatus.label}
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                {calibrationStatus.detail}
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <DetailField label='Última calibración'>
                {formatDateOnly(certificateData?.calibrationDate) ||
                  'No especificada'}
              </DetailField>
              <Box>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block' }}
                >
                  Próxima calibración
                </Typography>
                <Typography
                  variant='body2'
                  component='div'
                  sx={{
                    fontWeight: 600,
                    color: STATUS_STYLE[calibrationStatus.tone].ink
                  }}
                >
                  {formatDateOnly(certificateData?.nextCalibrationDate) ||
                    'No especificada'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={0} sx={CARD_SX}>
            <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 2 }}>
              Certificados y documentos
            </Typography>
            <CertificatesList />
          </Paper>
        </Grid>
      </Grid>

      <UpdateCertificateModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleUpdateSuccess}
        id={id}
      />

      <CertificateEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={{
          deviceId: certificateData?.deviceId ?? null,
          city: certificateData?.city ?? '',
          location: certificateData?.location ?? '',
          sede: certificateData?.sede ?? '',
          activoFijo: certificateData?.activoFijo ?? '',
          serie: certificateData?.serie ?? '',
          calibrationDate: (certificateData?.calibrationDate ?? '').slice(0, 10)
        }}
        onSave={handleSaveEdit}
      />

      <BulkReassignDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        customerId={certificateData?.customerId}
        customerName={certificateData?.customer?.nombre}
        currentDeviceId={certificateData?.deviceId}
        onApply={handleBulkApply}
      />
    </Container>
  )
}

export default Certificates
