import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Tab,
  Tabs,
  Tooltip,
  IconButton
} from '@mui/material'
import {
  AddRounded,
  DeleteOutline,
  DescriptionOutlined,
  EditOutlined,
  FileDownloadOutlined,
  HistoryRounded,
  LocalLibraryOutlined,
  UploadFileOutlined,
  VisibilityOutlined
} from '@mui/icons-material'
import { useStore } from '@nanostores/react'
import { MRT_ColumnDef } from 'material-react-table'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import DataTable from 'src/Components/Common/DataTable'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'
import EmptyState from 'src/Components/Common/EmptyState'
import SignalLoader from 'src/Components/Common/SignalLoader'
import LibraryDocumentDialog, {
  LibraryDialogMode
} from 'src/Components/Library/LibraryDocumentDialog'
import LibraryHistoryDialog from 'src/Components/Library/LibraryHistoryDialog'
import LibraryPdfDialog from 'src/Components/Library/LibraryPdfDialog'
import { formatLibraryDate } from 'src/Components/Library/libraryFormat'
import {
  LIBRARY_CATEGORY_LABELS,
  LibraryCategory,
  LibraryDocument,
  LibraryDocumentForm
} from 'src/Components/Library/Library.types'
import { hasPermission, PERMISSIONS } from 'src/constants/permissions'
import {
  downloadLibraryPdf,
  downloadLibrarySource
} from 'src/Components/Library/libraryDownloads'
import {
  useDeleteLibraryDocument,
  useLibraryDocuments,
  useSaveLibraryDocument
} from 'src/hooks/library/useLibraryDocuments'
import { userStore } from 'src/store/userStore'
import { getApiErrorReason } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'

const CATEGORIES: LibraryCategory[] = ['management', 'technical']

interface DialogState {
  mode: LibraryDialogMode
  document: LibraryDocument | null
}

