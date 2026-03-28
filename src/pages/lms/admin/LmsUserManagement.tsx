import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  PersonOff as PersonOffIcon,
  Person as PersonIcon
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

type LmsRoleOption = {
  id: number
  name: string
  description?: string | null
}

type CustomerOption = {
  id: number
  name: string
  isActive: boolean
}

type LmsUser = {
  id: number
  name: string
  email: string
  active: boolean
  userType: 'internal' | 'client'
  customerId: number | null
  customerName: string | null
  roles: string[]
  lmsOnly: boolean
}

type LmsUserOptions = {
  roles: LmsRoleOption[]
  customers: CustomerOption[]
  defaults: {
    internalRoles: string[]
    clientRoles: string[]
    lmsOnlyRole: string
    generatedPassword: string
  }
}

type LmsUserForm = {
  nombre: string
  email: string
  password: string
  userType: 'internal' | 'client'
  customerId: string
  roles: string[]
  lmsOnly: boolean
  active: boolean
}

const emptyForm: LmsUserForm = {
  nombre: '',
  email: '',
  password: '',
  userType: 'internal',
  customerId: '',
  roles: ['employee'],
  lmsOnly: false,
  active: true
}

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value)

const getRoleLabel = (roleName: string, description?: string | null) => {
  const baseLabel =
    roleName === 'Training Manager'
      ? 'Gestor de Capacitación'
      : roleName === 'employee'
        ? 'Empleado interno'
        : roleName === 'user'
          ? 'Usuario cliente'
          : roleName

  return description ? `${baseLabel}: ${description}` : baseLabel
}

const getCompactRoleLabel = (roleName: string) => {
  if (roleName === 'Training Manager') return 'Gestor LMS'
  if (roleName === 'employee') return 'Empleado'
  if (roleName === 'user') return 'Cliente'
  if (roleName === 'maintenance_coordinator') return 'Coord. mantenimiento'
  if (roleName === 'metrologist') return 'Metrólogo'
  if (roleName === 'technician') return 'Técnico'
  return roleName
}

