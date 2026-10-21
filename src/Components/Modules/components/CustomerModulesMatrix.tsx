import React, { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_RowSelectionState
} from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  Grid,
  Link,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { Business, CheckCircle, DomainDisabled, School, ToggleOff, ToggleOn, VerifiedUser } from '@mui/icons-material'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import ConfirmDialog from 'src/Components/Common/ConfirmDialog'
import { useCan } from '@utils/functions'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCustomerModulesMatrix, useSetCustomersModule } from 'src/hooks/useCustomerModules'
import {
  CustomerModuleCell,
  CustomerModulesRow,
  LicensableModule
} from 'src/types/customerModules'
import { bigToast } from '../../ExcelManipulation/Utils'

type RowProps = { row: MRT_Row<CustomerModulesRow> }

const MODULE_ICONS: Record<string, React.ReactElement> = {
  lms: <School />,
  tecnovigilancia: <VerifiedUser />
}

const isOn = (cell: CustomerModuleCell | null | undefined) => Boolean(cell?.isActive)
// Solo `false` explícito es inactivo: un cliente sin estado se trata como activo
const isInactive = (customer: CustomerModulesRow) => customer.isActive === false

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })

const cellTooltip = (cell: CustomerModuleCell | null | undefined) => {
  if (!cell) return 'Nunca asignado'
  const verb = cell.isActive ? 'Activado' : 'Desactivado'
  return cell.updatedBy
    ? `${verb} por ${cell.updatedBy.nombre} el ${formatDate(cell.updatedAt)}`
    : `${verb} el ${formatDate(cell.updatedAt)}`
}

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
  'No se pudo actualizar el módulo'

interface PendingChange {
  customerIds: number[]
  module: LicensableModule
  isActive: boolean
  /** Nombre del cliente cuando es una sola celda. */
  customerName?: string
  /** Cuántos de los clientes afectados están inactivos. */
  inactiveCount: number
}

