import SignalLoader from 'src/Components/Common/SignalLoader'
import { useDeferredValue, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TablePagination,
  TextField,
  Typography
} from '@mui/material'
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { axiosPrivate } from '@utils/api'
import {
  CalibrationServiceCustomer,
  CalibrationServiceCustomerSite
} from '../../types/calibrationService'
import CalibrationServiceCustomerDialog, {
  CalibrationServiceCustomerDialogValues
} from './CalibrationServiceCustomerDialog'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'

const customerQueryKey = ['calibration-service-customers']
const DEFAULT_PAGE_SIZE = 10

interface CalibrationCustomersResponse {
  customers: CalibrationServiceCustomer[]
  totalItems: number
  totalPages: number
  page: number
  limit: number
  certificateEnabledCount: number
  commercialOnlyCount: number
}

const getCustomerSiteCount = (customer: CalibrationServiceCustomer) => {
  if (customer.sites?.length) return customer.sites.length
  return customer.sede?.length || 0
}

const CalibrationServiceCustomersPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const canManageCustomers = useCan(PERMISSIONS.CALIBRATION_SERVICE_CREATE)
  const [search, setSearch] = useState('')
  const [customerDialogMode, setCustomerDialogMode] = useState<'customer' | 'site' | null>(null)
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] =
    useState<CalibrationServiceCustomer | null>(null)
  const [selectedSite, setSelectedSite] =
    useState<CalibrationServiceCustomerSite | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE)
  const [expandedCustomers, setExpandedCustomers] = useState<Set<number>>(new Set())
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    setPage(0)
  }, [deferredSearch])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...customerQueryKey, page, rowsPerPage, deferredSearch],
    queryFn: async () => {
      const response = await axiosPrivate.get<CalibrationCustomersResponse>('/customers', {
        params: {
          scope: 'calibration',
          page: page + 1,
          limit: rowsPerPage,
          q: deferredSearch.trim() || undefined
        }
      })
      return response.data
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000
  })
  const customers = data?.customers ?? []
  const totalItems = data?.totalItems ?? 0

  const createCustomerMutation = useMutation({
    mutationFn: async (values: CalibrationServiceCustomerDialogValues) => {
      const response = await axiosPrivate.post<{ customer: CalibrationServiceCustomer }>(
        '/customers',
        {
          ...values.customer,
          direccion: values.customer.direccion || values.site.address || '',
          ciudad: values.customer.ciudad || values.site.city || '',
          departamento: values.customer.departamento || values.site.department || '',
          email: values.customer.email || values.site.contactEmail || '',
          telefono: values.customer.telefono || values.site.contactPhone || '',
          pais: values.customer.pais || values.site.country || 'Colombia',
          sites: [values.site]
        }
      )
      return response.data.customer
    },
    onSuccess: () => {
      queryClient.invalidateQueries(customerQueryKey)
      setCustomerDialogMode(null)
      toast.success('Cliente creado para calibración.')
    }
  })

  const updateCustomerMutation = useMutation({
    mutationFn: async (values: CalibrationServiceCustomerDialogValues) => {
      if (!selectedCustomer?.id) {
        throw new Error('Selecciona un cliente antes de editarlo.')
      }
      const response = await axiosPrivate.put<CalibrationServiceCustomer>(
        `/customers/${selectedCustomer.id}`,
        values.customer
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(customerQueryKey)
      setCustomerDialogMode(null)
      setSelectedCustomer(null)
      setIsEditingCustomer(false)
      toast.success('Cliente actualizado.')
    }
  })

  const createCustomerSiteMutation = useMutation({
    mutationFn: async (values: CalibrationServiceCustomerDialogValues) => {
      if (!selectedCustomer?.id) throw new Error('Selecciona un cliente antes de crear una sede.')
      const response = await axiosPrivate.post<CalibrationServiceCustomer>(
        `/customers/${selectedCustomer.id}/sedes`,
        values.site
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(customerQueryKey)
      setCustomerDialogMode(null)
      setSelectedCustomer(null)
      toast.success('Sede creada para el cliente.')
    }
  })

  const updateCustomerSiteMutation = useMutation({
    mutationFn: async (values: CalibrationServiceCustomerDialogValues) => {
      if (!selectedCustomer?.id || !selectedSite) throw new Error('Selecciona una sede antes de editarla.')
      const response = await axiosPrivate.put<CalibrationServiceCustomer>(
        `/customers/${selectedCustomer.id}/sedes`,
        { ...values.site, siteId: selectedSite.id, oldSede: selectedSite.name, newSede: values.site.name }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(customerQueryKey)
      setCustomerDialogMode(null)
      setSelectedCustomer(null)
      setSelectedSite(null)
      toast.success('Sede actualizada.')
    }
  })

  const updateCertificateProfileMutation = useMutation({
    mutationFn: async ({ customerId, certificateProfileEnabled }: {
      customerId: number; certificateProfileEnabled: boolean
    }) => {
      const response = await axiosPrivate.patch<CalibrationServiceCustomer>(
        `/customers/${customerId}/certificate-profile`,
        { certificateProfileEnabled }
      )
      return response.data
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries(customerQueryKey)
      toast.success(customer.certificateProfileEnabled
        ? 'Cliente habilitado para certificados.'
        : 'Cliente oculto de la vista de certificados.')
    }
  })

  const certificateEnabledCount = data?.certificateEnabledCount ?? 0
  const commercialOnlyCount = data?.commercialOnlyCount ?? 0

  if (isLoading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='55vh'>
        <SignalLoader />
      </Box>
    )
  }

  if (isError) {
    return (
      <Box p={3}>
        <Alert severity='error'>
          No pudimos cargar los clientes de calibración.
          {error instanceof Error ? ` ${error.message}` : ''}
        </Alert>
      </Box>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>

      <Button
        startIcon={<ArrowBackOutlinedIcon />}
        onClick={() => navigate('/calibration-services')}
        sx={{ mb: 1, color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
      >
        Volver a servicios
      </Button>

      <LmsPageHeader
        title='Clientes de calibración'
        subtitle='Base común de empresas y sedes. Aquí decides cuáles también aparecen en clientes para certificados.'
        icon={<BusinessOutlinedIcon />}
        actions={
          canManageCustomers ? (
            <Button
              variant='contained'
              startIcon={<AddBusinessOutlinedIcon />}
              onClick={() => { setIsEditingCustomer(false); setSelectedCustomer(null); setCustomerDialogMode('customer') }}
              sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}
            >
              Crear cliente
            </Button>
          ) : undefined
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Total clientes' value={totalItems} icon={<GroupsOutlinedIcon />} tone='teal' />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Visibles para certificados' value={certificateEnabledCount} icon={<VisibilityOutlinedIcon />} tone='green' />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Solo comerciales' value={commercialOnlyCount} icon={<VisibilityOffOutlinedIcon />} tone='orange' />
        </Grid>
      </Grid>

      {/* ── Search bar ── */}
      <Paper elevation={0} sx={{
        borderRadius: '12px', mb: 2.5, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden',
      }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size='small'
            placeholder='Buscar por nombre, NIT, correo, teléfono o ciudad'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#fff' }
            }}
          />
        </Box>
      </Paper>

      {/* ── Customers list ── */}
      <Stack spacing={2.5}>
        {customers.map((customer) => (
          <Paper
            key={customer.id}
            elevation={0}
            sx={{
              borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)',
              background: '#fff',
              overflow: 'hidden',
              transition: 'box-shadow 0.2s, border-color 0.2s',
              '&:hover': { borderColor: 'rgba(16,185,129,0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }
            }}
          >
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              {/* Customer header row */}
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                <Stack direction='row' alignItems='center' spacing={2} sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    sx={{
                      width: 40, height: 40, borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: 'rgba(16,185,129,0.08)', color: '#059669', flexShrink: 0
                    }}
                  >
                    <BusinessOutlinedIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction='row' alignItems='center' spacing={1} flexWrap='wrap'>
                      <Typography variant='h6' fontWeight={800} sx={{ fontSize: '1rem', lineHeight: 1.3 }} noWrap>
                        {customer.nombre}
                      </Typography>
                      <Chip
                        size='small'
                        color={customer.certificateProfileEnabled ? 'success' : 'default'}
                        label={customer.certificateProfileEnabled ? 'Visible en certificados' : 'Solo calibración'}
                        sx={{
                          height: 22,
                          borderRadius: '6px',
                          '& .MuiChip-label': { fontSize: '0.7rem', fontWeight: 600, px: 0.8 }
                        }}
                      />
                    </Stack>
                    <Stack direction='row' spacing={1.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                      <Typography variant='caption' color='text.secondary' noWrap>
                        NIT: {customer.identificacion || 'Sin NIT'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary' noWrap>
                        {customer.email || 'Sin correo'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary' noWrap>
                        {customer.telefono || 'Sin teléfono'}
                      </Typography>
                    </Stack>
                    <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 0.25 }}>
                      {customer.ciudad || 'Sin ciudad'}
                      {customer.departamento ? `, ${customer.departamento}` : ''} · {getCustomerSiteCount(customer)} sede(s)
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        checked={Boolean(customer.certificateProfileEnabled)}
                        disabled={!canManageCustomers || updateCertificateProfileMutation.isLoading}
                        onChange={(event) =>
                          updateCertificateProfileMutation.mutate({
                            customerId: customer.id,
                            certificateProfileEnabled: event.target.checked
                          })
                        }
                      />
                    }
                    label={<Typography variant='caption' fontWeight={600}>Certificados</Typography>}
                    sx={{ mr: 0 }}
                  />
                  {canManageCustomers ? (
                    <Stack direction='row' spacing={1} flexWrap='wrap'>
                      <Button size='small' variant='outlined' startIcon={<EditOutlinedIcon />}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.8rem' }}
                        onClick={() => { setIsEditingCustomer(true); setSelectedCustomer(customer); setCustomerDialogMode('customer') }}
                      >
                        Editar cliente
                      </Button>
                      <Button size='small' variant='outlined' startIcon={<PlaceOutlinedIcon />}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.8rem' }}
                        onClick={() => { setIsEditingCustomer(false); setSelectedCustomer(customer); setCustomerDialogMode('site') }}
                      >
                        Nueva sede
                      </Button>
                    </Stack>
                  ) : null}
                </Stack>
              </Stack>

              {/* Sites sub-section */}
              {customer.sites?.length ? (
                <>
                  <Divider
                    sx={{ my: 2, cursor: 'pointer', '&::before': { borderColor: expandedCustomers.has(customer.id) ? 'rgba(16,185,129,0.3)' : undefined },
                    '&::after': { borderColor: expandedCustomers.has(customer.id) ? 'rgba(16,185,129,0.3)' : undefined } }}
                    onClick={() => {
                      setExpandedCustomers((prev) => {
                        const next = new Set(prev)
                        if (next.has(customer.id)) next.delete(customer.id)
                        else next.add(customer.id)
                        return next
                      })
                    }}
                  >
                    <Stack direction='row' alignItems='center' spacing={0.5}
                      sx={{ cursor: 'pointer', color: 'text.secondary', userSelect: 'none' }}
                    >
                      <Typography variant='caption' fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                        {customer.sites.length} sede{customer.sites.length !== 1 ? 's' : ''}
                      </Typography>
                      {expandedCustomers.has(customer.id) ? <ExpandLessOutlinedIcon sx={{ fontSize: 16 }} /> : <ExpandMoreOutlinedIcon sx={{ fontSize: 16 }} />}
                    </Stack>
                  </Divider>
                  <Collapse in={expandedCustomers.has(customer.id)}>
                    <Grid container spacing={1.5}>
                    {customer.sites.map((site: CalibrationServiceCustomerSite) => (
                      <Grid item xs={12} md={6} key={site.id || site.name}>
                        <Box sx={{
                          backgroundColor: '#f8fafb', borderRadius: '10px', p: 1.5,
                          border: '1px solid', borderColor: 'rgba(0,0,0,0.05)',
                          transition: 'background-color 0.15s',
                          '&:hover': { backgroundColor: '#f1f5f9' }
                        }}>
                          <Stack direction='row' justifyContent='space-between' spacing={1} sx={{ mb: 0.5 }}>
                            <Typography variant='body2' fontWeight={700} sx={{ fontSize: '0.85rem' }}>{site.name}</Typography>
                            {canManageCustomers ? (
                              <IconButton size='small' sx={{ width: 28, height: 28 }}
                                onClick={() => { setSelectedCustomer(customer); setSelectedSite(site); setCustomerDialogMode('site') }}
                              >
                                <EditOutlinedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            ) : null}
                          </Stack>
                          <Typography variant='caption' color='text.secondary' display='block'>
                            {[site.address, site.city, site.department].filter(Boolean).join(' · ') || 'Sin dirección detallada'}
                          </Typography>
                          {[site.contactName, site.contactEmail, site.contactPhone].some(Boolean) ? (
                            <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 0.25 }}>
                              Contacto: {[site.contactName, site.contactEmail, site.contactPhone].filter(Boolean).join(' · ')}
                            </Typography>
                          ) : null}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  </Collapse>
                </>
              ) : null}
            </Box>
          </Paper>
        ))}

        {!customers.length ? (
          <Paper elevation={0} sx={{
            p: 4, textAlign: 'center', borderRadius: '12px',
            border: '1px dashed', borderColor: 'divider',
          }}>
            <BusinessOutlinedIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 1.5 }} />
            <Typography variant='body1' fontWeight={600} sx={{ color: '#6b7280', mb: 0.5 }}>
              {search.trim() ? 'Sin resultados' : 'Aún no hay clientes'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {search.trim()
                ? 'Ningún cliente coincide con el criterio de búsqueda.'
                : 'Crea el primer cliente para comenzar.'}
            </Typography>
          </Paper>
        ) : null}
      </Stack>

      {/* ── Pagination ── */}
      <Paper elevation={0} sx={{
        mt: 2.5, borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)',
      }}>
        <TablePagination
          component='div'
          count={totalItems}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => { setRowsPerPage(Number.parseInt(event.target.value, 10)); setPage(0) }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage='Clientes por página'
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
      </Paper>

      <CalibrationServiceCustomerDialog
        open={customerDialogMode !== null}
        mode={customerDialogMode || 'customer'}
        customer={isEditingCustomer ? selectedCustomer : null}
        site={selectedSite}
        isSubmitting={createCustomerMutation.isLoading || createCustomerSiteMutation.isLoading || updateCustomerSiteMutation.isLoading || updateCustomerMutation.isLoading}
        onClose={() => { setCustomerDialogMode(null); setSelectedCustomer(null); setSelectedSite(null); setIsEditingCustomer(false) }}
        onSubmit={(values) => {
          if (customerDialogMode === 'site') {
            if (selectedSite) { updateCustomerSiteMutation.mutate(values); return }
            createCustomerSiteMutation.mutate(values)
            return
          }
          if (isEditingCustomer && selectedCustomer) {
            updateCustomerMutation.mutate(values)
            return
          }
          createCustomerMutation.mutate(values)
        }}
      />
    </Container>
  )
}

export default CalibrationServiceCustomersPage
