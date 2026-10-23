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
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              minWidth: '200px'
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
              <Visibility fontSize='small' />
            </ListItemIcon>
            Ver
          </MuiMenuItem>
        )}

        {canViewMaintenance && (
          <MuiMenuItem
            component={Link}
            to={`${row.original.id}/inspection-maintenance`}
            onClick={handleMenuClose}
          >
            <ListItemIcon>
              <Engineering fontSize='small' />
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
            <ExitToApp fontSize='small' />
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
              <Download fontSize='small' />
            </ListItemIcon>
            Descargar Factura
          </MuiMenuItem>
        )}

        <Divider />

        {canUpdateDataSheet && (
          <MuiMenuItem onClick={handleEdit}>
            <ListItemIcon>
              <Edit fontSize='small' />
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
          >
            <ListItemIcon>
              <Delete fontSize='small' />
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