const LmsUserManagement: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'internal' | 'client'>('all')
  const [lmsOnlyFilter, setLmsOnlyFilter] = useState<'all' | 'only' | 'mixed'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<LmsUser | null>(null)
  const [form, setForm] = useState<LmsUserForm>(emptyForm)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  const { data: optionsData } = useQuery<LmsUserOptions>(
    ['lms-user-options'],
    async () => {
      const response = await axiosPrivate.get('/lms/users/options')
      return response.data.data
    }
  )

  const { data: usersData, isLoading } = useQuery<LmsUser[]>(
    ['lms-users', userTypeFilter, lmsOnlyFilter, activeFilter, search],
    async () => {
      const response = await axiosPrivate.get('/lms/users', {
        params: {
          userType: userTypeFilter === 'all' ? undefined : userTypeFilter,
          lmsOnly:
            lmsOnlyFilter === 'all' ? undefined : lmsOnlyFilter === 'only',
          active:
            activeFilter === 'all' ? undefined : activeFilter === 'active',
          search: search || undefined
        }
      })

      return response.data.data || []
    },
    { keepPreviousData: true }
  )

  const users = usersData || []
  const roleOptions = optionsData?.roles || []
  const customerOptions = optionsData?.customers || []

  const saveUserMutation = useMutation(
    async (payload: LmsUserForm) => {
      const body = {
        nombre: payload.nombre,
        email: payload.email,
        password: payload.password || undefined,
        userType: payload.userType,
        customerId: payload.userType === 'client' ? Number(payload.customerId) : null,
        roles: payload.roles,
        lmsOnly: payload.lmsOnly,
        active: payload.active
      }

      if (editingUser) {
        return axiosPrivate.put(`/lms/users/${editingUser.id}`, body)
      }

      return axiosPrivate.post('/lms/users', body)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-users'])
        setDialogOpen(false)
        setEditingUser(null)
        setForm(emptyForm)
        setSnackbar({
          open: true,
          message: editingUser ? 'Usuario LMS actualizado' : 'Usuario LMS creado',
          severity: 'success'
        })
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.error?.message || error.response?.data?.message || 'No se pudo guardar el usuario LMS',
          severity: 'error'
        })
      }
    }
  )

  const toggleActiveMutation = useMutation(
    async ({ userId, active }: { userId: number; active: boolean }) =>
      axiosPrivate.patch(`/lms/users/${userId}/active`, { active }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['lms-users'])
        setSnackbar({
          open: true,
          message: variables.active ? 'Usuario activado' : 'Usuario desactivado',
          severity: 'success'
        })
      },
      onError: () => {
        setSnackbar({
          open: true,
          message: 'No se pudo actualizar el estado del usuario',
          severity: 'error'
        })
      }
    }
  )

  const summary = useMemo(() => {
    const total = users.length
    const lmsOnly = users.filter((user) => user.lmsOnly).length
    const clients = users.filter((user) => user.userType === 'client').length
    const inactive = users.filter((user) => !user.active).length

    return { total, lmsOnly, clients, inactive }
  }, [users])

  const applyUserTypeDefaults = (userType: 'internal' | 'client', currentLmsOnly: boolean) => {
    const defaults = optionsData?.defaults
    if (!defaults) return

    const roles = userType === 'client' ? [...defaults.clientRoles] : [...defaults.internalRoles]
    if (currentLmsOnly && !roles.includes(defaults.lmsOnlyRole)) {
      roles.push(defaults.lmsOnlyRole)
    }

    setForm((prev) => ({
      ...prev,
      userType,
      customerId: userType === 'client' ? prev.customerId : '',
      roles
    }))
  }

  const buildCreateForm = (overrides?: Partial<LmsUserForm>) => {
    const defaults = optionsData?.defaults
    const fallbackUserType =
      overrides?.userType
      || (userTypeFilter === 'client' ? 'client' : 'internal')
    const fallbackLmsOnly =
      overrides?.lmsOnly
      ?? (lmsOnlyFilter === 'only')
    const baseRoles =
      fallbackUserType === 'client'
        ? [...(defaults?.clientRoles || ['user'])]
        : [...(defaults?.internalRoles || ['employee'])]

    const nextForm: LmsUserForm = {
      ...emptyForm,
      password: defaults?.generatedPassword || '',
      userType: fallbackUserType,
      lmsOnly: fallbackLmsOnly,
      roles: baseRoles,
      ...overrides
    }

    if (nextForm.userType === 'internal') {
      nextForm.customerId = ''
    }

    return nextForm
  }

  const handleOpenCreate = () => {
    setEditingUser(null)
    setForm(buildCreateForm())
    setDialogOpen(true)
  }

  const handleOpenCreatePreset = (userType: 'internal' | 'client', lmsOnly: boolean) => {
    setEditingUser(null)
    setForm(buildCreateForm({ userType, lmsOnly }))
    setDialogOpen(true)
  }

  const handleOpenEdit = (user: LmsUser) => {
    setEditingUser(user)
    setForm({
      nombre: user.name,
      email: user.email,
      password: '',
      userType: user.userType,
      customerId: user.customerId ? String(user.customerId) : '',
      roles: user.roles.filter((role) => role !== 'lms_only'),
      lmsOnly: user.lmsOnly,
      active: user.active
    })
    setDialogOpen(true)
  }

  const effectiveRoles = useMemo(() => {
    const roles = new Set(form.roles)
    const lmsOnlyRole = optionsData?.defaults?.lmsOnlyRole || 'lms_only'
    if (form.lmsOnly) {
      roles.add(lmsOnlyRole)
    } else {
      roles.delete(lmsOnlyRole)
    }
    return Array.from(roles)
  }, [form.roles, form.lmsOnly, optionsData])

  const normalizedName = form.nombre.trim()
  const normalizedEmail = form.email.trim()
  const needsCustomer = form.userType === 'client'
  const selectedCustomerName = customerOptions.find(
    (customer) => String(customer.id) === form.customerId
  )?.name
  const isSaveDisabled =
    saveUserMutation.isLoading ||
    normalizedName.length < 3 ||
    !isValidEmail(normalizedEmail) ||
    (!editingUser && form.password.trim().length < 8) ||
    (needsCustomer && !form.customerId) ||
    effectiveRoles.filter((role) => role !== 'lms_only').length === 0

  const handleToggleRole = (roleName: string) => {
    setForm((prev) => {
      const hasRole = prev.roles.includes(roleName)
      return {
        ...prev,
        roles: hasRole ? prev.roles.filter((role) => role !== roleName) : [...prev.roles, roleName]
      }
    })
  }

  const handleSave = () => {
    saveUserMutation.mutate({
      ...form,
      roles: effectiveRoles
    })
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          mb: 3
        }}
      >
        <Box>
          <Typography variant='h4' component='h1' gutterBottom>
            Gestión de Usuarios LMS
          </Typography>
          <Typography color='text.secondary'>
            Crea y administra accesos LMS reales para internos, clientes y usuarios restringidos solo al LMS.
          </Typography>
        </Box>

        <Button variant='contained' startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Nuevo Usuario LMS
        </Button>
      </Box>

      <Alert severity='info' sx={{ mb: 3 }}>
        Usa esta pantalla para resolver tres cosas en una sola operación: si el usuario es interno
        o cliente, si debe quedar restringido al LMS y qué rol operativo tendrá dentro del módulo.
      </Alert>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Chip label={`${summary.total} usuarios visibles`} variant='outlined' />
        <Chip label={`${summary.lmsOnly} LMS-only`} variant='outlined' />
        <Chip label={`${summary.clients} clientes`} variant='outlined' />
        <Chip label={`${summary.inactive} inactivos`} variant='outlined' />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Button variant='outlined' size='small' onClick={() => handleOpenCreatePreset('internal', true)}>
          Nuevo interno solo LMS
        </Button>
        <Button variant='outlined' size='small' onClick={() => handleOpenCreatePreset('client', true)}>
          Nuevo cliente solo LMS
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardHeader title='Filtros' subheader='Aísla el segmento que quieres revisar antes de crear, editar o activar accesos.' />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Buscar por nombre o correo'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label='Tipo de usuario'
                value={userTypeFilter}
                onChange={(event) => setUserTypeFilter(event.target.value as 'all' | 'internal' | 'client')}
              >
                <MenuItem value='all'>Todos</MenuItem>
                <MenuItem value='internal'>Internos</MenuItem>
                <MenuItem value='client'>Clientes</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2.5}>
              <TextField
                select
                fullWidth
                label='Acceso LMS'
                value={lmsOnlyFilter}
                onChange={(event) => setLmsOnlyFilter(event.target.value as 'all' | 'only' | 'mixed')}
              >
                <MenuItem value='all'>Todos</MenuItem>
                <MenuItem value='only'>Solo LMS</MenuItem>
                <MenuItem value='mixed'>Acceso mixto</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2.5}>
              <TextField
                select
                fullWidth
                label='Estado'
                value={activeFilter}
                onChange={(event) => setActiveFilter(event.target.value as 'all' | 'active' | 'inactive')}
              >
                <MenuItem value='all'>Todos</MenuItem>
                <MenuItem value='active'>Activos</MenuItem>
                <MenuItem value='inactive'>Inactivos</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title='Usuarios LMS'
          subheader='Aquí puedes ajustar customer, roles y restricción LMS-only sin salir del módulo.'
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Acceso</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!isLoading && users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align='center' sx={{ py: 8 }}>
                      <Typography color='text.secondary'>
                        No hay usuarios LMS para los filtros actuales.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Typography variant='body2' fontWeight={600}>
                          {user.name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.userType === 'client' ? 'Cliente' : 'Interno'}
                          size='small'
                          color={user.userType === 'client' ? 'secondary' : 'primary'}
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>{user.customerName || 'Sin cliente'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {user.roles.filter((role) => role !== 'lms_only').map((role) => (
                            <Chip key={role} label={getCompactRoleLabel(role)} size='small' variant='outlined' />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.lmsOnly ? 'Solo LMS' : 'Acceso mixto'}
                          size='small'
                          color={user.lmsOnly ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.active ? 'Activo' : 'Inactivo'}
                          size='small'
                          color={user.active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size='small' startIcon={<EditIcon />} onClick={() => handleOpenEdit(user)}>
                            Editar
                          </Button>
                          <Button
                            size='small'
                            color={user.active ? 'warning' : 'success'}
                            startIcon={user.active ? <PersonOffIcon /> : <PersonIcon />}
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                userId: user.id,
                                active: !user.active
                              })
                            }
                          >
                            {user.active ? 'Desactivar' : 'Activar'}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth='md'>
        <DialogTitle>{editingUser ? 'Editar usuario LMS' : 'Nuevo usuario LMS'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity='info'>
                Define primero el tipo de usuario y luego ajusta el alcance. Si activas
                <strong> LMS-only</strong>, la persona quedará redirigida solo a rutas del LMS.
              </Alert>
            </Grid>
            {editingUser && (
              <Grid item xs={12}>
                <Alert severity='warning'>
                  Esta pantalla ajusta la capa LMS del usuario. Si la persona ya tiene roles de otros módulos, se conservarán al guardar.
                </Alert>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Nombre'
                value={form.nombre}
                onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Correo'
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                helperText={editingUser ? 'Déjalo vacío si no quieres cambiarla.' : 'Puedes usar la sugerida o escribir una propia de 8+ caracteres.'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label='Tipo de usuario'
                value={form.userType}
                onChange={(event) => applyUserTypeDefaults(event.target.value as 'internal' | 'client', form.lmsOnly)}
              >
                <MenuItem value='internal'>Interno</MenuItem>
                <MenuItem value='client'>Cliente</MenuItem>
              </TextField>
            </Grid>
            {form.userType === 'client' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Cliente</InputLabel>
                  <Select
                    value={form.customerId}
                    label='Cliente'
                    onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
                  >
                    {customerOptions.map((customer) => (
                      <MenuItem key={customer.id} value={String(customer.id)}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <Alert severity={form.userType === 'client' ? 'warning' : 'info'}>
                {form.userType === 'client'
                  ? 'Los usuarios cliente acceden a cursos con audiencia client o both. Si activas LMS-only, no podrán entrar a otros módulos del sistema.'
                  : 'Los usuarios internos pueden recibir cursos obligatorios. Usa Training Manager solo para responsables de operación del LMS.'}
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Alert severity='info'>
                Perfil resultante: <strong>{form.userType === 'client' ? 'Cliente' : 'Interno'}</strong>
                {needsCustomer ? ` · ${selectedCustomerName || 'Cliente pendiente por seleccionar'}` : ' · Sin empresa asociada'}
                {form.lmsOnly ? ' · Solo LMS' : ' · Acceso mixto'}
                {effectiveRoles.filter((role) => role !== 'lms_only').length > 0
                  ? ` · Roles: ${effectiveRoles.filter((role) => role !== 'lms_only').join(', ')}`
                  : ' · Selecciona al menos un rol operativo'}
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.lmsOnly}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setForm((prev) => ({ ...prev, lmsOnly: checked }))
                    }}
                  />
                }
                label='Restringir a LMS-only'
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.active}
                    onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                  />
                }
                label='Usuario activo'
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Roles operativos
              </Typography>
              <FormGroup>
                <Grid container spacing={1}>
                  {roleOptions
                    .filter((role) => role.name !== 'lms_only')
                    .map((role) => {
                      const disabled =
                        form.userType === 'client' &&
                        (role.name === 'admin' || role.name === 'Training Manager' || role.name === 'employee')

                      return (
                        <Grid item xs={12} md={6} key={role.id}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={form.roles.includes(role.name)}
                                onChange={() => handleToggleRole(role.name)}
                                disabled={disabled}
                              />
                            }
                            label={getRoleLabel(role.name, role.description)}
                          />
                        </Grid>
                      )
                    })}
                </Grid>
              </FormGroup>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {effectiveRoles.map((role) => (
                  <Chip
                    key={role}
                    label={role === 'lms_only' ? 'Solo LMS' : getRoleLabel(role)}
                    size='small'
                    color={role === 'lms_only' ? 'warning' : 'default'}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant='contained' onClick={handleSave} disabled={isSaveDisabled}>
            {saveUserMutation.isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default LmsUserManagement
