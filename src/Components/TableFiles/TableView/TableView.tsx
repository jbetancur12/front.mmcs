import { MaterialReactTable } from 'material-react-table'
import { FileData } from '../types/fileTypes'
import { createTableColumns } from './tableColumns'
import { useMemo, useState } from 'react'
import { useValidation } from '../hooks/useValidation'
import { Link } from 'react-router-dom'
import { Box, Button, IconButton, Tooltip } from '@mui/material'
import { Delete, FileDownload, Visibility } from '@mui/icons-material'
import { userStore } from '@stores/userStore'
import { useStore } from '@nanostores/react'
import { useFileActions } from '../hooks/useFileActions'
import useAxiosPrivate from '@utils/use-axios-private'
import { handleDownload } from '../utils/fileHandlers'
import PDFViewer from 'src/Components/PDFViewer'

interface TableViewProps {
  data: FileData[]
  fetchFiles: () => Promise<void>
  axiosPrivate: ReturnType<typeof useAxiosPrivate>
  openModal: React.Dispatch<React.SetStateAction<boolean>>
}

export const TableView = ({
  data,
  fetchFiles,
  axiosPrivate,
  openModal
}: TableViewProps) => {
  const $userStore = useStore(userStore)
  const { handleDeleteRow } = useFileActions(axiosPrivate, fetchFiles)
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string
  }>({})
  const { getCommonEditTextFieldProps } = useValidation(
    validationErrors,
    setValidationErrors
  )

  const columns = useMemo(
    () => createTableColumns(getCommonEditTextFieldProps),
    [getCommonEditTextFieldProps]
  )

  return (
    <MaterialReactTable
      columns={columns}
      data={data}
      positionActionsColumn='first'
      enableRowActions={true}
      renderRowActions={({ row }) => {
        return (
          <Box sx={{ display: 'flex', gap: '1rem' }}>
            {$userStore.rol.some((role) => ['admin'].includes(role)) && (
              <Tooltip arrow placement='right' title='Delete'>
                <IconButton
                  color='error'
                  onClick={() => handleDeleteRow(Number(row.original.id))}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip arrow placement='left' title='Descargar'>
              <IconButton
                onClick={() =>
                  handleDownload(row.original.filePath, axiosPrivate)
                }
              >
                <FileDownload />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement='left' title='Ver archivos'>
              <Link to={`${row.original.id}`}>
                <Visibility />
              </Link>
            </Tooltip>
          </Box>
        )
      }}
      renderTopToolbarCustomActions={() => {
        if (
          $userStore.rol.some(
            (role) => !['admin', 'metrologist'].includes(role)
          )
        )
          return
        return (
          <Button
            onClick={() => openModal(true)}
            variant='contained'
            sx={{
              fontWeight: 'bold',
              color: '#DCFCE7'
            }}
          >
            Subir Nuevo Certificado
          </Button>
        )
      }}
      renderDetailPanel={({ row }) => {
        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              maxWidth: '1000px'
            }}
          >
            <PDFViewer path={row.original.filePath} />
          </Box>
        )
      }}
      displayColumnDefOptions={{
        'mrt-row-actions': {
          muiTableHeadCellProps: {
            align: 'center'
          },
          size: 120
        }
      }}
    />
  )
}
