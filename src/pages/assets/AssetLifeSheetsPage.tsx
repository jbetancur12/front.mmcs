import React, { useEffect, useMemo, useState } from 'react'
import {
  Add,
  Archive,
  Build,
  Cable,
  CalendarMonth,
  CheckCircle,
  Computer,
  Close,
  Delete,
  Download,
  Edit,
  History,
  Visibility
} from '@mui/icons-material'
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Drawer,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  type TextFieldProps,
  Tooltip,
  Typography
} from '@mui/material'
import {
  type MRT_Cell,
  type MRT_ColumnDef,
  type MRT_Row
} from 'material-react-table'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import FormDialog, { FormDialogSection } from 'src/Components/Common/FormDialog'
import FormDateField from 'src/Components/Common/FormDateField'
import FileDropZone from 'src/Components/Common/FileDropZone'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'
import EmptyState from 'src/Components/Common/EmptyState'
import {
  DetailCell,
  DetailField,
  DetailSection
} from 'src/Components/Common/DetailBlocks'
import { formatDateOnly } from '@utils/dateOnly'
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
import { useQueryClient } from 'react-query'
import {
  ASSET_LIFE_SHEET_EXACT_FILTERS,
  ASSET_LIFE_SHEET_SORTABLE_FIELDS,
  ASSET_LIFE_SHEETS_QUERY_KEYS,
  fetchAllAssetLifeSheets,
  useAssetLifeSheetCounts,
  useAssetLifeSheetMutations,
  useAssetLifeSheets,
  useAssetLifeSheetsPaginated
} from '@hooks/assets/useAssetLifeSheets'
import {
  useKeepPageInRange,
  useServerTableState
} from 'src/hooks/useServerTable'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

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

const EMPTY_ASSETS: AssetLifeSheet[] = []

const tealSwitchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: '#00BFA5' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    bgcolor: '#00BFA5'
  }
}
const tealOutlineSx = {
  textTransform: 'none',
  fontWeight: 600,
  color: '#00695C',
  borderColor: '#00BFA5',
  '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
} as const
const subCardSx = {
  p: 2,
  borderRadius: '12px',
  border: '1px solid #e5e7eb'
}
const subCardGridSx = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }
}

