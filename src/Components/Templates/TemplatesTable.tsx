import React, { useMemo, useState } from 'react'
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import {
  ContentCopyOutlined,
  DeleteOutline,
  EditOutlined
} from '@mui/icons-material'
import type { MRT_ColumnDef } from 'material-react-table'
import DataTable from 'src/Components/Common/DataTable'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { TemplatesData, TemplateData } from './types'
import EditTemplateModal from './EditTemplateModal'
import { brand, intent } from 'src/theme/designTokens'

interface TemplatesTableProps {
  templates: TemplatesData[]
  loading: boolean
  onUpdate: (id: number, templateData: TemplateData) => Promise<boolean>
  onDelete: (id: number) => void
  onDuplicate: (template: TemplatesData) => void
}

/** Plantillas de mapeo de Excel: buscador con conteo, acciones fijas a la derecha. */
const TemplatesTable: React.FC<TemplatesTableProps> = ({
  templates,
  loading,
  onUpdate,
  onDelete,
  onDuplicate
}) => {
  const canManage = useCan(PERMISSIONS.CALIBRATION_TEMPLATE_MANAGE)
  const [templateToEdit, setTemplateToEdit] = useState<TemplatesData | null>(
    null
  )

  const columns = useMemo<MRT_ColumnDef<TemplatesData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 70,
        Cell: ({ row }) => `#${row.original.id}`
      },
      {
        accessorKey: 'name',
        header: 'Nombre',
        size: 260,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body2' fontWeight={600}>
              {row.original.name}
            </Typography>
            {row.original.duplicated_from ? (
              <Chip
                size='small'
                variant='outlined'
                label='Duplicada'
                sx={{ fontWeight: 600 }}
              />
            ) : null}
          </Box>
        )
      },
      {
        accessorKey: 'description',
        header: 'Descripción',
        size: 260,
        Cell: ({ row }) => (
          <Typography
            variant='body2'
            color='text.secondary'
            title={row.original.description}
            sx={{
              maxWidth: 260,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {row.original.description}
          </Typography>
        )
      },
      { accessorKey: 'city', header: 'Ciudad (celda)', size: 130 },
      { accessorKey: 'location', header: 'Ubicación (celda)', size: 150 },
      { accessorKey: 'sede', header: 'Sede (celda)', size: 130 },
      { accessorKey: 'instrumento', header: 'Instrumento (celda)', size: 160 },
      {
        accessorKey: 'calibrationDate',
        header: 'Fecha calibración (celda)',
        size: 180,
        Cell: ({ row }) => row.original.calibrationDate || '-'
      }
    ],
    []
  )

  const handleEditSubmit = async (templateData: TemplateData) => {
    if (!templateToEdit) return false
    const success = await onUpdate(templateToEdit.id, templateData)
    if (success) setTemplateToEdit(null)
    return success
  }

  return (
    <>
      <DataTable<TemplatesData>
        columns={columns}
        data={templates}
        itemLabel={['plantilla', 'plantillas']}
        searchPlaceholder='Buscar plantillas'
        enableColumnFilters={false}
        state={{ isLoading: loading && templates.length === 0 }}
        initialState={{ sorting: [{ id: 'name', desc: false }] }}
        enableRowActions={canManage}
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip arrow placement='top' title='Duplicar'>
              <IconButton
                size='small'
                aria-label={`Duplicar plantilla ${row.original.name}`}
                sx={{ color: brand.ink }}
                onClick={() => onDuplicate(row.original)}
              >
                <ContentCopyOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement='top' title='Editar'>
              <IconButton
                size='small'
                aria-label={`Editar plantilla ${row.original.name}`}
                sx={{ color: intent.action }}
                onClick={() => setTemplateToEdit(row.original)}
              >
                <EditOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement='top' title='Eliminar'>
              <IconButton
                size='small'
                color='error'
                aria-label={`Eliminar plantilla ${row.original.name}`}
                onClick={() => onDelete(row.original.id)}
              >
                <DeleteOutline fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      />

      <EditTemplateModal
        open={Boolean(templateToEdit)}
        template={templateToEdit}
        onClose={() => setTemplateToEdit(null)}
        onSubmit={handleEditSubmit}
      />
    </>
  )
}

export default TemplatesTable