const Library: React.FC = () => {
  const $userStore = useStore(userStore)
  const canManage = hasPermission(
    $userStore.permissions,
    PERMISSIONS.LIBRARY_DOCUMENT_MANAGE
  )
  const canDownloadSource = hasPermission(
    $userStore.permissions,
    PERMISSIONS.LIBRARY_SOURCE_DOWNLOAD
  )

  const [category, setCategory] = useState<LibraryCategory>('management')
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [viewing, setViewing] = useState<LibraryDocument | null>(null)
  const [history, setHistory] = useState<LibraryDocument | null>(null)
  const [deleting, setDeleting] = useState<LibraryDocument | null>(null)

  const { data: documents = [], isLoading } = useLibraryDocuments(category)
  const save = useSaveLibraryDocument()
  const remove = useDeleteLibraryDocument()

  const handleSubmit = (form: LibraryDocumentForm) => {
    if (!dialog) return
    const document = dialog.document
    const action =
      dialog.mode === 'create' || !document
        ? ({ type: 'create', category, form } as const)
        : ({ type: dialog.mode, id: document.id, form } as const)
    save.mutate(action, {
      onSuccess: () => {
        notify.success(
          dialog.mode === 'create'
            ? 'Documento agregado'
            : dialog.mode === 'version'
              ? 'Versión nueva publicada'
              : 'Documento actualizado'
        )
        setDialog(null)
      },
      onError: (error) =>
        notify.error(
          'No se pudo guardar el documento',
          getApiErrorReason(error) ?? undefined
        )
    })
  }

  const handleDelete = () => {
    if (!deleting) return
    remove.mutate(deleting.id, {
      onSuccess: () => {
        notify.success('Documento eliminado')
        setDeleting(null)
      },
      onError: (error) =>
        notify.error(
          'No se pudo eliminar el documento',
          getApiErrorReason(error) ?? undefined
        )
    })
  }

  const columns = useMemo<MRT_ColumnDef<LibraryDocument>[]>(
    () => [
      { accessorKey: 'name', header: 'Nombre del documento', size: 320 },
      { accessorKey: 'version', header: 'Versión', size: 100 },
      {
        accessorKey: 'documentDate',
        header: 'Fecha de actualización',
        size: 180,
        Cell: ({ cell }) => formatLibraryDate(cell.getValue<string>())
      }
    ],
    []
  )

  const addButton = canManage && (
    <Button
      variant='contained'
      startIcon={<AddRounded />}
      onClick={() => setDialog({ mode: 'create', document: null })}
      sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00ACC1' } }}
    >
      Agregar documento
    </Button>
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Biblioteca'
        subtitle='Documentos de gestión y técnicos vigentes del laboratorio'
        icon={<LocalLibraryOutlined />}
        actions={addButton || undefined}
      />

      <Tabs
        value={category}
        onChange={(_event, value: LibraryCategory) => setCategory(value)}
        sx={{
          mb: 2,
          '& .MuiTabs-indicator': { backgroundColor: '#00BFA5' },
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }
        }}
      >
        {CATEGORIES.map((value) => (
          <Tab
            key={value}
            value={value}
            label={LIBRARY_CATEGORY_LABELS[value]}
          />
        ))}
      </Tabs>

      {isLoading ? (
        <SignalLoader message='Cargando documentos' />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<UploadFileOutlined />}
          title={`Aún no hay ${LIBRARY_CATEGORY_LABELS[category].toLowerCase()}`}
          hint={
            canManage
              ? 'Agrega el primer documento con el botón Agregar documento.'
              : 'Cuando se publique uno aparecerá aquí.'
          }
          action={addButton || undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={documents}
          itemLabel={['documento', 'documentos']}
          searchPlaceholder='Buscar documentos'
          enableRowActions
          positionActionsColumn='last'
          displayColumnDefOptions={{
            'mrt-row-actions': {
              header: 'Acciones',
              size: 100 + (canManage ? 160 : 0) + (canDownloadSource ? 40 : 0)
            }
          }}
          renderRowActions={({ row }) => {
            const document = row.original
            return (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title='Ver'>
                  <IconButton
                    aria-label={`Ver ${document.name}`}
                    sx={{ color: '#00695C' }}
                    onClick={() => setViewing(document)}
                  >
                    <VisibilityOutlined fontSize='small' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Descargar PDF'>
                  <IconButton
                    aria-label={`Descargar PDF de ${document.name}`}
                    onClick={() => downloadLibraryPdf(document)}
                  >
                    <FileDownloadOutlined fontSize='small' />
                  </IconButton>
                </Tooltip>
                {canDownloadSource && document.hasSource && (
                  <Tooltip title='Descargar archivo original (Word o Excel)'>
                    <IconButton
                      aria-label={`Descargar archivo original de ${document.name}`}
                      sx={{ color: '#2563eb' }}
                      onClick={() => downloadLibrarySource(document)}
                    >
                      <DescriptionOutlined fontSize='small' />
                    </IconButton>
                  </Tooltip>
                )}
                {canManage && (
                  <>
                    <Tooltip title='Subir nueva versión'>
                      <IconButton
                        aria-label={`Subir nueva versión de ${document.name}`}
                        sx={{ color: '#00897B' }}
                        onClick={() => setDialog({ mode: 'version', document })}
                      >
                        <UploadFileOutlined fontSize='small' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Historial de versiones'>
                      <IconButton
                        aria-label={`Historial de ${document.name}`}
                        onClick={() => setHistory(document)}
                      >
                        <HistoryRounded fontSize='small' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Editar'>
                      <IconButton
                        aria-label={`Editar ${document.name}`}
                        sx={{ color: '#2563eb' }}
                        onClick={() => setDialog({ mode: 'edit', document })}
                      >
                        <EditOutlined fontSize='small' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Eliminar'>
                      <IconButton
                        aria-label={`Eliminar ${document.name}`}
                        color='error'
                        onClick={() => setDeleting(document)}
                      >
                        <DeleteOutline fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            )
          }}
        />
      )}

      <LibraryDocumentDialog
        open={dialog !== null}
        mode={dialog?.mode ?? 'create'}
        document={dialog?.document}
        categoryLabel={LIBRARY_CATEGORY_LABELS[category]}
        loading={save.isLoading}
        onClose={() => setDialog(null)}
        onSubmit={handleSubmit}
      />
      <LibraryPdfDialog document={viewing} onClose={() => setViewing(null)} />
      <LibraryHistoryDialog
        document={history}
        onClose={() => setHistory(null)}
        onView={setViewing}
        canDownloadSource={canDownloadSource}
      />
      <ConfirmDialog
        open={deleting !== null}
        title='Eliminar documento'
        message={`Se eliminará "${deleting?.name}" con todas sus versiones. Dejará de aparecer en la biblioteca.`}
        confirmLabel='Eliminar'
        tone='danger'
        loading={remove.isLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </Container>
  )
}

export default Library