const CustomerModulesMatrix: React.FC = () => {
  const canAssign = useCan(PERMISSIONS.CUSTOMERS_MODULE_ASSIGN)
  const { data, isLoading, isError, refetch } = useCustomerModulesMatrix()
  const setModule = useSetCustomersModule()

  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({})
  const [bulkModuleId, setBulkModuleId] = useState<number | ''>('')
  const [pending, setPending] = useState<PendingChange | null>(null)
  const [showLegacy, setShowLegacy] = useState(false)
  // Por defecto solo clientes activos: los inactivos no pueden entrar, así que su licencia no da acceso
  const [showInactive, setShowInactive] = useState(false)

  const modules = useMemo(() => data?.modules ?? [], [data])
  const customers = useMemo(() => data?.customers ?? [], [data])
  const customerName = useMemo(
    () => new Map(customers.map((c) => [c.id, c.nombre])),
    [customers]
  )
  const activeCustomers = useMemo(() => customers.filter((c) => !isInactive(c)), [customers])
  const inactiveCustomers = useMemo(() => customers.filter(isInactive), [customers])
  const visibleCustomers = showInactive ? inactiveCustomers : activeCustomers
  const inactiveIds = useMemo(() => new Set(inactiveCustomers.map((c) => c.id)), [inactiveCustomers])

  const changeScope = (inactive: boolean) => {
    if (inactive === showInactive) return
    setShowInactive(inactive)
    setRowSelection({}) // la selección no se arrastra entre activos e inactivos
  }
  const selectedIds = Object.keys(rowSelection)
    .filter((id) => rowSelection[id])
    .map(Number)
  const effectiveBulkModuleId = bulkModuleId || (modules.length === 1 ? modules[0].id : '')

  const apply = async (change: PendingChange) => {
    try {
      const result = await setModule.mutateAsync({
        customerIds: change.customerIds,
        moduleId: change.module.id,
        isActive: change.isActive
      })
      const changed = result.updated + result.created
      const verb = change.isActive ? 'activado' : 'desactivado'
      bigToast(
        change.customerIds.length === 1
          ? `${change.module.label} ${verb}`
          : `${change.module.label} ${verb} en ${changed} cliente${changed === 1 ? '' : 's'}` +
              (result.unchanged ? ` (${result.unchanged} ya estaban así)` : ''),
        'success'
      )
      if (change.customerIds.length > 1) setRowSelection({})
    } catch (error) {
      bigToast(errorMessage(error), 'error')
    } finally {
      setPending(null)
    }
  }

  // Activar una celda es inmediato; quitar acceso o tocar varios clientes pide confirmación.
  const requestCellChange = (row: CustomerModulesRow, module: LicensableModule, isActive: boolean) => {
    const inactive = isInactive(row)
    const change = { customerIds: [row.id], module, isActive, customerName: row.nombre, inactiveCount: inactive ? 1 : 0 }
    if (isActive && !inactive) apply(change)
    else setPending(change)
  }

  const requestBulk = (isActive: boolean) => {
    const module = modules.find((m) => m.id === effectiveBulkModuleId)
    if (!module || selectedIds.length === 0) return
    setPending({
      customerIds: selectedIds,
      module,
      isActive,
      inactiveCount: selectedIds.filter((id) => inactiveIds.has(id)).length
    })
  }

  const columns = useMemo<MRT_ColumnDef<CustomerModulesRow>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Cliente',
        size: 280,
        Cell: ({ row }: RowProps) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#00BFA5', fontSize: 14 }}>
              {row.original.nombre?.charAt(0) ?? '?'}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Link
                component={RouterLink}
                to={`/customers/${row.original.id}`}
                underline='hover'
                sx={{ fontWeight: 600, color: 'text.primary', display: 'block' }}
              >
                {row.original.nombre}
              </Link>
              <Typography variant='caption' color='text.secondary'>
                {row.original.identificacion ? `NIT ${row.original.identificacion}` : `ID ${row.original.id}`}
              </Typography>
            </Box>
          </Box>
        )
      },
      {
        accessorKey: 'identificacion',
        header: 'NIT',
        enableHiding: true
      },
      {
        accessorKey: 'ciudad',
        header: 'Ciudad',
        size: 140,
        Cell: ({ row }: RowProps) => row.original.ciudad || '—'
      },
      {
        id: 'estado',
        header: 'Estado',
        size: 120,
        accessorFn: (row) => (row.isActive === false ? 'Inactivo' : 'Activo'),
        filterVariant: 'select',
        filterSelectOptions: ['Activo', 'Inactivo'],
        Cell: ({ row }: RowProps) => (
          <Chip
            size='small'
            variant='outlined'
            color={row.original.isActive === false ? 'default' : 'success'}
            label={row.original.isActive === false ? 'Inactivo' : 'Activo'}
          />
        )
      },
      ...modules.map<MRT_ColumnDef<CustomerModulesRow>>((module) => ({
        id: `module-${module.id}`,
        header: module.label,
        size: 150,
        accessorFn: (row) => (isOn(row.modules[module.id]) ? 'Habilitado' : 'Deshabilitado'),
        filterVariant: 'select',
        filterSelectOptions: ['Habilitado', 'Deshabilitado'],
        muiTableHeadCellProps: { align: 'center' },
        muiTableBodyCellProps: { align: 'center' },
        Cell: ({ row }: RowProps) => {
          const cell = row.original.modules[module.id]
          return (
            <Tooltip title={cellTooltip(cell)} arrow>
              <span>
                <Switch
                  checked={isOn(cell)}
                  disabled={!canAssign}
                  onChange={(event) => requestCellChange(row.original, module, event.target.checked)}
                  inputProps={{ 'aria-label': `${module.label} para ${row.original.nombre}` }}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#00BFA5' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#00BFA5' }
                  }}
                />
              </span>
            </Tooltip>
          )
        }
      }))
    ],
    // requestCellChange solo usa setters y apply; se recrea con los módulos y el permiso
    [modules, canAssign]
  )

  // Los totales cuentan solo clientes activos: son los únicos con acceso real
  const activeCount = (moduleId: number) =>
    activeCustomers.filter((c) => isOn(c.modules[moduleId])).length
  const legacy = data?.legacyInternal ?? []

  const pendingCount = pending?.customerIds.length ?? 0
  const pendingMessage = pending && (
    <>
      {pending.customerName ? (
        <>
          {pending.inactiveCount > 0 ? (
            <>
              <strong>{pending.customerName}</strong> quedará con <strong>{pending.module.label}</strong>{' '}
              {pending.isActive ? 'habilitado' : 'deshabilitado'}.
            </>
          ) : (
            <>
              <strong>{pending.customerName}</strong> {pending.isActive ? 'tendrá' : 'dejará de tener'} acceso a{' '}
              <strong>{pending.module.label}</strong>.
            </>
          )}
        </>
      ) : (
        <>
          Vas a {pending.isActive ? 'activar' : 'desactivar'} <strong>{pending.module.label}</strong> en{' '}
          <strong>{pendingCount} cliente{pendingCount === 1 ? '' : 's'}</strong>.
        </>
      )}
      {!pending.isActive && pending.inactiveCount < pendingCount && ' Sus usuarios dejan de ver el módulo de inmediato.'}
      {pending.inactiveCount > 0 && (
        <Alert severity='warning' sx={{ mt: 2 }}>
          {pending.customerName
            ? 'Este cliente está inactivo: sus usuarios no pueden entrar, así que el cambio aplica cuando se reactive.'
            : `${pending.inactiveCount} de ${pendingCount === pending.inactiveCount ? 'estos' : 'los'} cliente${
                pending.inactiveCount === 1 ? ' está inactivo' : 's están inactivos'
              }: el cambio les aplica cuando se reactiven.`}
        </Alert>
      )}
    </>
  )

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <LmsStatCard variant='quiet'
            label='Clientes activos'
            value={activeCustomers.length}
            icon={<Business />}
            tone='teal'
            active={!showInactive}
            caption={showInactive ? 'Ver clientes activos' : undefined}
            onClick={() => changeScope(false)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LmsStatCard variant='quiet'
            label='Clientes inactivos'
            value={inactiveCustomers.length}
            icon={<DomainDisabled />}
            tone='orange'
            active={showInactive}
            caption={showInactive ? 'Mostrando inactivos' : 'Ver inactivos'}
            onClick={() => changeScope(true)}
          />
        </Grid>
        {modules.map((module) => (
          <Grid item xs={12} sm={6} md={3} key={module.id}>
            <LmsStatCard variant='quiet'
              label={`Con ${module.label}`}
              value={activeCount(module.id)}
              icon={MODULE_ICONS[module.name] ?? <CheckCircle />}
              tone='teal'
              caption={`de ${activeCustomers.length} activos`}
            />
          </Grid>
        ))}
      </Grid>

      {isError && (
        <Alert
          severity='error'
          sx={{ mb: 2 }}
          action={
            <Button color='inherit' size='small' onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        >
          No se pudieron cargar los módulos de los clientes.
        </Alert>
      )}

      {legacy.length > 0 && (
        <Alert
          severity='info'
          sx={{ mb: 2 }}
          action={
            <Button color='inherit' size='small' onClick={() => setShowLegacy((v) => !v)}>
              {showLegacy ? 'Ocultar' : 'Ver'}
            </Button>
          }
        >
          {legacy.length} cliente{legacy.length === 1 ? ' tiene' : 's tienen'} activo un módulo interno de una
          configuración antigua. No les da acceso, pero conviene revisarlo desde su perfil.
          <Collapse in={showLegacy}>
            <Box component='ul' sx={{ m: 0, mt: 1, pl: 2.5 }}>
              {legacy.map((item) => (
                <li key={item.customerId}>
                  <Link component={RouterLink} to={`/customers/${item.customerId}`}>
                    {customerName.get(item.customerId) ?? `Cliente ${item.customerId}`}
                  </Link>{' '}
                  — {item.modules.join(', ')}
                </li>
              ))}
            </Box>
          </Collapse>
        </Alert>
      )}

      {showInactive && (
        <Alert
          severity='warning'
          sx={{ mb: 2 }}
          action={
            <Button color='inherit' size='small' onClick={() => changeScope(false)}>
              Ver activos
            </Button>
          }
        >
          Estás viendo clientes inactivos: sus usuarios no pueden entrar. Puedes dejarles los módulos listos para cuando se
          reactiven.
        </Alert>
      )}

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <MaterialReactTable
          columns={columns}
          data={visibleCustomers}
          localization={MRT_Localization_ES}
          // Mientras carga, MRT pinta filas de relleno sin id: sin clave propia React deja filas fantasma
          getRowId={(row, index) => (row?.id != null ? String(row.id) : `loading-${index}`)}
          state={{ isLoading, rowSelection, showProgressBars: setModule.isLoading }}
          enableRowSelection={canAssign}
          onRowSelectionChange={setRowSelection}
          positionToolbarAlertBanner='bottom'
          enableColumnActions={false}
          enableDensityToggle={false}
          enableFullScreenToggle={false}
          enableStickyHeader
          muiTableBodyRowProps={({ row }) => ({
            sx: isInactive(row.original) ? { opacity: 0.65 } : undefined
          })}
          initialState={{
            density: 'comfortable',
            showGlobalFilter: true,
            columnVisibility: { identificacion: false },
            pagination: { pageSize: 25, pageIndex: 0 }
          }}
          muiSearchTextFieldProps={{
            placeholder: 'Buscar cliente, NIT o ciudad…',
            sx: { minWidth: '300px' },
            variant: 'outlined',
            inputProps: { 'aria-label': 'Buscar clientes' }
          }}
          renderTopToolbarCustomActions={() =>
            canAssign && selectedIds.length > 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant='body2' fontWeight={600} sx={{ mr: 1 }}>
                  {selectedIds.length} seleccionado{selectedIds.length === 1 ? '' : 's'}
                </Typography>
                {modules.length > 1 && (
                  <TextField
                    select
                    size='small'
                    label='Módulo'
                    value={effectiveBulkModuleId}
                    onChange={(e) => setBulkModuleId(Number(e.target.value))}
                    sx={{ minWidth: 180 }}
                  >
                    {modules.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                <Button
                  variant='contained'
                  size='small'
                  startIcon={<ToggleOn />}
                  disabled={!effectiveBulkModuleId || setModule.isLoading}
                  onClick={() => requestBulk(true)}
                  sx={{ textTransform: 'none', bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00ACC1' } }}
                >
                  Activar{modules.length === 1 ? ` ${modules[0].label}` : ''}
                </Button>
                <Button
                  variant='outlined'
                  size='small'
                  color='error'
                  startIcon={<ToggleOff />}
                  disabled={!effectiveBulkModuleId || setModule.isLoading}
                  onClick={() => requestBulk(false)}
                  sx={{ textTransform: 'none' }}
                >
                  Desactivar
                </Button>
              </Box>
            ) : (
              <Typography variant='body2' color='text.secondary' sx={{ alignSelf: 'center', pl: 1 }}>
                {canAssign
                  ? 'Selecciona clientes para activar o desactivar un módulo a varios a la vez.'
                  : 'Solo lectura: no tienes permiso para asignar módulos.'}
              </Typography>
            )
          }
          muiTableProps={{
            sx: {
              '& .MuiTableHead-root .MuiTableCell-root': { backgroundColor: '#f5f5f5', fontWeight: 600 },
              '& .MuiTableBody-root .MuiTableRow-root:hover': { backgroundColor: 'rgba(0, 191, 165, 0.04)' }
            }
          }}
          muiTopToolbarProps={{ sx: { backgroundColor: '#fafafa' } }}
          muiBottomToolbarProps={{ sx: { backgroundColor: '#fafafa' } }}
        />
      </Paper>

      <ConfirmDialog
        open={Boolean(pending)}
        title={
          pending?.isActive
            ? `Activar ${pending.module.label}`
            : `Desactivar ${pending?.module.label ?? 'módulo'}`
        }
        message={pendingMessage}
        confirmLabel={pending?.isActive ? 'Activar' : 'Desactivar'}
        tone={pending?.isActive ? 'default' : 'danger'}
        loading={setModule.isLoading}
        onConfirm={() => pending && apply(pending)}
        onClose={() => setPending(null)}
      />
    </>
  )
}

export default CustomerModulesMatrix