const AssetLifeSheetsPage: React.FC = () => {
  const canManage = useCan(PERMISSIONS.ASSETS_LIFE_SHEET_MANAGE)
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)

  const queryClient = useQueryClient()
  // La tabla se pagina, busca, ordena y filtra en el servidor.
  const server = useServerTableState({
    sortableFields: ASSET_LIFE_SHEET_SORTABLE_FIELDS,
    exactFilters: ASSET_LIFE_SHEET_EXACT_FILTERS,
    initialSorting: [{ id: 'assetCode', desc: false }]
  })
  const {
    data: assetsPage,
    isLoading,
    isFetching: loading
  } = useAssetLifeSheetsPaginated(server.params)
  useKeepPageInRange(
    assetsPage?.totalPages,
    server.pagination.pageIndex,
    server.setPagination
  )
  const assets = assetsPage?.items ?? EMPTY_ASSETS
  const { data: counts } = useAssetLifeSheetCounts()
  const {
    saveAsset: saveAssetMutation,
    deleteAsset: deleteAssetMutation,
    createIntervention
  } = useAssetLifeSheetMutations()
  const [selectedAsset, setSelectedAsset] = useState<AssetLifeSheet | null>(
    null
  )
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  // Las sugerencias del formulario necesitan todos los activos: solo se piden
  // (sin paginar) mientras el formulario está abierto.
  const { data: allAssets = EMPTY_ASSETS } = useAssetLifeSheets({
    enabled: assetDialogOpen
  })
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

  useEffect(() => {
    if (!selectedAsset) return
    const refreshedAsset = assets.find((asset) => asset.id === selectedAsset.id)
    if (refreshedAsset) setSelectedAsset(refreshedAsset)
  }, [assets])

  // La foto está protegida por permisos: se pide con el token y se muestra desde una URL temporal
  const [assetImageUrl, setAssetImageUrl] = useState<string | null>(null)
  const selectedAssetId = selectedAsset?.id
  const selectedAssetImagePath = selectedAsset?.imagePath
  useEffect(() => {
    setAssetImageUrl(null)
    if (!selectedAssetId || !selectedAssetImagePath) return undefined
    let objectUrl: string | null = null
    let cancelled = false
    axiosPrivate
      .get(`/asset-life-sheets/${selectedAssetId}/image`, {
        responseType: 'blob'
      })
      .then((response) => {
        if (cancelled) return
        objectUrl = window.URL.createObjectURL(response.data)
        setAssetImageUrl(objectUrl)
      })
      .catch(() => {
        // Sin foto disponible: el encabezado queda sin miniatura
      })
    return () => {
      cancelled = true
      if (objectUrl) window.URL.revokeObjectURL(objectUrl)
    }
  }, [selectedAssetId, selectedAssetImagePath])

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

  const updateField = <K extends keyof AssetLifeSheetFormValues>(
    field: K,
    value: AssetLifeSheetFormValues[K]
  ) => {
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

      await saveAssetMutation.mutateAsync({ id: editingAssetId, formData })

      closeAssetDialog()
      bigToast('Activo guardado correctamente', 'success')
    } catch (error) {
      console.error(error)
      bigToast('No fue posible guardar el activo', 'error')
    }
  }

  const deleteAsset = async (assetId: number) => {
    try {
      await deleteAssetMutation.mutateAsync(assetId)
      setSelectedAsset((current) => (current?.id === assetId ? null : current))
      setAssetPendingDelete(null)
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
      // La exportación lleva todos los activos, no solo la página visible.
      const assets = await queryClient.fetchQuery(
        ASSET_LIFE_SHEETS_QUERY_KEYS.list,
        () => fetchAllAssetLifeSheets(axiosPrivate),
        { staleTime: 0 }
      )
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
        size: 110,
        enableColumnFilter: false
      },
      {
        accessorKey: 'name',
        header: 'Activo',
        size: 220,
        enableColumnFilter: false,
        Cell: ({ row }: { row: MRT_Row<AssetLifeSheet> }) => (
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
        Cell: ({ cell }: { cell: MRT_Cell<AssetLifeSheet> }) => {
          const status = String(cell.getValue())
          return (
            <Chip
              size='small'
              variant='outlined'
              color={
                status === 'active'
                  ? 'success'
                  : status === 'maintenance'
                    ? 'warning'
                    : 'default'
              }
              label={getOptionLabel(ASSET_STATUS_OPTIONS, status)}
            />
          )
        }
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
        Cell: ({ cell }: { cell: MRT_Cell<AssetLifeSheet> }) =>
          getOptionLabel(ASSET_CATEGORY_OPTIONS, String(cell.getValue()))
      },
      {
        accessorKey: 'location',
        header: 'Ubicación',
        size: 160,
        // Sin filtro exacto en el servidor (la búsqueda global sí la incluye).
        enableColumnFilter: false
      },
      {
        accessorKey: 'area',
        header: 'Área',
        size: 140,
        // Filtro exacto en el servidor (`area`).
        enableSorting: false,
        muiTableHeadCellFilterTextFieldProps: { placeholder: 'Valor exacto' }
      },
      {
        accessorKey: 'custodian',
        header: 'Responsable',
        size: 170,
        enableSorting: false,
        enableColumnFilter: false
      },
      {
        accessorKey: 'serialNumber',
        header: 'Serial',
        size: 160,
        // La búsqueda global incluye el serial.
        enableSorting: false,
        enableColumnFilter: false
      },
      {
        accessorKey: 'maintenanceFrequency',
        header: 'Frecuencia',
        size: 150,
        enableSorting: false,
        enableColumnFilter: false
      },
      {
        accessorKey: 'warrantyExpiresAt',
        header: 'Garantía',
        size: 130,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ cell }: { cell: MRT_Cell<AssetLifeSheet> }) =>
          formatDate(cell.getValue<string | null>())
      }
    ],
    []
  )

  const saveIntervention = async () => {
    if (!selectedAsset?.id) return
    try {
      await createIntervention.mutateAsync({
        assetId: selectedAsset.id,
        values: interventionForm
      })
      setInterventionDialogOpen(false)
      setInterventionForm((current) => ({
        ...current,
        title: '',
        description: '',
        observations: '',
        nextActionDate: ''
      }))
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
        allAssets
          .map((asset) => asset[field]?.trim())
          .filter((value): value is string => Boolean(value))
      )
    ].sort((left, right) => left.localeCompare(right, 'es'))
  }

  const assetField = (
    key: keyof AssetLifeSheetFormValues,
    label: string,
    extra: TextFieldProps = {}
  ) => (
    <TextField
      {...textFieldProps(`asset-${String(key)}`)}
      label={label}
      value={(assetForm[key] as string) ?? ''}
      onChange={(event) => updateField(key, event.target.value)}
      fullWidth
      {...extra}
    />
  )

  const suggestField = (
    key: 'location' | 'area' | 'custodian' | 'supplier',
    label: string
  ) => (
    <Autocomplete
      freeSolo
      options={getSuggestedValues(key)}
      value={assetForm[key]}
      onChange={(_, value) => updateField(key, value || '')}
      onInputChange={(_, value) => updateField(key, value)}
      fullWidth
      renderInput={(params) => (
        <TextField
          {...params}
          {...textFieldProps(`asset-${key}`)}
          label={label}
        />
      )}
    />
  )

  const assetDate = (
    key: 'receivedDate' | 'inServiceDate' | 'warrantyExpiresAt',
    label: string
  ) => (
    <FormDateField
      label={label}
      name={key}
      value={assetForm[key] || ''}
      onChange={(value) => updateField(key, value)}
    />
  )

  const setInterventionField = (
    key: keyof AssetInterventionFormValues,
    value: string
  ) => setInterventionForm((current) => ({ ...current, [key]: value }))

  const totalCount = counts?.total ?? assetsPage?.totalItems ?? 0
  const activeCount = counts?.active ?? 0

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Hoja de Vida de Activos'
        subtitle='Módulo administrativo para PCs, portátiles, TVs y equipos similares.'
        icon={<Computer />}
        actions={
          <>
            <Button
              variant='outlined'
              startIcon={<Download />}
              onClick={exportAssetsExcel}
              sx={{
                color: '#00897B',
                borderColor: '#00BFA5',
                '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
              }}
            >
              Excel
            </Button>
            <Button
              variant='outlined'
              startIcon={<CalendarMonth />}
              onClick={downloadSchedulePdf}
              sx={{
                color: '#00897B',
                borderColor: '#00BFA5',
                '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
              }}
            >
              Cronograma PDF
            </Button>
            {canManage && (
              <Button
                variant='contained'
                startIcon={<Add />}
                onClick={openCreate}
                sx={{
                  bgcolor: '#00BFA5',
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#00897B' }
                }}
              >
                Nuevo activo
              </Button>
            )}
          </>
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Activos'
            value={totalCount}
            icon={<Computer />}
            tone='teal'
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='En uso'
            value={activeCount}
            icon={<CheckCircle />}
            tone='green'
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Retirados o inactivos'
            value={Math.max(totalCount - activeCount, 0)}
            icon={<Archive />}
            tone='orange'
          />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        data={assets}
        itemLabel={['activo', 'activos']}
        searchPlaceholder='Buscar activos'
        enableRowActions
        {...server.tableProps}
        rowCount={assetsPage?.totalItems ?? 0}
        state={{
          ...server.tableState,
          isLoading,
          showProgressBars: loading && !isLoading
        }}
        initialState={{ density: 'compact' }}
        displayColumnDefOptions={{
          'mrt-row-actions': { header: 'Acciones', size: 170 }
        }}
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex' }}>
            <Tooltip title='Ver'>
              <IconButton
                size='small'
                aria-label={`Ver ${row.original.assetCode}`}
                sx={{ color: '#00695C' }}
                onClick={() => setSelectedAsset(row.original)}
              >
                <Visibility fontSize='small' />
              </IconButton>
            </Tooltip>
            {canManage && (
              <Tooltip title='Editar'>
                <IconButton
                  size='small'
                  aria-label={`Editar ${row.original.assetCode}`}
                  sx={{ color: '#2563eb' }}
                  onClick={() => openEdit(row.original)}
                >
                  <Edit fontSize='small' />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title='Descargar PDF'>
              <IconButton
                size='small'
                aria-label={`Descargar PDF de ${row.original.assetCode}`}
                sx={{ color: '#4b5563' }}
                onClick={() => downloadPdf(row.original)}
              >
                <Download fontSize='small' />
              </IconButton>
            </Tooltip>
            {canManage && (
              <Tooltip title='Eliminar'>
                <IconButton
                  size='small'
                  aria-label={`Eliminar ${row.original.assetCode}`}
                  color='error'
                  onClick={() => setAssetPendingDelete(row.original)}
                >
                  <Delete fontSize='small' />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      />

      <FormDialog
        open={assetDialogOpen}
        onClose={closeAssetDialog}
        title={editingAssetId ? 'Editar activo' : 'Crear activo'}
        subtitle={editingAssetId ? assetForm.name : undefined}
        submitLabel='Guardar'
        onSubmit={saveAsset}
        loading={saveAssetMutation.isLoading}
        maxWidth='md'
      >
        <FormDialogSection title='Identificación'>
          {assetField('assetCode', 'Código')}
          {assetField('name', 'Nombre')}
          {assetField('assetType', 'Tipo', {
            select: true,
            children: ASSET_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))
          })}
          {assetField('assetCategory', 'Categoría', {
            select: true,
            children: ASSET_CATEGORY_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))
          })}
          {assetField('status', 'Estado', {
            select: true,
            children: ASSET_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))
          })}
          {suggestField('custodian', 'Responsable')}
        </FormDialogSection>

        <FormDialogSection title='Equipo y ubicación'>
          {assetField('brand', 'Marca')}
          {assetField('model', 'Modelo')}
          {assetField('serialNumber', 'Serial')}
          {suggestField('supplier', 'Proveedor')}
          {suggestField('location', 'Ubicación')}
          {suggestField('area', 'Área')}
        </FormDialogSection>

        <FormDialogSection
          title='Hardware'
          description='Solo aplica a computadores y portátiles.'
        >
          {assetField('processor', 'Procesador')}
          {assetField('ram', 'RAM')}
          {assetField('storage', 'Almacenamiento')}
          {assetField('operatingSystem', 'Sistema operativo')}
          <Box sx={{ gridColumn: '1 / -1' }}>
            {assetField(
              'technicalSpecifications',
              'Especificaciones técnicas',
              {
                multiline: true,
                minRows: 3
              }
            )}
          </Box>
        </FormDialogSection>

        <FormDialogSection title='Fechas y garantía'>
          {assetDate('receivedDate', 'Fecha de recepción')}
          {assetDate('inServiceDate', 'Puesta en servicio')}
          {assetDate('warrantyExpiresAt', 'Vence la garantía')}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={assetForm.hasManual}
                  onChange={(event) =>
                    updateField('hasManual', event.target.checked)
                  }
                  sx={tealSwitchSx}
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
                  sx={tealSwitchSx}
                />
              }
              label='Tiene garantía'
            />
          </Box>
        </FormDialogSection>

        <FormDialogSection
          title='Base de mantenimiento'
          description='Acciones periódicas que deben quedar programadas para este equipo.'
        >
          <Box sx={{ gridColumn: '1 / -1' }}>
            {assetField('maintenanceFrequency', 'Frecuencia de mantenimiento')}
          </Box>
          {assetForm.maintenanceTasks.map((task, index) => (
            <Paper
              key={`maintenance-task-${index}`}
              elevation={0}
              sx={{ ...subCardSx, gridColumn: '1 / -1' }}
            >
              <Box sx={subCardGridSx}>
                <TextField
                  {...textFieldProps(`maintenanceTaskName-${index}`)}
                  label='Acción de mantenimiento'
                  value={task.taskName || ''}
                  onChange={(event) =>
                    updateMaintenanceTask(index, 'taskName', event.target.value)
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
                  fullWidth
                >
                  {ASSET_MAINTENANCE_FREQUENCY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  {...textFieldProps(`maintenanceTaskNotes-${index}`)}
                  label='Notas'
                  value={task.notes || ''}
                  onChange={(event) =>
                    updateMaintenanceTask(index, 'notes', event.target.value)
                  }
                  fullWidth
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    color='error'
                    startIcon={<Delete />}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
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
                </Box>
              </Box>
            </Paper>
          ))}
          {!assetForm.maintenanceTasks.length && (
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ gridColumn: '1 / -1' }}
            >
              Aún no hay acciones base configuradas.
            </Typography>
          )}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Button
              variant='outlined'
              startIcon={<Add />}
              sx={tealOutlineSx}
              onClick={() =>
                updateField('maintenanceTasks', [
                  ...assetForm.maintenanceTasks,
                  emptyMaintenanceTask()
                ])
              }
            >
              Agregar acción
            </Button>
          </Box>
        </FormDialogSection>

        <FormDialogSection
          title='Accesorios'
          description='Periféricos y complementos que acompañan al equipo.'
        >
          {assetForm.accessories.map((accessory, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{ ...subCardSx, gridColumn: '1 / -1' }}
            >
              <Box sx={subCardGridSx}>
                <TextField
                  {...textFieldProps(`accessoryType-${index}`)}
                  label='Tipo de accesorio'
                  value={accessory.accessoryType || ''}
                  onChange={(event) =>
                    updateAccessory(index, 'accessoryType', event.target.value)
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
                <TextField
                  {...textFieldProps(`accessorySerial-${index}`)}
                  label='Serial'
                  value={accessory.serialNumber || ''}
                  onChange={(event) =>
                    updateAccessory(index, 'serialNumber', event.target.value)
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    color='error'
                    startIcon={<Delete />}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
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
                </Box>
              </Box>
            </Paper>
          ))}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Button
              variant='outlined'
              startIcon={<Add />}
              sx={tealOutlineSx}
              onClick={() =>
                updateField('accessories', [
                  ...assetForm.accessories,
                  emptyAccessory()
                ])
              }
            >
              Agregar accesorio
            </Button>
          </Box>
        </FormDialogSection>

        <FormDialogSection title='Imagen y comentarios'>
          <Box sx={{ gridColumn: '1 / -1' }}>
            <FileDropZone
              file={selectedImageFile}
              onFileSelected={setSelectedImageFile}
              onReject={(message) => bigToast(message, 'error')}
              accept='image/*'
              acceptLabel='imagen'
              title='Arrastra la imagen del activo o haz clic para elegirla'
              hint='JPG, PNG o WEBP, hasta 10 MB'
            />
          </Box>
          <Box sx={{ gridColumn: '1 / -1' }}>
            {assetField('generalComments', 'Comentarios generales', {
              multiline: true,
              minRows: 3
            })}
          </Box>
        </FormDialogSection>
      </FormDialog>

      <Drawer
        anchor='right'
        open={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        PaperProps={{
          sx: {
            // Debajo de la barra superior de la aplicación
            top: { xs: 64, md: 72 },
            height: { xs: 'calc(100% - 64px)', md: 'calc(100% - 72px)' },
            width: { xs: '100vw', sm: 480, md: 560 },
            maxWidth: '100%',
            borderTopLeftRadius: { sm: '16px' },
            borderBottomLeftRadius: { sm: '16px' }
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            // Mismo foco turquesa que los demás formularios
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
              { borderColor: '#00897B' }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 1,
              px: 3,
              pt: 2.5,
              pb: 2,
              borderBottom: '1px solid #e5e7eb'
            }}
          >
            <Stack
              direction='row'
              spacing={1.5}
              alignItems='center'
              sx={{ minWidth: 0 }}
            >
              {assetImageUrl && (
                <Avatar
                  variant='rounded'
                  src={assetImageUrl}
                  alt={`Foto de ${selectedAsset?.name ?? 'activo'}`}
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    bgcolor: '#f3f4f6'
                  }}
                />
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant='h6'
                  component='h2'
                  fontWeight={700}
                  sx={{ lineHeight: 1.2 }}
                >
                  {selectedAsset?.name}
                </Typography>
                <Stack
                  direction='row'
                  spacing={1}
                  alignItems='center'
                  sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    {[selectedAsset?.assetCode, selectedAsset?.assetType]
                      .filter(Boolean)
                      .join(' · ') || 'Sin código'}
                  </Typography>
                  <Chip
                    size='small'
                    variant='outlined'
                    color={
                      selectedAsset?.status === 'active'
                        ? 'success'
                        : selectedAsset?.status === 'maintenance'
                          ? 'warning'
                          : 'default'
                    }
                    label={getOptionLabel(
                      ASSET_STATUS_OPTIONS,
                      selectedAsset?.status
                    )}
                  />
                </Stack>
              </Box>
            </Stack>
            <IconButton
              aria-label='Cerrar'
              edge='end'
              onClick={() => setSelectedAsset(null)}
            >
              <Close />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ mb: 3 }}
            >
              <Button
                variant='outlined'
                startIcon={<Download />}
                sx={tealOutlineSx}
                onClick={() => selectedAsset && downloadPdf(selectedAsset)}
              >
                PDF
              </Button>
              {canManage && (
                <Button
                  variant='outlined'
                  startIcon={<Edit />}
                  sx={tealOutlineSx}
                  onClick={() => selectedAsset && openEdit(selectedAsset)}
                >
                  Editar
                </Button>
              )}
              {canManage && (
                <Button
                  variant='contained'
                  startIcon={<History />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: '#00BFA5',
                    '&:hover': { bgcolor: '#00897B' }
                  }}
                  onClick={() => setInterventionDialogOpen(true)}
                >
                  Registrar intervención
                </Button>
              )}
            </Stack>

            <DetailSection title='Datos del activo'>
              <DetailCell>
                <DetailField label='Ubicación'>
                  {selectedAsset?.location || 'Sin registrar'}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Responsable'>
                  {selectedAsset?.custodian || 'Sin registrar'}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Serial'>
                  {selectedAsset?.serialNumber || 'Sin registrar'}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Frecuencia de mantenimiento'>
                  {selectedAsset?.maintenanceFrequency || 'Sin registrar'}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Recepción'>
                  {formatDateOnly(selectedAsset?.receivedDate) ||
                    'Sin registrar'}
                </DetailField>
              </DetailCell>
              <DetailCell>
                <DetailField label='Puesta en servicio'>
                  {formatDateOnly(selectedAsset?.inServiceDate) ||
                    'Sin registrar'}
                </DetailField>
              </DetailCell>
              {selectedAsset?.documentCode && (
                <DetailCell>
                  <DetailField label='Formato documental'>
                    {selectedAsset.documentCode}
                    {selectedAsset.documentVersion
                      ? ` v${selectedAsset.documentVersion}`
                      : ''}
                  </DetailField>
                </DetailCell>
              )}
              {selectedAsset?.documentDate && (
                <DetailCell>
                  <DetailField label='Fecha del formato'>
                    {formatDateOnly(selectedAsset.documentDate) ||
                      'Sin registrar'}
                  </DetailField>
                </DetailCell>
              )}
            </DetailSection>

            <DetailSection title='Mantenimiento base'>
              <DetailCell full>
                {selectedAsset?.maintenanceTasks?.length ? (
                  <Stack spacing={1}>
                    {selectedAsset.maintenanceTasks.map((task, index) => (
                      <Box
                        key={`${task.taskName}-${index}`}
                        sx={{
                          p: 1.5,
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb',
                          bgcolor: '#f9fafb'
                        }}
                      >
                        <Stack
                          direction='row'
                          justifyContent='space-between'
                          alignItems='center'
                          spacing={1}
                        >
                          <Typography fontWeight={600}>
                            {task.taskName}
                          </Typography>
                          <Chip
                            size='small'
                            variant='outlined'
                            color='success'
                            label={task.frequency || 'Sin periodicidad'}
                          />
                        </Stack>
                        {task.notes && (
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ mt: 0.5 }}
                          >
                            {task.notes}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <EmptyState
                    compact
                    icon={<Build />}
                    title='Sin acciones base'
                    hint='Agrégalas desde Editar para programar el mantenimiento.'
                  />
                )}
              </DetailCell>
            </DetailSection>

            <DetailSection title='Comentarios'>
              <DetailCell full>
                <DetailField label='Comentarios generales'>
                  {selectedAsset?.generalComments || 'Sin comentarios'}
                </DetailField>
              </DetailCell>
            </DetailSection>

            <DetailSection title='Accesorios'>
              <DetailCell full>
                {selectedAsset?.accessories?.length ? (
                  <Stack spacing={1}>
                    {selectedAsset.accessories.map((item, index) => (
                      <Box
                        key={`${item.accessoryType}-${index}`}
                        sx={{
                          p: 1.5,
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <Typography fontWeight={600}>
                          {item.accessoryType}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {[item.brand, item.model, item.serialNumber]
                            .filter(Boolean)
                            .join(' · ') || 'Sin detalle'}
                        </Typography>
                        {item.notes && (
                          <Typography variant='body2' sx={{ mt: 0.5 }}>
                            {item.notes}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <EmptyState compact icon={<Cable />} title='Sin accesorios' />
                )}
              </DetailCell>
            </DetailSection>

            <DetailSection title='Intervenciones'>
              <DetailCell full>
                {selectedAsset?.interventions?.length ? (
                  <Stack spacing={1}>
                    {[...selectedAsset.interventions]
                      .sort((a, b) =>
                        String(b.interventionDate).localeCompare(
                          String(a.interventionDate)
                        )
                      )
                      .map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          <Stack
                            direction='row'
                            justifyContent='space-between'
                            alignItems='flex-start'
                            spacing={1}
                          >
                            <Typography fontWeight={600}>
                              {item.title}
                            </Typography>
                            <Chip
                              size='small'
                              variant='outlined'
                              label={getOptionLabel(
                                ASSET_INTERVENTION_TYPE_OPTIONS,
                                item.interventionType
                              )}
                            />
                          </Stack>
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            sx={{ display: 'block', mt: 0.25 }}
                          >
                            {formatDateOnly(item.interventionDate) ||
                              'Sin fecha'}{' '}
                            · {item.performedByName}
                            {item.nextActionDate
                              ? ` · Próxima acción: ${formatDateOnly(item.nextActionDate)}`
                              : ''}
                          </Typography>
                          {item.description && (
                            <Typography variant='body2' sx={{ mt: 0.75 }}>
                              {item.description}
                            </Typography>
                          )}
                          {item.observations && (
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              sx={{ mt: 0.5 }}
                            >
                              Observaciones: {item.observations}
                            </Typography>
                          )}
                        </Box>
                      ))}
                  </Stack>
                ) : (
                  <EmptyState
                    compact
                    icon={<History />}
                    title='Sin intervenciones'
                    hint='Registra la primera para empezar el historial.'
                  />
                )}
              </DetailCell>
            </DetailSection>
          </Box>
        </Box>
      </Drawer>

      <FormDialog
        open={interventionDialogOpen}
        onClose={() => setInterventionDialogOpen(false)}
        title='Registrar intervención'
        subtitle={selectedAsset?.name}
        submitLabel='Guardar'
        onSubmit={saveIntervention}
        loading={createIntervention.isLoading}
        maxWidth='sm'
      >
        <FormDialogSection title='Intervención'>
          <FormDateField
            label='Fecha'
            name='interventionDate'
            value={interventionForm.interventionDate}
            onChange={(value) =>
              setInterventionField('interventionDate', value)
            }
          />
          <TextField
            {...textFieldProps('interventionType')}
            select
            label='Tipo'
            value={interventionForm.interventionType}
            onChange={(event) =>
              setInterventionField('interventionType', event.target.value)
            }
            fullWidth
          >
            {ASSET_INTERVENTION_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              {...textFieldProps('interventionTitle')}
              label='Título'
              value={interventionForm.title}
              onChange={(event) =>
                setInterventionField('title', event.target.value)
              }
              fullWidth
            />
          </Box>
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              {...textFieldProps('interventionDescription')}
              label='Descripción'
              value={interventionForm.description}
              onChange={(event) =>
                setInterventionField('description', event.target.value)
              }
              multiline
              minRows={3}
              fullWidth
            />
          </Box>
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              {...textFieldProps('interventionObservations')}
              label='Observaciones'
              value={interventionForm.observations}
              onChange={(event) =>
                setInterventionField('observations', event.target.value)
              }
              multiline
              minRows={2}
              fullWidth
            />
          </Box>
          <TextField
            {...textFieldProps('interventionPerformedBy')}
            label='Realizado por'
            value={interventionForm.performedByName}
            onChange={(event) =>
              setInterventionField('performedByName', event.target.value)
            }
            fullWidth
          />
          <FormDateField
            label='Próxima acción'
            name='interventionNextActionDate'
            value={interventionForm.nextActionDate}
            onChange={(value) => setInterventionField('nextActionDate', value)}
          />
        </FormDialogSection>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(assetPendingDelete)}
        tone='danger'
        title='Eliminar activo'
        message={
          <>
            Vas a eliminar{' '}
            <strong>{assetPendingDelete?.name || 'este activo'}</strong>
            {assetPendingDelete?.assetCode
              ? ` (${assetPendingDelete.assetCode})`
              : ''}
            . Esta acción no se puede deshacer.
          </>
        }
        confirmLabel='Eliminar'
        loading={deleteAssetMutation.isLoading}
        onConfirm={() =>
          assetPendingDelete && deleteAsset(assetPendingDelete.id)
        }
        onClose={() => setAssetPendingDelete(null)}
      />
    </Container>
  )
}

export default AssetLifeSheetsPage
