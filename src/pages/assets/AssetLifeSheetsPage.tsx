import { useEffect, useMemo, useState } from 'react'
import {
  Add,
  CalendarMonth,
  Close,
  Delete,
  Download,
  Edit,
  FileUpload,
  History,
  Visibility
} from '@mui/icons-material'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  InputLabel,
  Typography
} from '@mui/material'
import MaterialReactTable, { type MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { useStore } from '@nanostores/react'
import { bigToast } from 'src/Components/ExcelManipulation/Utils'
import {
  ASSET_CATEGORY_OPTIONS,
  ASSET_MAINTENANCE_FREQUENCY_OPTIONS,
  ASSET_INTERVENTION_TYPE_OPTIONS,
  ASSET_TYPE_OPTIONS,
  ASSET_STATUS_OPTIONS,
  DEFAULT_ASSET_MAINTENANCE_TASKS
} from 'src/constants/assetLifeSheets'
import { userStore } from 'src/store/userStore'
import type {
  AssetInterventionFormValues,
  AssetLifeSheet,
  AssetLifeSheetAccessory,
  AssetLifeSheetMaintenanceTask,
  AssetLifeSheetFormValues
} from 'src/types/assetLifeSheet'
import useAxiosPrivate from '@utils/use-axios-private'

const emptyAccessory = (): AssetLifeSheetAccessory => ({ accessoryType: '' })
const emptyMaintenanceTask = (): AssetLifeSheetMaintenanceTask => ({
  taskName: '',
  frequency: '',
  notes: ''
})

const emptyAssetForm = (): AssetLifeSheetFormValues => ({
  assetCode: '',
  name: '',
  assetCategory: 'computo',
  assetType: '',
  brand: '',
  model: '',
  serialNumber: '',
  processor: '',
  ram: '',
  storage: '',
  operatingSystem: '',
  supplier: '',
  location: '',
  area: '',
  custodian: '',
  status: 'active',
  receivedDate: '',
  inServiceDate: '',
  warrantyExpiresAt: '',
  hasManual: false,
  hasWarranty: false,
  maintenanceFrequency: '',
  maintenanceTasks: DEFAULT_ASSET_MAINTENANCE_TASKS.map((task) => ({
    ...task
  })),
  generalComments: '',
  technicalSpecifications: '',
  accessories: []
})

const getOptionLabel = (
  options: Array<{ value: string; label: string }>,
  value?: string | null
) => options.find((option) => option.value === value)?.label || value || 'N/D'

const formatDate = (value?: string | null) => {
  if (!value) return 'N/D'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-CO')
}

const AssetLifeSheetsPage = () => {
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)

  const [assets, setAssets] = useState<AssetLifeSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<AssetLifeSheet | null>(
    null
  )
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null)
  const [assetForm, setAssetForm] =
    useState<AssetLifeSheetFormValues>(emptyAssetForm())
  const [interventionDialogOpen, setInterventionDialogOpen] = useState(false)
  const [assetPendingDelete, setAssetPendingDelete] =
    useState<AssetLifeSheet | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [interventionForm, setInterventionForm] =
    useState<AssetInterventionFormValues>({
      interventionDate: new Date().toISOString().slice(0, 10),
      interventionType: 'preventive',
      title: '',
      description: '',
      observations: '',
      performedByName: $userStore.nombre || 'Administrador',
      nextActionDate: ''
    })

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const response =
        await axiosPrivate.get<AssetLifeSheet[]>('/asset-life-sheets')
      setAssets(response.data)
    } catch (error) {
      console.error(error)
      bigToast('No se pudieron cargar los activos', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  useEffect(() => {
    if (!selectedAsset) return
    const refreshedAsset = assets.find((asset) => asset.id === selectedAsset.id)
    if (refreshedAsset) setSelectedAsset(refreshedAsset)
  }, [assets])

  const openCreate = () => {
    setEditingAssetId(null)
    setAssetForm(emptyAssetForm())
    setSelectedImageFile(null)
    setAssetDialogOpen(true)
  }

  const openEdit = (asset: AssetLifeSheet) => {
    setEditingAssetId(asset.id)
    setAssetForm({
      assetCode: asset.assetCode || '',
      name: asset.name || '',
      assetCategory: asset.assetCategory || 'computo',
      assetType: asset.assetType || '',
      brand: asset.brand || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      processor: asset.processor || '',
      ram: asset.ram || '',
      storage: asset.storage || '',
      operatingSystem: asset.operatingSystem || '',
      supplier: asset.supplier || '',
      location: asset.location || '',
      area: asset.area || '',
      custodian: asset.custodian || '',
      status: asset.status || 'active',
      receivedDate: asset.receivedDate || '',
      inServiceDate: asset.inServiceDate || '',
      warrantyExpiresAt: asset.warrantyExpiresAt || '',
      hasManual: asset.hasManual,
      hasWarranty: asset.hasWarranty,
      maintenanceFrequency: asset.maintenanceFrequency || '',
      maintenanceTasks: asset.maintenanceTasks?.length
        ? asset.maintenanceTasks.map((task) => ({ ...task }))
        : [],
      generalComments: asset.generalComments || '',
      technicalSpecifications: asset.technicalSpecifications || '',
      accessories: asset.accessories?.length ? asset.accessories : []
    })
    setAssetDialogOpen(true)
  }

  const closeAssetDialog = () => {
    setAssetDialogOpen(false)
    setEditingAssetId(null)
  }

  const updateField = (field: keyof AssetLifeSheetFormValues, value: any) => {
    setAssetForm((current) => ({ ...current, [field]: value }))
  }

  const updateAccessory = (
    index: number,
    field: keyof AssetLifeSheetAccessory,
    value: string
  ) => {
    setAssetForm((current) => {
      const next = [...current.accessories]
      next[index] = { ...next[index], [field]: value }
      return { ...current, accessories: next }
    })
  }

  const updateMaintenanceTask = (
    index: number,
    field: keyof AssetLifeSheetMaintenanceTask,
    value: string
  ) => {
    setAssetForm((current) => {
      const next = [...current.maintenanceTasks]
      next[index] = { ...next[index], [field]: value }
      return { ...current, maintenanceTasks: next }
    })
  }

  const saveAsset = async () => {
    try {
      const formData = new FormData()
      Object.entries(assetForm).forEach(([key, value]) => {
        formData.append(
          key,
          key === 'accessories' || key === 'maintenanceTasks'
            ? JSON.stringify(value)
            : String(value ?? '')
        )
      })
      if (selectedImageFile) formData.append('image', selectedImageFile)

      if (editingAssetId) {
        await axiosPrivate.put(`/asset-life-sheets/${editingAssetId}`, formData)
      } else {
        await axiosPrivate.post('/asset-life-sheets', formData)
      }

      closeAssetDialog()
      fetchAssets()
      bigToast('Activo guardado correctamente', 'success')
    } catch (error) {
      console.error(error)
      bigToast('No fue posible guardar el activo', 'error')
    }
  }

  const deleteAsset = async (assetId: number) => {
    try {
      await axiosPrivate.delete(`/asset-life-sheets/${assetId}`)
      setSelectedAsset((current) => (current?.id === assetId ? null : current))
      setAssetPendingDelete(null)
      fetchAssets()
      bigToast('Activo eliminado', 'success')
    } catch (error) {
      console.error(error)
      bigToast('No fue posible eliminar el activo', 'error')
    }
  }

  const downloadPdf = async (asset: AssetLifeSheet) => {
    try {
      const response = await axiosPrivate.get(
        `/asset-life-sheets/${asset.id}/pdf`,
        {
          responseType: 'blob'
        }
      )
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `hoja-de-vida-${asset.assetCode}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      bigToast('No fue posible exportar el PDF', 'error')
    }
  }

  const downloadSchedulePdf = async () => {
    try {
      const response = await axiosPrivate.get(
        '/asset-life-sheets/schedule/pdf',
        {
          responseType: 'blob',
          params: { year: new Date().getFullYear() }
        }
      )
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `cronograma-activos-${new Date().getFullYear()}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      bigToast('No fue posible exportar el cronograma', 'error')
    }
  }

  const exportAssetsExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.utils.book_new()
      const assetRows = assets.map((asset) => ({
        Código: asset.assetCode,
        Nombre: asset.name,
        Categoría: getOptionLabel(ASSET_CATEGORY_OPTIONS, asset.assetCategory),
        Tipo: asset.assetType,
        Marca: asset.brand || '',
        Modelo: asset.model || '',
        Serial: asset.serialNumber || '',
        Estado: getOptionLabel(ASSET_STATUS_OPTIONS, asset.status),
        Ubicación: asset.location || '',
        Área: asset.area || '',
        Responsable: asset.custodian || '',
        Proveedor: asset.supplier || '',
        'Fecha recepción': formatDate(asset.receivedDate),
        'Puesta en servicio': formatDate(asset.inServiceDate),
        'Vence garantía': formatDate(asset.warrantyExpiresAt),
        Manual: asset.hasManual ? 'Sí' : 'No',
        Garantía: asset.hasWarranty ? 'Sí' : 'No',
        'Frecuencia mantenimiento': asset.maintenanceFrequency || '',
        'Acciones base': (asset.maintenanceTasks || [])
          .map(
            (task) => `${task.taskName} (${task.frequency || 'Sin frecuencia'})`
          )
          .join('; '),
        Accesorios: (asset.accessories || [])
          .map((accessory) => accessory.accessoryType)
          .filter(Boolean)
          .join('; ')
      }))
      const scheduleRows = assets.flatMap((asset) =>
        (asset.maintenanceTasks || []).map((task) => ({
          Código: asset.assetCode,
          Activo: asset.name,
          Ubicación: asset.location || '',
          Responsable: asset.custodian || '',
          Acción: task.taskName,
          Periodicidad: task.frequency,
          Notas: task.notes || ''
        }))
      )

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(assetRows),
        'Activos'
      )
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(scheduleRows),
        'Cronograma base'
      )
      XLSX.writeFile(
        workbook,
        `hojas-de-vida-activos-${new Date().toISOString().slice(0, 10)}.xlsx`
      )
    } catch (error) {
      bigToast('No fue posible exportar Excel', 'error')
    }
  }

  const columns = useMemo<MRT_ColumnDef<AssetLifeSheet>[]>(
    () => [
      {
        accessorKey: 'assetCode',
        header: 'Código',
        size: 110
      },
      {
        accessorKey: 'name',
        header: 'Activo',
        size: 220,
        Cell: ({ row }) => (
          <Box>
            <Typography fontWeight={700}>{row.original.name}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {[row.original.assetType, row.original.brand, row.original.model]
                .filter(Boolean)
                .join(' · ') || 'Sin detalle'}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 150,
        filterVariant: 'select',
        filterSelectOptions: ASSET_STATUS_OPTIONS.map((option) => ({
          text: option.label,
          value: option.value
        })),
        Cell: ({ cell }) => (
          <Chip
            size='small'
            label={getOptionLabel(
              ASSET_STATUS_OPTIONS,
              String(cell.getValue())
            )}
          />
        )
      },
      {
        accessorKey: 'assetCategory',
        header: 'Categoría',
        size: 160,
        filterVariant: 'select',
        filterSelectOptions: ASSET_CATEGORY_OPTIONS.map((option) => ({
          text: option.label,
          value: option.value
        })),
        Cell: ({ cell }) =>
          getOptionLabel(ASSET_CATEGORY_OPTIONS, String(cell.getValue()))
      },
      {
        accessorKey: 'location',
        header: 'Ubicación',
        size: 160
      },
      {
        accessorKey: 'area',
        header: 'Área',
        size: 140
      },
      {
        accessorKey: 'custodian',
        header: 'Responsable',
        size: 170
      },
      {
        accessorKey: 'serialNumber',
        header: 'Serial',
        size: 160
      },
      {
        accessorKey: 'maintenanceFrequency',
        header: 'Frecuencia',
        size: 150
      },
      {
        accessorKey: 'warrantyExpiresAt',
        header: 'Garantía',
        size: 130,
        Cell: ({ cell }) => formatDate(cell.getValue<string | null>())
      }
    ],
    []
  )

  const saveIntervention = async () => {
    if (!selectedAsset?.id) return
    try {
      await axiosPrivate.post(
        `/asset-life-sheets/${selectedAsset.id}/interventions`,
        interventionForm
      )
      setInterventionDialogOpen(false)
      setInterventionForm((current) => ({
        ...current,
        title: '',
        description: '',
        observations: '',
        nextActionDate: ''
      }))
      fetchAssets()
      bigToast('Intervención registrada', 'success')
    } catch (error) {
      bigToast('No fue posible registrar la intervención', 'error')
    }
  }

  const textFieldProps = (name: string) => ({
    id: name,
    name
  })

  const getSuggestedValues = (
    field: 'location' | 'area' | 'custodian' | 'supplier'
  ) => {
    return [
      ...new Set(
        assets
          .map((asset) => asset[field]?.trim())
          .filter((value): value is string => Boolean(value))
      )
    ].sort((left, right) => left.localeCompare(right, 'es'))
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant='h4' fontWeight={700}>
            Hoja de Vida de Activos
          </Typography>
          <Typography color='text.secondary'>
            Módulo administrativo para PCs, portátiles, TVs y equipos similares.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant='outlined'
            startIcon={<Download />}
            onClick={exportAssetsExcel}
          >
            Excel
          </Button>
          <Button
            variant='outlined'
            startIcon={<CalendarMonth />}
            onClick={downloadSchedulePdf}
          >
            Cronograma PDF
          </Button>
          <Button variant='contained' startIcon={<Add />} onClick={openCreate}>
            Nuevo activo
          </Button>
        </Stack>
      </Stack>

      <MaterialReactTable
        columns={columns}
        data={assets}
        localization={MRT_Localization_ES}
        enableColumnFilters
        enableColumnOrdering
        enableColumnResizing
        enableDensityToggle
        enableGlobalFilter
        enableHiding
        enablePagination
        enableRowActions
        enableSorting
        positionActionsColumn='last'
        state={{ isLoading: loading }}
        initialState={{
          density: 'compact',
          sorting: [{ id: 'assetCode', desc: false }]
        }}
        muiTablePaperProps={{
          elevation: 0,
          sx: { border: '1px solid', borderColor: 'divider' }
        }}
        renderTopToolbarCustomActions={() => (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant='outlined'
              startIcon={<Download />}
              onClick={exportAssetsExcel}
            >
              Descargar Excel
            </Button>
            <Button
              variant='outlined'
              startIcon={<CalendarMonth />}
              onClick={downloadSchedulePdf}
            >
              Cronograma PDF
            </Button>
          </Stack>
        )}
        renderRowActions={({ row }) => (
          <Stack direction='row' spacing={0.5}>
            <IconButton onClick={() => setSelectedAsset(row.original)}>
              <Visibility />
            </IconButton>
            <IconButton onClick={() => openEdit(row.original)}>
              <Edit />
            </IconButton>
            <IconButton onClick={() => downloadPdf(row.original)}>
              <Download />
            </IconButton>
            <IconButton onClick={() => setAssetPendingDelete(row.original)}>
              <Delete />
            </IconButton>
          </Stack>
        )}
      />

      <Dialog
        open={assetDialogOpen}
        onClose={closeAssetDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {editingAssetId ? 'Editar activo' : 'Crear activo'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                {...textFieldProps('assetCode')}
                label='Código'
                value={assetForm.assetCode}
                onChange={(event) =>
                  updateField('assetCode', event.target.value)
                }
                fullWidth
              />
              <TextField
                {...textFieldProps('assetName')}
                label='Nombre'
                value={assetForm.name}
                onChange={(event) => updateField('name', event.target.value)}
                fullWidth
              />
              <TextField
                {...textFieldProps('assetType')}
                select
                label='Tipo'
                value={assetForm.assetType}
                onChange={(event) =>
                  updateField('assetType', event.target.value)
                }
                fullWidth
              >
                {ASSET_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                {...textFieldProps('assetCategory')}
                select
                label='Categoría'
                value={assetForm.assetCategory}
                onChange={(event) =>
                  updateField('assetCategory', event.target.value)
                }
                fullWidth
              >
                {ASSET_CATEGORY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                {...textFieldProps('assetStatus')}
                select
                label='Estado'
                value={assetForm.status}
                onChange={(event) => updateField('status', event.target.value)}
                fullWidth
              >
                {ASSET_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Autocomplete
                freeSolo
                options={getSuggestedValues('custodian')}
                value={assetForm.custodian}
                onChange={(_, value) => updateField('custodian', value || '')}
                onInputChange={(_, value) => updateField('custodian', value)}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    {...textFieldProps('assetCustodian')}
                    label='Responsable'
                  />
                )}
              />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                {...textFieldProps('assetBrand')}
                label='Marca'
                value={assetForm.brand}
                onChange={(event) => updateField('brand', event.target.value)}
                fullWidth
              />
              <TextField
                {...textFieldProps('assetModel')}
                label='Modelo'
                value={assetForm.model}
                onChange={(event) => updateField('model', event.target.value)}
                fullWidth
              />
              <TextField
                {...textFieldProps('assetSerial')}
                label='Serial'
                value={assetForm.serialNumber}
                onChange={(event) =>
                  updateField('serialNumber', event.target.value)
                }
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Autocomplete
                freeSolo
                options={getSuggestedValues('location')}
                value={assetForm.location}
                onChange={(_, value) => updateField('location', value || '')}
                onInputChange={(_, value) => updateField('location', value)}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    {...textFieldProps('assetLocation')}
                    label='Ubicación'
                  />
                )}
              />
              <Autocomplete
                freeSolo
                options={getSuggestedValues('area')}
                value={assetForm.area}
                onChange={(_, value) => updateField('area', value || '')}
                onInputChange={(_, value) => updateField('area', value)}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    {...textFieldProps('assetArea')}
                    label='Área'
                  />
                )}
              />
              <Autocomplete
                freeSolo
                options={getSuggestedValues('supplier')}
                value={assetForm.supplier}
                onChange={(_, value) => updateField('supplier', value || '')}
                onInputChange={(_, value) => updateField('supplier', value)}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    {...textFieldProps('assetSupplier')}
                    label='Proveedor'
                  />
                )}
              />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                {...textFieldProps('assetProcessor')}
                label='Procesador'
                value={assetForm.processor}
                onChange={(event) =>
                  updateField('processor', event.target.value)
                }
                fullWidth
              />
              <TextField
                {...textFieldProps('assetRam')}
                label='RAM'
                value={assetForm.ram}
                onChange={(event) => updateField('ram', event.target.value)}
                fullWidth
              />
              <TextField
                {...textFieldProps('assetStorage')}
                label='Almacenamiento'
                value={assetForm.storage}
                onChange={(event) => updateField('storage', event.target.value)}
                fullWidth
              />
            </Stack>
            <TextField
              {...textFieldProps('assetOperatingSystem')}
              label='Sistema operativo'
              value={assetForm.operatingSystem}
              onChange={(event) =>
                updateField('operatingSystem', event.target.value)
              }
              fullWidth
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                {...textFieldProps('assetReceivedDate')}
                type='date'
                label='Fecha recepción'
                value={assetForm.receivedDate}
                onChange={(event) =>
                  updateField('receivedDate', event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                {...textFieldProps('assetInServiceDate')}
                type='date'
                label='Puesta en servicio'
                value={assetForm.inServiceDate}
                onChange={(event) =>
                  updateField('inServiceDate', event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                {...textFieldProps('assetWarrantyExpiresAt')}
                type='date'
                label='Vence garantía'
                value={assetForm.warrantyExpiresAt}
                onChange={(event) =>
                  updateField('warrantyExpiresAt', event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <TextField
              {...textFieldProps('assetMaintenanceFrequency')}
              label='Frecuencia de mantenimiento'
              value={assetForm.maintenanceFrequency}
              onChange={(event) =>
                updateField('maintenanceFrequency', event.target.value)
              }
              fullWidth
            />
            <Stack spacing={1}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent='space-between'
                spacing={1}
              >
                <Box>
                  <Typography variant='subtitle1' fontWeight={700}>
                    Base de mantenimiento
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Acciones periódicas que deben quedar programadas para este
                    equipo.
                  </Typography>
                </Box>
                <Button
                  onClick={() =>
                    updateField('maintenanceTasks', [
                      ...assetForm.maintenanceTasks,
                      emptyMaintenanceTask()
                    ])
                  }
                >
                  Agregar acción
                </Button>
              </Stack>
              {assetForm.maintenanceTasks.map((task, index) => (
                <Paper
                  key={`maintenance-task-${index}`}
                  variant='outlined'
                  sx={{ p: 2 }}
                >
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      <TextField
                        {...textFieldProps(`maintenanceTaskName-${index}`)}
                        label='Acción de mantenimiento'
                        value={task.taskName || ''}
                        onChange={(event) =>
                          updateMaintenanceTask(
                            index,
                            'taskName',
                            event.target.value
                          )
                        }
                        fullWidth
                      />
                      <TextField
                        {...textFieldProps(`maintenanceTaskFrequency-${index}`)}
                        select
                        label='Periodicidad'
                        value={task.frequency || ''}
                        onChange={(event) =>
                          updateMaintenanceTask(
                            index,
                            'frequency',
                            event.target.value
                          )
                        }
                        sx={{ minWidth: { md: 220 } }}
                        fullWidth
                      >
                        {ASSET_MAINTENANCE_FREQUENCY_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      <TextField
                        {...textFieldProps(`maintenanceTaskNotes-${index}`)}
                        label='Notas'
                        value={task.notes || ''}
                        onChange={(event) =>
                          updateMaintenanceTask(
                            index,
                            'notes',
                            event.target.value
                          )
                        }
                        fullWidth
                      />
                      <Button
                        color='error'
                        onClick={() =>
                          updateField(
                            'maintenanceTasks',
                            assetForm.maintenanceTasks.filter(
                              (_, currentIndex) => currentIndex !== index
                            )
                          )
                        }
                      >
                        Quitar
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
              {!assetForm.maintenanceTasks.length && (
                <Alert severity='info'>
                  Aun no hay acciones base configuradas.
                </Alert>
              )}
            </Stack>
            <Box>
              <InputLabel htmlFor='assetImageUpload' sx={{ mb: 1 }}>
                Imagen del activo
              </InputLabel>
              <Button
                component='label'
                variant='outlined'
                startIcon={<FileUpload />}
              >
                Seleccionar imagen
                <input
                  id='assetImageUpload'
                  name='assetImageUpload'
                  type='file'
                  accept='image/*'
                  hidden
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setSelectedImageFile(event.target.files?.[0] || null)
                  }
                />
              </Button>
              {selectedImageFile && (
                <Typography variant='body2' sx={{ mt: 1 }}>
                  {selectedImageFile.name}
                </Typography>
              )}
            </Box>
            <Stack direction='row' spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={assetForm.hasManual}
                    onChange={(event) =>
                      updateField('hasManual', event.target.checked)
                    }
                  />
                }
                label='Tiene manual'
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={assetForm.hasWarranty}
                    onChange={(event) =>
                      updateField('hasWarranty', event.target.checked)
                    }
                  />
                }
                label='Tiene garantía'
              />
            </Stack>
            <TextField
              {...textFieldProps('assetTechnicalSpecifications')}
              label='Especificaciones técnicas'
              value={assetForm.technicalSpecifications}
              onChange={(event) =>
                updateField('technicalSpecifications', event.target.value)
              }
              multiline
              minRows={3}
            />
            <TextField
              {...textFieldProps('assetGeneralComments')}
              label='Comentarios generales'
              value={assetForm.generalComments}
              onChange={(event) =>
                updateField('generalComments', event.target.value)
              }
              multiline
              minRows={3}
            />
            <Button
              onClick={() =>
                updateField('accessories', [
                  ...assetForm.accessories,
                  emptyAccessory()
                ])
              }
            >
              Agregar accesorio
            </Button>
            {assetForm.accessories.map((accessory, index) => (
              <Paper key={index} variant='outlined' sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      {...textFieldProps(`accessoryType-${index}`)}
                      label='Tipo accesorio'
                      value={accessory.accessoryType || ''}
                      onChange={(event) =>
                        updateAccessory(
                          index,
                          'accessoryType',
                          event.target.value
                        )
                      }
                      fullWidth
                    />
                    <TextField
                      {...textFieldProps(`accessoryBrand-${index}`)}
                      label='Marca'
                      value={accessory.brand || ''}
                      onChange={(event) =>
                        updateAccessory(index, 'brand', event.target.value)
                      }
                      fullWidth
                    />
                    <TextField
                      {...textFieldProps(`accessoryModel-${index}`)}
                      label='Modelo'
                      value={accessory.model || ''}
                      onChange={(event) =>
                        updateAccessory(index, 'model', event.target.value)
                      }
                      fullWidth
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      {...textFieldProps(`accessorySerial-${index}`)}
                      label='Serial'
                      value={accessory.serialNumber || ''}
                      onChange={(event) =>
                        updateAccessory(
                          index,
                          'serialNumber',
                          event.target.value
                        )
                      }
                      fullWidth
                    />
                    <TextField
                      {...textFieldProps(`accessoryNotes-${index}`)}
                      label='Notas'
                      value={accessory.notes || ''}
                      onChange={(event) =>
                        updateAccessory(index, 'notes', event.target.value)
                      }
                      fullWidth
                    />
                    <Button
                      color='error'
                      onClick={() =>
                        updateField(
                          'accessories',
                          assetForm.accessories.filter(
                            (_, currentIndex) => currentIndex !== index
                          )
                        )
                      }
                    >
                      Quitar
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAssetDialog}>Cancelar</Button>
          <Button variant='contained' onClick={saveAsset}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor='right'
        open={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        PaperProps={{
          sx: {
            top: { xs: 64, md: 72 },
            height: {
              xs: 'calc(100% - 64px)',
              md: 'calc(100% - 72px)'
            }
          }
        }}
      >
        <Box
          sx={{
            width: { xs: '100vw', sm: 460, md: 560 },
            maxWidth: '100%',
            p: { xs: 2, md: 3 }
          }}
        >
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='flex-start'
            spacing={2}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant='h5'
                fontWeight={700}
                sx={{ lineHeight: 1.15 }}
              >
                {selectedAsset?.name}
              </Typography>
              <Stack
                direction='row'
                spacing={1}
                sx={{ mt: 1, flexWrap: 'wrap' }}
              >
                <Chip
                  size='small'
                  label={selectedAsset?.assetCode || 'Sin código'}
                />
                <Chip
                  size='small'
                  variant='outlined'
                  label={selectedAsset?.assetType || 'Sin tipo'}
                />
                <Chip
                  size='small'
                  variant='outlined'
                  label={selectedAsset?.status || 'Sin estado'}
                />
                <Chip
                  size='small'
                  color='info'
                  variant='outlined'
                  label={`${selectedAsset?.documentCode || 'FOT-MMCS-05'} v${selectedAsset?.documentVersion || '02'}`}
                />
              </Stack>
            </Box>
            <IconButton onClick={() => setSelectedAsset(null)}>
              <Close />
            </IconButton>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ my: 2 }}
          >
            <Button
              variant='outlined'
              startIcon={<Download />}
              onClick={() => selectedAsset && downloadPdf(selectedAsset)}
            >
              PDF
            </Button>
            <Button
              variant='outlined'
              startIcon={<Edit />}
              onClick={() => selectedAsset && openEdit(selectedAsset)}
            >
              Editar
            </Button>
            <Button
              variant='contained'
              startIcon={<History />}
              onClick={() => setInterventionDialogOpen(true)}
            >
              Intervención
            </Button>
          </Stack>

          <Paper variant='outlined' sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1.25}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Ubicación
                  </Typography>
                  <Typography fontWeight={600}>
                    {selectedAsset?.location || 'N/D'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Responsable
                  </Typography>
                  <Typography fontWeight={600}>
                    {selectedAsset?.custodian || 'N/D'}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Serial
                  </Typography>
                  <Typography fontWeight={600}>
                    {selectedAsset?.serialNumber || 'N/D'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Frecuencia
                  </Typography>
                  <Typography fontWeight={600}>
                    {selectedAsset?.maintenanceFrequency || 'N/D'}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Recepción
                  </Typography>
                  <Typography fontWeight={600}>
                    {selectedAsset?.receivedDate || 'N/D'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Puesta en servicio
                  </Typography>
                  <Typography fontWeight={600}>
                    {selectedAsset?.inServiceDate || 'N/D'}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Formato documental
                  </Typography>
                  <Typography fontWeight={600}>
                    {selectedAsset?.documentCode || 'FOT-MMCS-05'} v
                    {selectedAsset?.documentVersion || '02'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Fecha formato
                  </Typography>
                  <Typography fontWeight={600}>
                    {selectedAsset?.documentDate || '2017-12-05'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>

          <Box sx={{ mt: 2 }}>
            <Typography
              variant='subtitle2'
              color='text.secondary'
              sx={{ mb: 0.75 }}
            >
              Mantenimiento base
            </Typography>
            {selectedAsset?.maintenanceTasks?.length ? (
              <Stack spacing={1.25}>
                {selectedAsset.maintenanceTasks.map((task, index) => (
                  <Paper
                    key={`${task.taskName}-${index}`}
                    variant='outlined'
                    sx={{
                      p: 1.75,
                      borderRadius: 2,
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent='space-between'
                      spacing={1}
                    >
                      <Typography fontWeight={700}>{task.taskName}</Typography>
                      <Chip
                        size='small'
                        color='success'
                        variant='outlined'
                        label={task.frequency || 'Sin periodicidad'}
                      />
                    </Stack>
                    {task.notes && (
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mt: 1 }}
                      >
                        {task.notes}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Alert severity='info'>Sin acciones base registradas.</Alert>
            )}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography
              variant='subtitle2'
              color='text.secondary'
              sx={{ mb: 0.75 }}
            >
              Comentarios
            </Typography>
            <Paper
              variant='outlined'
              sx={{ p: 2, borderRadius: 2, backgroundColor: '#fafafa' }}
            >
              <Typography variant='body2'>
                {selectedAsset?.generalComments ||
                  'Sin comentarios registrados.'}
              </Typography>
            </Paper>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box sx={{ mt: 3 }}>
            <Typography variant='h6' sx={{ mb: 1.25 }}>
              Accesorios
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {selectedAsset?.accessories?.length ? (
                selectedAsset.accessories.map((item, index) => (
                  <Paper
                    key={`${item.accessoryType}-${index}`}
                    variant='outlined'
                    sx={{ p: 1.75, borderRadius: 2 }}
                  >
                    <Typography fontWeight={700}>
                      {item.accessoryType}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mt: 0.5 }}
                    >
                      {item.brand || 'Sin marca'} • {item.model || 'Sin modelo'}{' '}
                      • {item.serialNumber || 'Sin serial'}
                    </Typography>
                    {item.notes && (
                      <Typography variant='body2' sx={{ mt: 1 }}>
                        {item.notes}
                      </Typography>
                    )}
                  </Paper>
                ))
              ) : (
                <Alert severity='info'>Sin accesorios registrados.</Alert>
              )}
            </Stack>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Typography variant='h6' sx={{ mb: 1.25 }}>
              Intervenciones
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {selectedAsset?.interventions?.length ? (
                selectedAsset.interventions.map((item) => (
                  <Paper
                    key={item.id}
                    variant='outlined'
                    sx={{ p: 1.75, borderRadius: 2 }}
                  >
                    <Typography fontWeight={700}>{item.title}</Typography>
                    <Stack
                      direction='row'
                      spacing={0.75}
                      sx={{ mt: 0.75, mb: 0.75, flexWrap: 'wrap' }}
                    >
                      <Chip
                        size='small'
                        variant='outlined'
                        label={item.interventionDate}
                      />
                      <Chip
                        size='small'
                        variant='outlined'
                        label={item.performedByName}
                      />
                    </Stack>
                    <Typography variant='body2'>{item.description}</Typography>
                    {item.observations && (
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mt: 1 }}
                      >
                        Obs: {item.observations}
                      </Typography>
                    )}
                  </Paper>
                ))
              ) : (
                <Alert severity='info'>Sin intervenciones registradas.</Alert>
              )}
            </Stack>
          </Box>
        </Box>
      </Drawer>

      <Dialog
        open={interventionDialogOpen}
        onClose={() => setInterventionDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Registrar intervención</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              {...textFieldProps('interventionDate')}
              type='date'
              label='Fecha'
              value={interventionForm.interventionDate}
              onChange={(event) =>
                setInterventionForm((current) => ({
                  ...current,
                  interventionDate: event.target.value
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              {...textFieldProps('interventionType')}
              select
              label='Tipo'
              value={interventionForm.interventionType}
              onChange={(event) =>
                setInterventionForm((current) => ({
                  ...current,
                  interventionType: event.target.value
                }))
              }
            >
              {ASSET_INTERVENTION_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              {...textFieldProps('interventionTitle')}
              label='Título'
              value={interventionForm.title}
              onChange={(event) =>
                setInterventionForm((current) => ({
                  ...current,
                  title: event.target.value
                }))
              }
            />
            <TextField
              {...textFieldProps('interventionDescription')}
              label='Descripción'
              value={interventionForm.description}
              onChange={(event) =>
                setInterventionForm((current) => ({
                  ...current,
                  description: event.target.value
                }))
              }
              multiline
              minRows={3}
            />
            <TextField
              {...textFieldProps('interventionObservations')}
              label='Observaciones'
              value={interventionForm.observations}
              onChange={(event) =>
                setInterventionForm((current) => ({
                  ...current,
                  observations: event.target.value
                }))
              }
              multiline
              minRows={2}
            />
            <TextField
              {...textFieldProps('interventionPerformedBy')}
              label='Realizado por'
              value={interventionForm.performedByName}
              onChange={(event) =>
                setInterventionForm((current) => ({
                  ...current,
                  performedByName: event.target.value
                }))
              }
            />
            <TextField
              {...textFieldProps('interventionNextActionDate')}
              type='date'
              label='Próxima acción'
              value={interventionForm.nextActionDate}
              onChange={(event) =>
                setInterventionForm((current) => ({
                  ...current,
                  nextActionDate: event.target.value
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterventionDialogOpen(false)}>
            Cancelar
          </Button>
          <Button variant='contained' onClick={saveIntervention}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(assetPendingDelete)}
        onClose={() => setAssetPendingDelete(null)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Eliminar activo</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Vas a eliminar{' '}
            <strong>{assetPendingDelete?.name || 'este activo'}</strong>
            {assetPendingDelete?.assetCode
              ? ` (${assetPendingDelete.assetCode})`
              : ''}
            . Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssetPendingDelete(null)}>Cancelar</Button>
          <Button
            color='error'
            variant='contained'
            onClick={() =>
              assetPendingDelete && deleteAsset(assetPendingDelete.id)
            }
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AssetLifeSheetsPage
