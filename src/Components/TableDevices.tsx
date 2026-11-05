import { Add, Build, DeleteOutline, EditOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip
} from '@mui/material'

import {
  type MRT_Cell,
  type MRT_ColumnDef,
  type MRT_Row,
  type MaterialReactTableProps
} from 'material-react-table'
import React, { useCallback, useMemo, useState } from 'react'

import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import FormDialog from 'src/Components/Common/FormDialog'
import AsyncSelectField, {
  type AsyncSelectOption
} from 'src/Components/Common/AsyncSelectField'
import AsyncSelect from 'react-select/async'

import { loadOptions, mapOptions } from '../utils/loadOptions'

import { styles } from './ExcelManipulation/Utils'
import { TemplatesData } from './Templates'
import {
  DEVICE_EXACT_FILTERS,
  DEVICE_SORTABLE_FIELDS,
  useCreateDevice,
  useDeleteDevice,
  useDevicesCount,
  useDevicesPaginated,
  useUpdateDevice
} from '@hooks/devices/useDevices'
import {
  useKeepPageInRange,
  useServerTableState
} from 'src/hooks/useServerTable'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { notify } from 'src/utils/notify'
import { confirmDialog } from 'src/utils/confirm'

import { logger } from 'src/utils/logger'
// Define interfaces
export interface DeviceData {
  id: number
  name: string
  magnitude: string
  repository?: {
    id: number
    name: string
  }
  certificateTemplate?: {
    id: number
    name: string
  }
}

// API URL

// Main component
const Table: React.FC = () => {
  const canManageDevices = useCan(PERMISSIONS.CALIBRATION_DEVICE_MANAGE)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  // Paginación, búsqueda (por nombre) y orden en el servidor.
  const server = useServerTableState({
    sortableFields: DEVICE_SORTABLE_FIELDS,
    exactFilters: DEVICE_EXACT_FILTERS
  })
  const {
    data: devicesPage,
    isLoading,
    isFetching
  } = useDevicesPaginated(server.params)
  useKeepPageInRange(
    devicesPage?.totalPages,
    server.pagination.pageIndex,
    server.setPagination
  )
  const { data: devicesCount } = useDevicesCount()
  const tableData = useMemo<DeviceData[]>(
    () => (devicesPage?.items ?? []) as unknown as DeviceData[],
    [devicesPage]
  )
  const createDeviceMutation = useCreateDevice()
  const updateDeviceMutation = useUpdateDevice()
  const deleteDeviceMutation = useDeleteDevice()
  const [format, setFormat] = useState<{ label: string; value: number } | null>(
    null
  )

  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  // Create a new device
  const onCreateDevice = async (deviceData: DeviceData) => {
    try {
      const response = await createDeviceMutation.mutateAsync({
        name: deviceData.name,
        repository: deviceData.repository,
        magnitude: deviceData.magnitude,
        certificateTemplate: deviceData.certificateTemplate
      })

      if (response.status === 201) {
        notify.success('Equipo Creado Exitosamente!')
      } else {
        logger.error('Error al crear equipo')
      }
    } catch (error) {
      logger.error('Error de red:', error)
    }
  }

  const handleCreateNewRow = (values: DeviceData) => {
    onCreateDevice(values)
    setCreateModalOpen(false)
  }

  const handleSaveRowEdits: MaterialReactTableProps<DeviceData>['onEditingRowSave'] =
    async ({ exitEditingMode, values }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = {
          ...values,
          certificateTemplateId: format?.value
        }

        delete updatedValues.id
        try {
          const response = await updateDeviceMutation.mutateAsync({
            id: values.id,
            payload: updatedValues
          })

          if (response.status >= 200 && response.status < 300) {
            notify.success('Equipo Modificado Exitosamente!')
          } else {
            logger.error('Error al crear equipo')
          }
        } catch (error) {
          logger.error('Error de red:', error)
        }

        exitEditingMode() //required to exit editing mode and close modal
      }
    }

  const handleCancelRowEdits = () => {
    setValidationErrors({})
  }

  const deleteUser = async (id: number) => {
    try {
      const response = await deleteDeviceMutation.mutateAsync(id)

      if (response.status === 204) {
        notify.success('Equipo Eliminado Exitosamente!')
      } else {
        logger.error('Error al crear equipo')
      }
    } catch (error) {
      logger.error('Error de red:', error)
    }
  }

  const handleDeleteRow = useCallback(
    async (row: MRT_Row<DeviceData>) => {
      const { isConfirmed } = await confirmDialog({
        title: 'Eliminar equipo',
        text: `Vas a eliminar "${row.getValue('name')}". Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        tone: 'danger'
      })
      if (!isConfirmed) return
      deleteUser(row.getValue('id'))
    },
    [deleteUser]
  )

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<DeviceData>
    ): MRT_ColumnDef<DeviceData>['muiTableBodyCellEditTextFieldProps'] => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid =
            cell.column.id === 'email'
              ? validateEmail(event.target.value)
              : cell.column.id === 'age'
                ? validateAge(+event.target.value)
                : validateRequired(event.target.value)
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is required`
            })
          } else {
            //remove validation error for cell if valid
            delete validationErrors[cell.id]
            setValidationErrors({
              ...validationErrors
            })
          }
        }
      }
    },
    [validationErrors]
  )

  //should be memoized or stable
  const columns = useMemo<MRT_ColumnDef<DeviceData>[]>(
    () => [
      {
        accessorKey: 'id', //access nested data with dot notation
        header: 'ID',
        // size: 1,

        enableEditing: false,
        enableColumnFilter: false
      },
      {
        accessorKey: 'name', //access nested data with dot notation
        header: 'Nombre',
        // La búsqueda global ya busca por nombre en el servidor.
        enableColumnFilter: false,
        // size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'magnitude',
        header: 'Magnitud',
        // Filtro exacto en el servidor (`magnitude`).
        muiTableHeadCellFilterTextFieldProps: { placeholder: 'Valor exacto' },
        // size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        id: 'certificateTemplateName',
        accessorFn: (row) => row.certificateTemplate?.name || 'Sin plantilla',
        header: 'Plantilla de Certificado',
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) =>
          row.original.certificateTemplate?.name || 'Sin plantilla',

        Edit: () => (
          <AsyncSelect
            cacheOptions
            // defaultOptions

            placeholder='Buscar Plantilla de Certificado'
            loadOptions={(inputValue) =>
              loadOptions<TemplatesData>(inputValue, 'templates', (item) =>
                mapOptions(item, 'id', 'name')
              )
            }
            onChange={(selectedOption) =>
              setFormat(
                selectedOption as { label: string; value: number } | null
              )
            }
            styles={styles(false)}
          />
        )
      }
    ],
    [getCommonEditTextFieldProps]
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Equipos'
        subtitle='Catálogo de equipos, magnitudes y plantillas de certificado'
        icon={<Build />}
        actions={
          canManageDevices ? (
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={() => setCreateModalOpen(true)}
              sx={{
                bgcolor: '#00BFA5',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#00ACC1' }
              }}
            >
              Crear equipo
            </Button>
          ) : undefined
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Total equipos'
            value={devicesCount ?? devicesPage?.totalItems ?? 0}
            icon={<Build />}
            tone='teal'
          />
        </Grid>
      </Grid>

      <DataTable<DeviceData>
        columns={columns}
        data={tableData}
        itemLabel={['equipo', 'equipos']}
        searchPlaceholder='Buscar por nombre'
        {...server.tableProps}
        rowCount={devicesPage?.totalItems ?? 0}
        state={{
          ...server.tableState,
          isLoading,
          showProgressBars: isFetching && !isLoading
        }}
        editingMode='modal' //default
        enableEditing={canManageDevices}
        enableRowActions={canManageDevices}
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        initialState={{ columnVisibility: { id: false } }}
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip arrow placement='top' title='Editar'>
              <IconButton
                size='small'
                aria-label='Editar'
                sx={{ color: '#2563eb' }}
                onClick={() => table.setEditingRow(row)}
              >
                <EditOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement='top' title='Eliminar'>
              <IconButton
                size='small'
                color='error'
                aria-label='Eliminar'
                onClick={() => handleDeleteRow(row)}
              >
                <DeleteOutline fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      />
      <CreateNewDeviceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
    </Container>
  )
}

