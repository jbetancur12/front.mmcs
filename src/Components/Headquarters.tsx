import {
  Add,
  ArrowBack,
  Business,
  DeleteOutline,
  EditOutlined,
  VisibilityOutlined
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { MRT_ColumnDef } from 'material-react-table'
import React, { useMemo, useState } from 'react'

import { useCan } from '@utils/functions'
import { PERMISSIONS } from 'src/constants/permissions'

import DataTable from './Common/DataTable'
import EmptyState from './Common/EmptyState'
import FormDialog from './Common/FormDialog'
import StatusPill from './Common/StatusPill'
import { useCustomerOverview } from './customer-profile/useCustomerProfileData'
import SelectedHq from './SelectedHq'

interface HeadquartersProps {
  customerId?: string
  setSelectedSede: (sede: string | null) => void
  selectedSede: string | null
  onDelete: (id: number) => void
  onDeleteSede: (sede: string) => void
  sedes: string[]
  onAddSede: (newSede: string) => void
  onEditSede: (oldSede: string, newSede: string) => void
}

interface SedeRow {
  name: string
  equipment: number | null
}

const primaryButtonSx = {
  bgcolor: '#00BFA5',
  borderRadius: '10px',
  textTransform: 'none',
  fontWeight: 700,
  boxShadow: 'none',
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: '#00ACC1', boxShadow: 'none' }
} as const

/** Sedes del cliente en una tabla; agregar y editar con un diálogo. */
const Headquarters: React.FC<HeadquartersProps> = ({
  customerId,
  setSelectedSede,
  selectedSede,
  onDelete,
  onDeleteSede,
  sedes,
  onAddSede,
  onEditSede
}) => {
  const [selectedSedeString, setSelectedSedeString] = useState<string | null>(
    null
  )
  const canManageSites = useCan(PERMISSIONS.CUSTOMERS_SITE_MANAGE)
  // null = cerrado; '' = agregar; texto = editar esa sede
  const [dialogSede, setDialogSede] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const { data: overview } = useCustomerOverview(customerId)

  const rows = useMemo<SedeRow[]>(() => {
    const counts = new Map(
      (overview?.headquarters ?? []).map((hq) => [
        hq.name.toLowerCase(),
        hq.count
      ])
    )
    return sedes.map((name) => ({
      name,
      equipment: overview ? counts.get(name.toLowerCase()) ?? 0 : null
    }))
  }, [sedes, overview])

  const columns = useMemo<MRT_ColumnDef<SedeRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Sede',
        Cell: ({ cell }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: '#00BFA5', fontSize: 14 }}
            >
              <Business fontSize='small' />
            </Avatar>
            <Typography variant='body2' fontWeight={600}>
              {cell.getValue<string>().toUpperCase()}
            </Typography>
          </Box>
        )
      },
      {
        id: 'estado',
        header: 'Estado',
        size: 120,
        accessorFn: () => 'Activa',
        Cell: () => <StatusPill size='small' tone='success' label='Activa' />
      },
      {
        accessorKey: 'equipment',
        header: 'Equipos',
        size: 110,
        Cell: ({ cell }) => cell.getValue<number | null>() ?? '—'
      }
    ],
    []
  )

  const openSede = (sede: string) => {
    setSelectedSede(sede)
    setSelectedSedeString(sede)
  }

  const closeDialog = () => {
    setDialogSede(null)
    setDraft('')
  }

  const submitDialog = () => {
    const value = draft.trim()
    if (!value) return
    if (dialogSede) onEditSede(dialogSede, value)
    else onAddSede(value)
    closeDialog()
  }

  if (selectedSede) {
    return (
      <Box>
        <Box display='flex' alignItems='center' mb={3}>
          <IconButton
            aria-label='Volver a las sedes'
            onClick={() => setSelectedSede(null)}
            sx={{ mr: 2, color: '#374151' }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant='h6' fontWeight={700} sx={{ color: '#111827' }}>
            Detalles de {selectedSedeString}
          </Typography>
        </Box>

        <SelectedHq
          onDelete={onDelete}
          sedes={sedes}
          selectedSede={selectedSedeString}
        />
      </Box>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: 3
        }}
      >
        <Box>
          <Typography variant='h5' fontWeight={700} sx={{ color: '#111827' }}>
            Sedes
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Las ubicaciones del cliente y cuántos equipos tiene cada una.
          </Typography>
        </Box>
        {canManageSites ? (
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => {
              setDraft('')
              setDialogSede('')
            }}
            sx={primaryButtonSx}
          >
            Agregar sede
          </Button>
        ) : null}
      </Box>

      <DataTable<SedeRow>
        columns={columns}
        data={rows}
        itemLabel={['sede', 'sedes']}
        searchPlaceholder='Buscar sede'
        enableRowActions
        muiTableContainerProps={{ sx: { maxHeight: 'none' } }}
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => openSede(row.original.name),
          sx: { cursor: 'pointer' }
        })}
        renderRowActions={({ row }) => (
          <Box
            sx={{ display: 'flex', gap: 0.5 }}
            onClick={(event) => event.stopPropagation()}
          >
            <Tooltip title='Ver detalles'>
              <IconButton
                size='small'
                aria-label={`Ver detalles de ${row.original.name}`}
                sx={{ color: '#00695C' }}
                onClick={() => openSede(row.original.name)}
              >
                <VisibilityOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            {canManageSites ? (
              <>
                <Tooltip title='Editar sede'>
                  <IconButton
                    size='small'
                    aria-label={`Editar ${row.original.name}`}
                    sx={{ color: '#2563eb' }}
                    onClick={() => {
                      setDraft(row.original.name)
                      setDialogSede(row.original.name)
                    }}
                  >
                    <EditOutlined fontSize='small' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Eliminar sede'>
                  <IconButton
                    size='small'
                    aria-label={`Eliminar ${row.original.name}`}
                    color='error'
                    onClick={() => onDeleteSede(row.original.name)}
                  >
                    <DeleteOutline fontSize='small' />
                  </IconButton>
                </Tooltip>
              </>
            ) : null}
          </Box>
        )}
        renderEmptyRowsFallback={() => (
          <EmptyState
            icon={<Business />}
            title='No hay sedes registradas'
            hint='Agrega la primera sede para organizar los equipos del cliente.'
          />
        )}
      />

      <FormDialog
        open={dialogSede !== null}
        onClose={closeDialog}
        title={dialogSede ? 'Editar sede' : 'Agregar sede'}
        subtitle={dialogSede || undefined}
        submitLabel={dialogSede ? 'Guardar cambios' : 'Agregar sede'}
        onSubmit={submitDialog}
        submitDisabled={!draft.trim() || draft.trim() === dialogSede}
      >
        <TextField
          autoFocus
          fullWidth
          required
          label='Nombre de la sede'
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder='Ej: Sede Principal, Sucursal Norte…'
        />
      </FormDialog>
    </Box>
  )
}

export default Headquarters
