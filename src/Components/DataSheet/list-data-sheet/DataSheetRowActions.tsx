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
import { type MRT_Row, type MRT_TableInstance } from 'material-react-table'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

import {
  chooseEditOption,
  isCancelDismiss,
  openEditImageDialog,
  openUploadInvoiceDialog
} from './dataSheetDialogs'
import { DataSheetData } from './types'
import { DataSheetActions } from './useDataSheetActions'

interface DataSheetRowActionsProps {
  row: MRT_Row<DataSheetData>
  table: MRT_TableInstance<DataSheetData>
  actions: DataSheetActions
  onDelete: (row: MRT_Row<DataSheetData>) => void
}

const DataSheetRowActions = ({
  row,
  table,
  actions,
  onDelete
}: DataSheetRowActionsProps) => {
  const canViewDetail = useCan(PERMISSIONS.CALIBRATION_DATASHEET_DETAIL)
  const canViewMaintenance = useCan(
    PERMISSIONS.CALIBRATION_INSPECTION_MAINTENANCE_VIEW
  )
  const canUpdateDataSheet = useCan(PERMISSIONS.CALIBRATION_DATASHEET_UPDATE)
  const canDeleteDataSheet = useCan(PERMISSIONS.CALIBRATION_DATASHEET_DELETE)
  const [localAnchorEl, setLocalAnchorEl] = useState<null | HTMLElement>(null)

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
    chooseEditOption().then((result) => {
      if (result.isConfirmed) {
        openEditImageDialog((image) => actions.handleUpload({ id, image }))
      } else if (isCancelDismiss(result.dismiss)) {
        table.setEditingRow(row)
      } else if (result.isDenied) {
        openUploadInvoiceDialog((pdfFile) =>
          actions.handleUploadPdf(id, pdfFile)
        )
      }
    })
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <IconButton onClick={handleMenuOpen}>
        <MoreVert />
      </IconButton>

      <Menu
        anchorEl={localAnchorEl}
        open={Boolean(localAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        slotProps={{
          paper: {
            sx: {
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              minWidth: '200px'
            }
          }
        }}
        disablePortal
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
            Inspection/Maintenance
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
          In/Out
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
    </Box>
  )
}

export default DataSheetRowActions
