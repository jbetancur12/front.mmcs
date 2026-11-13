import {
  Block,
  DeleteForever,
  Download,
  Edit,
  Engineering,
  ExitToApp,
  MenuBookOutlined,
  MoreVert,
  Restore,
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
import { brand, neutral, intent, withAlpha } from 'src/theme/designTokens'

import DataSheetEditDialogs, { type EditStep } from './DataSheetEditDialogs'
import { DataSheetData } from './types'
import { DataSheetActions } from './useDataSheetActions'

interface DataSheetRowActionsProps {
  row: MRT_Row<DataSheetData>
  actions: DataSheetActions
  onRetire: (row: MRT_Row<DataSheetData>) => void
  onDeletePermanent: (row: MRT_Row<DataSheetData>) => void
  /** Abre la edición de los datos de la hoja de vida. */
  onEditData: (row: DataSheetData) => void
}

const DataSheetRowActions = ({
  row,
  actions,
  onRetire,
  onDeletePermanent,
  onEditData
}: DataSheetRowActionsProps) => {
  const canViewDetail = useCan(PERMISSIONS.CALIBRATION_DATASHEET_DETAIL)
  const canViewMaintenance = useCan(
    PERMISSIONS.CALIBRATION_INSPECTION_MAINTENANCE_VIEW
  )
  const canUpdateDataSheet = useCan(PERMISSIONS.CALIBRATION_DATASHEET_UPDATE)
  const canRetire = useCan(PERMISSIONS.CALIBRATION_DATASHEET_RETIRE)
  const canDeleteDataSheet = useCan(PERMISSIONS.CALIBRATION_DATASHEET_DELETE)
  const [localAnchorEl, setLocalAnchorEl] = useState<null | HTMLElement>(null)
  const [editStep, setEditStep] = useState<EditStep>(null)

  const id = row.original.id as number
  const isRetired = Boolean(row.original.isRetired)

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
              border: `1px solid ${neutral.border}`,
              boxShadow: `0 8px 24px ${withAlpha(neutral.text, 0.1)}`,
              '& .MuiMenuItem-root': {
                fontSize: 14,
                fontWeight: 500,
                py: 1,
                gap: 0.5,
                '&:hover': { bgcolor: brand.softer }
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
              <Visibility fontSize='small' sx={{ color: brand.ink }} />
            </ListItemIcon>
            Ver hoja de vida
          </MuiMenuItem>
        )}

        {!isRetired && canViewMaintenance && (
          <MuiMenuItem
            component={Link}
            to={`${row.original.id}/inspection-maintenance`}
            onClick={handleMenuClose}
          >
            <ListItemIcon>
              <Engineering fontSize='small' sx={{ color: brand.ink }} />
            </ListItemIcon>
            Inspección y mantenimiento
          </MuiMenuItem>
        )}

        {!isRetired && (
          <MuiMenuItem
            component={Link}
            to={`${row.original.id}/in-out`}
            onClick={handleMenuClose}
          >
            <ListItemIcon>
              <ExitToApp fontSize='small' sx={{ color: brand.ink }} />
            </ListItemIcon>
            Entrada y salida
          </MuiMenuItem>
        )}

        {row.original.invoiceUrl && canViewDetail && (
          <MuiMenuItem
            onClick={() => {
              handleMenuClose()
              actions.handleDownloadPdf(id)
            }}
          >
            <ListItemIcon>
              <Download fontSize='small' sx={{ color: brand.ink }} />
            </ListItemIcon>
            Descargar factura
          </MuiMenuItem>
        )}

        {row.original.manualUrl && canViewDetail && (
          <MuiMenuItem
            onClick={() => {
              handleMenuClose()
              actions.handleDownloadManual(id)
            }}
          >
            <ListItemIcon>
              <MenuBookOutlined fontSize='small' sx={{ color: brand.ink }} />
            </ListItemIcon>
            Descargar manual
          </MuiMenuItem>
        )}

        <Divider sx={{ my: 0.5 }} />

        {!isRetired && canUpdateDataSheet && (
          <MuiMenuItem onClick={handleEdit}>
            <ListItemIcon>
              <Edit fontSize='small' sx={{ color: intent.action }} />
            </ListItemIcon>
            Editar
          </MuiMenuItem>
        )}

        {isRetired && canRetire && (
          <MuiMenuItem
            onClick={() => {
              actions.restoreDataSheetFromRetirement(id)
              handleMenuClose()
            }}
          >
            <ListItemIcon>
              <Restore fontSize='small' sx={{ color: brand.ink }} />
            </ListItemIcon>
            Restaurar
          </MuiMenuItem>
        )}

        {!isRetired && canRetire && (
          <MuiMenuItem
            onClick={() => {
              onRetire(row)
              handleMenuClose()
            }}
            sx={{
              color: intent.warningInk,
              '&:hover': { bgcolor: intent.warningSoft }
            }}
          >
            <ListItemIcon>
              <Block fontSize='small' sx={{ color: intent.warningInk }} />
            </ListItemIcon>
            Dar de baja
          </MuiMenuItem>
        )}

        {canDeleteDataSheet && (
          <MuiMenuItem
            onClick={() => {
              onDeletePermanent(row)
              handleMenuClose()
            }}
            sx={{
              color: intent.danger,
              '&:hover': { bgcolor: intent.dangerSoft }
            }}
          >
            <ListItemIcon>
              <DeleteForever fontSize='small' sx={{ color: intent.danger }} />
            </ListItemIcon>
            Eliminar definitivamente
          </MuiMenuItem>
        )}
      </Menu>

      {!isRetired && (
        <DataSheetEditDialogs
          step={editStep}
          onClose={() => setEditStep(null)}
          onStepChange={setEditStep}
          equipmentName={row.original.equipmentName as string | undefined}
          onUploadImage={(image) => actions.handleUpload({ id, image })}
          onUploadInvoice={(pdfFile) => actions.handleUploadPdf(id, pdfFile)}
          onUploadManual={(file) => actions.handleUploadManual(id, file)}
          onEditOther={() => onEditData(row.original)}
        />
      )}
    </Box>
  )
}

export default DataSheetRowActions
