import {
  Delete,
  Download,
  Edit,
  Engineering,
  ExitToApp,
  MoreVert,
  Visibility
} from '@mui/icons-material'
import {
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem as MuiMenuItem
} from '@mui/material'
import { type MRT_Row } from 'material-react-table'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

import DataSheetEditDialogs, { type EditStep } from './DataSheetEditDialogs'
import { DataSheetData } from './types'
import { DataSheetActions } from './useDataSheetActions'

interface DataSheetRowActionsProps {
  row: MRT_Row<DataSheetData>
  actions: DataSheetActions
  onDelete: (row: MRT_Row<DataSheetData>) => void
  /** Abre la edición de los datos de la hoja de vida. */
  onEditData: (row: DataSheetData) => void
}

const DataSheetRowActions = ({
  row,
  actions,
  onDelete,
  onEditData
}: DataSheetRowActionsProps) => {
  const canViewDetail = useCan(PERMISSIONS.CALIBRATION_DATASHEET_DETAIL)
  const canViewMaintenance = useCan(
    PERMISSIONS.CALIBRATION_INSPECTION_MAINTENANCE_VIEW
  )
  const canUpdateDataSheet = useCan(PERMISSIONS.CALIBRATION_DATASHEET_UPDATE)
  const canDeleteDataSheet = useCan(PERMISSIONS.CALIBRATION_DATASHEET_DELETE)
  const [localAnchorEl, setLocalAnchorEl] = useState<null | HTMLElement>(null)
  const [editStep, setEditStep] = useState<EditStep>(null)

  const id = row.original.id as number

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setLocalAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setLocalAnchorEl(null)
  }

  const handleEdit = () => {
    handleMenuClose()
    setEditStep('options')
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <IconButton aria-label='Más acciones' onClick={handleMenuOpen}>
        <MoreVert />
      </IconButton>

      <Menu
        anchorEl={localAnchorEl}
        open={Boolean(localAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 230,
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 8px 24px rgba(17, 24, 39, 0.10)',
              '& .MuiMenuItem-root': {
                fontSize: 14,
                fontWeight: 500,
                py: 1,
                gap: 0.5,
                '&:hover': { bgcolor: '#f6fcfb' }
              }
            }
          }
        }}
      >
        {canViewDetail && (
          <MuiMenuItem
            component={Link}
            to={`${row.original.id}`}
            onClick={handleMenuClose}
          >
            <ListItemIcon>
              <Visibility fontSize='small' sx={{ color: '#00695C' }} />
            </ListItemIcon>
            Ver hoja de vida
          </MuiMenuItem>
        )}

        {canViewMaintenance && (
          <MuiMenuItem
            component={Link}
            to={`${row.original.id}/inspection-maintenance`}
            onClick={handleMenuClose}
          >
            <ListItemIcon>
              <Engineering fontSize='small' sx={{ color: '#00695C' }} />
            </ListItemIcon>
            Inspección y mantenimiento
          </MuiMenuItem>
        )}

        <MuiMenuItem
          component={Link}
          to={`${row.original.id}/in-out`}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <ExitToApp fontSize='small' sx={{ color: '#00695C' }} />
          </ListItemIcon>
          Entrada y salida
        </MuiMenuItem>

        {row.original.invoiceUrl && canViewDetail && (
          <MuiMenuItem
            onClick={() => {
              handleMenuClose()
              actions.handleDownloadPdf(id)
            }}
          >
            <ListItemIcon>
              <Download fontSize='small' sx={{ color: '#00695C' }} />
            </ListItemIcon>
            Descargar factura
          </MuiMenuItem>
        )}

        <Divider sx={{ my: 0.5 }} />

        {canUpdateDataSheet && (
          <MuiMenuItem onClick={handleEdit}>
            <ListItemIcon>
              <Edit fontSize='small' sx={{ color: '#2563eb' }} />
            </ListItemIcon>
            Editar
          </MuiMenuItem>
        )}

        {canDeleteDataSheet && (
          <MuiMenuItem
            onClick={() => {
              onDelete(row)
              handleMenuClose()
            }}
            sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fef2f2' } }}
          >
            <ListItemIcon>
              <Delete fontSize='small' sx={{ color: '#dc2626' }} />
            </ListItemIcon>
            Eliminar
          </MuiMenuItem>
        )}
      </Menu>

      <DataSheetEditDialogs
        step={editStep}
        onClose={() => setEditStep(null)}
        onStepChange={setEditStep}
        equipmentName={row.original.equipmentName as string | undefined}
        onUploadImage={(image) => actions.handleUpload({ id, image })}
        onUploadInvoice={(pdfFile) => actions.handleUploadPdf(id, pdfFile)}
        onEditOther={() => onEditData(row.original)}
      />
    </Box>
  )
}

export default DataSheetRowActions
