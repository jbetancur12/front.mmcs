import React, { useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
  Container
} from '@mui/material'
import {
  CloudUpload,
  Close,
  Delete,
  Edit,
  PictureAsPdf,
  Visibility
} from '@mui/icons-material'
import { type MRT_Cell, type MRT_ColumnDef } from 'material-react-table'
import toast from 'react-hot-toast'
import PDFViewer from '../Components/PDFViewer.js'
import {
  TraceabilityDocument,
  useTraceabilities,
  useTraceabilityMutations
} from '@hooks/traceability/useTraceabilities'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { formatDateOnly } from '@utils/dateOnly'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import EmptyState from 'src/Components/Common/EmptyState'
import FormDialog, { FormDialogSection } from 'src/Components/Common/FormDialog'
import FileDropZone from 'src/Components/Common/FileDropZone'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'

import { logger } from 'src/utils/logger'
const TEAL_BUTTON_SX = {
  textTransform: 'none',
  fontWeight: 600,
  bgcolor: '#00BFA5',
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: '#00897B' }
} as const

const Traceability: React.FC = () => {
  const canManageTraceability = useCan(
    PERMISSIONS.CALIBRATION_TRACEABILITY_MANAGE
  )
  const { data: traceabilities = [], isLoading: loading } = useTraceabilities()
  const { createTraceability, updateTraceability, deleteTraceability } =
    useTraceabilityMutations()

  // Crear
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [createSubmitted, setCreateSubmitted] = useState(false)
  // Reemplazar el PDF
  const [updateTarget, setUpdateTarget] = useState<TraceabilityDocument | null>(
    null
  )
  const [updateFile, setUpdateFile] = useState<File | null>(null)
  // Eliminar y ver
  const [deleteTarget, setDeleteTarget] = useState<TraceabilityDocument | null>(
    null
  )
  const [previewTarget, setPreviewTarget] =
    useState<TraceabilityDocument | null>(null)
  // Progreso de subida (crear o reemplazar)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const closeCreate = () => {
    if (isUploading) return
    setCreateOpen(false)
    setNewName('')
    setNewFile(null)
    setCreateSubmitted(false)
    setUploadProgress(0)
  }

  const closeUpdate = () => {
    if (isUploading) return
    setUpdateTarget(null)
    setUpdateFile(null)
    setUploadProgress(0)
  }

  const handleCreate = async () => {
    setCreateSubmitted(true)
    if (!newName.trim() || !newFile) return

    const formData = new FormData()
    formData.append('name', newName)
    formData.append('file', newFile as Blob)

    try {
      setIsUploading(true)
      setUploadProgress(0)
      await createTraceability.mutateAsync({
        formData,
        onProgress: setUploadProgress
      })
      toast.success('Documento de trazabilidad creado con éxito')
      setIsUploading(false)
      closeCreate()
    } catch (error) {
      logger.error('Error al crear la trazabilidad:', error)
      toast.error('Error al crear el documento')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdate = async () => {
    if (!updateFile || !updateTarget) {
      toast.error('Selecciona el PDF nuevo para reemplazar el documento.')
      return
    }

    const formData = new FormData()
    formData.append('file', updateFile)

    try {
      setIsUploading(true)
      setUploadProgress(0)
      await updateTraceability.mutateAsync({
        id: updateTarget.id,
        formData,
        onProgress: setUploadProgress
      })
      toast.success('Documento actualizado con éxito')
      setIsUploading(false)
      closeUpdate()
    } catch (error) {
      logger.error('Error al actualizar el PDF:', error)
      toast.error('Error al actualizar el documento')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await deleteTraceability.mutateAsync(deleteTarget.id)
      if (response.status >= 200 && response.status < 300) {
        toast.success('Documento eliminado correctamente')
      }
      setDeleteTarget(null)
    } catch (error) {
      logger.error('Error al eliminar la trazabilidad:', error)
      toast.error('No se pudo eliminar el documento. Inténtalo de nuevo.')
    }
  }

  const rejectFile = (message: string) => toast.error(message)

  const columns = useMemo<MRT_ColumnDef<TraceabilityDocument>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Documento',
        size: 320,
        Cell: ({ cell }: { cell: MRT_Cell<TraceabilityDocument> }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: '#00BFA5' }}
              aria-hidden
            >
              <PictureAsPdf sx={{ fontSize: 18 }} />
            </Avatar>
            <Typography fontWeight={600}>{cell.getValue<string>()}</Typography>
          </Box>
        )
      },
      {
        accessorKey: 'createdAt',
        header: 'Fecha de creación',
        size: 160,
        Cell: ({ cell }: { cell: MRT_Cell<TraceabilityDocument> }) =>
          formatDateOnly(cell.getValue<string>()) ?? '—'
      }
    ],
    []
  )

  const createDisabledReason =
    createSubmitted && !newName.trim()
      ? 'Escribe el nombre del documento'
      : undefined

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>

      <LmsPageHeader
        title='Trazabilidades'
        subtitle='Documentos de trazabilidad de los patrones y equipos'
        icon={<PictureAsPdf />}
        actions={
          canManageTraceability && (
            <Button
              variant='contained'
              startIcon={<CloudUpload />}
              onClick={() => setCreateOpen(true)}
              sx={TEAL_BUTTON_SX}
            >
              Crear documento
            </Button>
          )
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Documentos'
            value={traceabilities.length}
            icon={<PictureAsPdf />}
            tone='teal'
          />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        data={traceabilities}
        itemLabel={['documento', 'documentos']}
        searchPlaceholder='Buscar documentos'
        enableRowActions
        state={{ isLoading: loading }}
        initialState={{ density: 'compact' }}
        displayColumnDefOptions={{
          'mrt-row-actions': { header: 'Acciones', size: 140 }
        }}
        renderEmptyRowsFallback={() => (
          <EmptyState
            compact
            icon={<PictureAsPdf />}
            title='No hay documentos de trazabilidad'
            hint='Crea el primer documento o ajusta la búsqueda.'
            action={
              canManageTraceability ? (
                <Button
                  variant='contained'
                  startIcon={<CloudUpload />}
                  onClick={() => setCreateOpen(true)}
                  sx={TEAL_BUTTON_SX}
                >
                  Crear documento
                </Button>
              ) : undefined
            }
          />
        )}
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex' }}>
            <Tooltip title='Ver'>
              <IconButton
                size='small'
                aria-label={`Ver documento ${row.original.name}`}
                sx={{ color: '#00695C' }}
                onClick={() => setPreviewTarget(row.original)}
              >
                <Visibility fontSize='small' />
              </IconButton>
            </Tooltip>
            {canManageTraceability && (
              <>
                <Tooltip title='Reemplazar PDF'>
                  <IconButton
                    size='small'
                    aria-label={`Reemplazar el PDF de ${row.original.name}`}
                    sx={{ color: '#2563eb' }}
                    onClick={() => setUpdateTarget(row.original)}
                  >
                    <Edit fontSize='small' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Eliminar'>
                  <IconButton
                    size='small'
                    aria-label={`Eliminar documento ${row.original.name}`}
                    color='error'
                    onClick={() => setDeleteTarget(row.original)}
                  >
                    <Delete fontSize='small' />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        )}
      />

      <FormDialog
        open={createOpen}
        onClose={closeCreate}
        title='Crear documento'
        subtitle='Sube el PDF de trazabilidad'
        submitLabel='Crear documento'
        onSubmit={handleCreate}
        loading={isUploading}
        maxWidth='sm'
      >
        <FormDialogSection title='Documento'>
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              fullWidth
              label='Nombre del documento'
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              error={Boolean(createDisabledReason)}
              helperText={createDisabledReason}
              disabled={isUploading}
            />
          </Box>
          <Box sx={{ gridColumn: '1 / -1' }}>
            <FileDropZone
              file={newFile}
              onFileSelected={setNewFile}
              onReject={rejectFile}
              accept='application/pdf'
              acceptLabel='PDF'
              maxSizeMb={10}
              disabled={isUploading}
            />
            {createSubmitted && !newFile && (
              <Typography
                variant='caption'
                color='error'
                sx={{ display: 'block', mt: 0.5 }}
              >
                Selecciona el archivo PDF
              </Typography>
            )}
          </Box>
          {isUploading && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <LinearProgress
                variant='determinate'
                value={uploadProgress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#E0F7F4',
                  '& .MuiLinearProgress-bar': { bgcolor: '#00BFA5' }
                }}
              />
              <Typography variant='caption' color='text.secondary'>
                Subiendo… {uploadProgress}%
              </Typography>
            </Box>
          )}
        </FormDialogSection>
      </FormDialog>

      <FormDialog
        open={Boolean(updateTarget)}
        onClose={closeUpdate}
        title='Reemplazar el PDF'
        subtitle={updateTarget?.name}
        submitLabel='Actualizar documento'
        onSubmit={handleUpdate}
        loading={isUploading}
        maxWidth='sm'
      >
        <FormDialogSection
          title='Nuevo archivo'
          description='El documento conserva su nombre; solo cambia el PDF.'
        >
          <Box sx={{ gridColumn: '1 / -1' }}>
            <FileDropZone
              file={updateFile}
              onFileSelected={setUpdateFile}
              onReject={rejectFile}
              accept='application/pdf'
              acceptLabel='PDF'
              maxSizeMb={10}
              disabled={isUploading}
              inputKey={updateTarget?.id}
            />
          </Box>
          {isUploading && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <LinearProgress
                variant='determinate'
                value={uploadProgress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#E0F7F4',
                  '& .MuiLinearProgress-bar': { bgcolor: '#00BFA5' }
                }}
              />
              <Typography variant='caption' color='text.secondary'>
                Subiendo… {uploadProgress}%
              </Typography>
            </Box>
          )}
        </FormDialogSection>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        tone='danger'
        title='Eliminar documento'
        message={
          <>
            Vas a eliminar <strong>{deleteTarget?.name}</strong>
            {deleteTarget
              ? `, creado el ${formatDateOnly(deleteTarget.createdAt) ?? '—'}`
              : ''}
            . Esta acción no se puede deshacer.
          </>
        }
        confirmLabel='Eliminar'
        loading={deleteTraceability.isLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Dialog
        open={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        maxWidth='lg'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 1
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='h6' component='span' fontWeight={700}>
              {previewTarget?.name || 'Documento PDF'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {previewTarget
                ? `Creado el ${formatDateOnly(previewTarget.createdAt) ?? '—'}`
                : 'Vista previa del documento'}
            </Typography>
          </Box>
          <IconButton
            aria-label='Cerrar'
            edge='end'
            onClick={() => setPreviewTarget(null)}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}
        >
          {previewTarget && (
            <Box
              sx={{
                flex: 1,
                width: '100%',
                minHeight: 600,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <PDFViewer
                path={previewTarget.filePath}
                bucket='traceabilities'
                view='preview'
                buttons={false}
                allowDownload={false}
                allowOpen={false}
                downloadUrl={`/traceabilities/${previewTarget.id}/download`}
                disableContextMenu
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  )
}

export default Traceability