interface CreateModalProps {
  onClose: () => void
  onSubmit: (values: DeviceData) => void
  open: boolean
}

type TemplateOption = AsyncSelectOption

export const CreateNewDeviceModal = ({
  open,
  onClose,
  onSubmit
}: CreateModalProps) => {
  const [name, setName] = useState('')
  const [magnitude, setMagnitude] = useState('')
  const [template, setTemplate] = useState<TemplateOption | null>(null)

  const handleClose = () => {
    setName('')
    setMagnitude('')
    setTemplate(null)
    onClose()
  }

  const handleSubmit = () => {
    onSubmit({
      name: name.trim(),
      magnitude: magnitude.trim(),
      ...(template
        ? {
            certificateTemplate: {
              id: Number(template.value),
              name: template.label
            }
          }
        : {})
    } as DeviceData)
    handleClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title='Crear equipo'
      subtitle='Catálogo de equipos del laboratorio'
      submitLabel='Crear equipo'
      onSubmit={handleSubmit}
      submitDisabled={!name.trim()}
    >
      <Stack spacing={2.5}>
        <TextField
          label='Nombre'
          required
          fullWidth
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          label='Magnitud'
          fullWidth
          value={magnitude}
          onChange={(event) => setMagnitude(event.target.value)}
        />
        <AsyncSelectField<TemplateOption>
          label='Plantilla de certificado'
          value={template}
          onChange={setTemplate}
          loadOptions={(input) =>
            loadOptions<TemplatesData>(input, 'templates', (item) =>
              mapOptions(item, 'id', 'name')
            ) as unknown as Promise<TemplateOption[]>
          }
          helperText='Opcional. Escribe para buscar una plantilla.'
        />
      </Stack>
    </FormDialog>
  )
}

const validateRequired = (value: string) => !!value.length
const validateEmail = (email: string) =>
  !!email.length &&
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
const validateAge = (age: number) => age >= 18 && age <= 50

export default Table
