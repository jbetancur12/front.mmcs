import { useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { AxiosError, AxiosResponse, isAxiosError } from 'axios'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import {
  DeleteOutline,
  FileDownloadOutlined,
  PictureAsPdfOutlined,
  TaskOutlined
} from '@mui/icons-material'
import type { MRT_ColumnDef } from 'material-react-table'

import SignalLoader from 'src/Components/Common/SignalLoader'
import DataTable from 'src/Components/Common/DataTable'
import EmptyState from 'src/Components/Common/EmptyState'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'
import { notify } from 'src/utils/notify'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  CertificateHistoryItem,
  useCertificateHistory,
  useDeleteCertificateHistory
} from '@hooks/certificates/useCertificateHistory'
import PDFViewer from './PDFViewer'

import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { logger } from 'src/utils/logger'
import { neutral, intent } from 'src/theme/designTokens'

type Certificate = CertificateHistoryItem

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

/** Historial de certificados de un equipo: una fila por certificado, con la vista previa del PDF al expandirla. */
function CertificatesList() {
  const axiosPrivate = useAxiosPrivate()
  const { id } = useParams<{ id: string }>()
  const { data: certificatesData, isLoading: loading } =
    useCertificateHistory(id)
  const certificates: Certificate[] = useMemo(
    () => certificatesData ?? [],
    [certificatesData]
  )
  const deleteCertificateMutation = useDeleteCertificateHistory()
  const [deleteTarget, setDeleteTarget] = useState<Certificate | null>(null)

  const canDeleteCertificate = useCan(
    PERMISSIONS.CALIBRATION_CERTIFICATE_HISTORY_DELETE
  )

  const columns = useMemo<MRT_ColumnDef<Certificate>[]>(
    () => [
      {
        accessorKey: 'filePath',
        header: 'Archivo',
        size: 420,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PictureAsPdfOutlined
              fontSize='small'
              sx={{ color: intent.danger, flexShrink: 0 }}
            />
            <Typography
              variant='body2'
              sx={{ fontWeight: 600, wordBreak: 'break-word' }}
            >
              {row.original.filePath}
            </Typography>
          </Box>
        )
      },
      {
        // Se ordena por la fecha real, no por el texto largo
        id: 'calibrationDate',
        header: 'Fecha de calibración',
        size: 220,
        accessorFn: (row) => new Date(row.calibrationDate).getTime(),
        Cell: ({ row }) => formatDate(row.original.calibrationDate)
      }
    ],
    []
  )

  const handleDownload = async (filePath: string) => {
    try {
      const response: AxiosResponse<Blob> = await axiosPrivate.get(
        `/files/download/${filePath}`,
        { responseType: 'blob' }
      )

      if (response.status >= 200 && response.status < 300) {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filePath)
        document.body.appendChild(link)
        link.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const axiosError = error as AxiosError
        notify.error(
          `Error al descargar el archivo: ${
            axiosError.response
              ? axiosError.response.statusText
              : axiosError.message
          }`
        )
      } else {
        notify.error('Error desconocido al descargar el archivo')
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await deleteCertificateMutation.mutateAsync(
        deleteTarget.id
      )
      if (response.status === 200) {
        notify.success('Certificado eliminado con éxito')
      }
    } catch (error) {
      logger.error('Error al eliminar el certificado:', error)
    } finally {
      setDeleteTarget(null)
    }
  }

  if (loading) {
    return <SignalLoader message='Cargando certificados...' size='small' />
  }

  return (
    <>
      {certificates.length === 0 ? (
        <EmptyState
          compact
          icon={<TaskOutlined />}
          title='No hay certificados para este equipo'
          hint='Cuando se suba uno, aparecerá aquí con su fecha de calibración.'
        />
      ) : (
        <DataTable<Certificate>
          columns={columns}
          data={certificates}
          itemLabel={['certificado', 'certificados']}
          searchPlaceholder='Buscar certificados'
          enableColumnFilters={false}
          initialState={{
            sorting: [{ id: 'calibrationDate', desc: true }]
          }}
          muiTableContainerProps={{ sx: { maxHeight: 'none' } }}
          // Al expandir una fila se ve el PDF debajo
          renderDetailPanel={({ row }) => (
            <Box
              sx={{
                width: '100%',
                backgroundColor: neutral.surfaceAlt,
                border: `1px solid ${neutral.border}`,
                borderRadius: '12px',
                p: 2
              }}
            >
              <PDFViewer
                path={row.original.filePath}
                buttons={false}
                compactActions
              />
            </Box>
          )}
          enableRowActions
          renderRowActions={({ row }) => (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip arrow placement='top' title='Descargar'>
                <IconButton
                  size='small'
                  aria-label='Descargar certificado'
                  sx={{ color: intent.action }}
                  onClick={() => handleDownload(row.original.filePath)}
                >
                  <FileDownloadOutlined fontSize='small' />
                </IconButton>
              </Tooltip>
              {canDeleteCertificate && (
                <Tooltip arrow placement='top' title='Eliminar'>
                  <IconButton
                    size='small'
                    color='error'
                    aria-label='Eliminar certificado'
                    onClick={() => setDeleteTarget(row.original)}
                  >
                    <DeleteOutline fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title='Eliminar certificado'
        tone='danger'
        message={
          <>
            Vas a eliminar <strong>{deleteTarget?.filePath}</strong>. Esta
            acción no se puede deshacer.
          </>
        }
        confirmLabel='Eliminar'
        loading={deleteCertificateMutation.isLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  )
}

export default CertificatesList
