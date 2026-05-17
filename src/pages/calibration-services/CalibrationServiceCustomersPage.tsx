import { useDeferredValue, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
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
import { Toaster, toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { axiosPrivate } from '@utils/api'
import { CALIBRATION_SERVICE_EDIT_ROLES } from '../../constants/calibrationServices'
import {
  CalibrationServiceCustomer,
  CalibrationServiceCustomerSite
} from '../../types/calibrationService'
import { useHasRole } from '../../utils/functions'
import CalibrationServiceCustomerDialog, {
  CalibrationServiceCustomerDialogValues
} from './CalibrationServiceCustomerDialog'

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
  const canManageCustomers = useHasRole([...CALIBRATION_SERVICE_EDIT_ROLES])
  const [search, setSearch] = useState('')
  const [customerDialogMode, setCustomerDialogMode] = useState<'customer' | 'site' | null>(null)
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
        <CircularProgress />
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
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        minHeight: '100vh',
        backgroundColor: '#f8fafb',
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      }}
    >
      <Toaster position='top-center' />

      {/* ── Header ── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
          borderRadius: '20px', p: { xs: 3, md: 4 }, mb: 3,
          position: 'relative', overflow: 'hidden',
          animation: 'fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both',
          '&::before': {
            content: '""', position: 'absolute', top: 0, right: 0,
            width: '40%', height: '100%',
            background: 'radial-gradient(ellipse at 70% 10%, rgba(251,191,36,0.08) 0%, transparent 65%)',
            pointerEvents: 'none'
          }
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }}
          justifyContent='space-between' alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}
        >
          <Box>
            <Button startIcon={<ArrowBackOutlinedIcon />}
              onClick={() => navigate('/calibration-services')}
              sx={{ mb: 1, color: 'rgba(255,255,255,0.7)', textTransform: 'none', fontWeight: 600, borderRadius: '10px', fontSize: '0.85rem',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' }
              }}
            >
              Volver a servicios
            </Button>
            <Typography variant='h4' fontWeight={800} sx={{ color: '#fff', lineHeight: 1.15, letterSpacing: '-0.025em', fontSize: { xs: '1.6rem', md: '2rem' } }}>
              Clientes de calibración
            </Typography>
            <Typography variant='body2' sx={{ mt: 1, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, maxWidth: 640, fontSize: '0.9rem' }}>
              Base común de empresas y sedes. Aquí decides cuáles también aparecen en clientes para certificados.
            </Typography>
          </Box>
          {canManageCustomers ? (
            <Button variant='contained' startIcon={<AddBusinessOutlinedIcon />}
              onClick={() => { setSelectedCustomer(null); setCustomerDialogMode('customer') }}
              sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '10px',
                textTransform: 'none', fontWeight: 700, px: 3, whiteSpace: 'nowrap',
                boxShadow: '0 4px 6px -1px rgba(245,158,11,0.25)',
                '&:hover': { background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  boxShadow: '0 6px 12px -2px rgba(245,158,11,0.3)' }
              }}
            >
              Crear cliente
            </Button>
          ) : null}
        </Stack>
      </Box>

      {/* ── Stat cards ── */}
      <Grid container spacing={2.5} mb={3} sx={{ animation: 'fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.08s both' }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(5,150,105,0.02) 100%)', overflow: 'visible' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 1.5 }}>
                <GroupsOutlinedIcon sx={{ color: '#059669', fontSize: 20 }} />
                <Typography variant='caption' fontWeight={700} sx={{ color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total clientes</Typography>
              </Stack>
              <Typography variant='h3' fontWeight={900} sx={{ color: '#111827', lineHeight: 1 }}>{totalItems}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(79,70,229,0.02) 100%)', overflow: 'visible' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 1.5 }}>
                <VisibilityOutlinedIcon sx={{ color: '#4f46e5', fontSize: 20 }} />
                <Typography variant='caption' fontWeight={700} sx={{ color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Visibles para certificados</Typography>
              </Stack>
              <Typography variant='h3' fontWeight={900} sx={{ color: '#111827', lineHeight: 1 }}>{certificateEnabledCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(217,119,6,0.02) 100%)', overflow: 'visible' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 1.5 }}>
                <VisibilityOffOutlinedIcon sx={{ color: '#d97706', fontSize: 20 }} />
                <Typography variant='caption' fontWeight={700} sx={{ color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Solo comerciales</Typography>
              </Stack>
              <Typography variant='h3' fontWeight={900} sx={{ color: '#111827', lineHeight: 1 }}>{commercialOnlyCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Search bar ── */}
      <Paper elevation={0} sx={{
        borderRadius: '12px', mb: 2.5, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden',
        animation: 'fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.12s both'
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
        {customers.map((customer, index) => (
          <Paper
            key={customer.id}
            elevation={0}
            sx={{
              borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)',
              background: '#fff',
              overflow: 'hidden',
              animation: `fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${0.15 + index * 0.04}s both`,
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
                    <Button size='small' variant='outlined' startIcon={<PlaceOutlinedIcon />}
                      sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.8rem' }}
                      onClick={() => { setSelectedCustomer(customer); setCustomerDialogMode('site') }}
                    >
                      Nueva sede
                    </Button>
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
            animation: 'fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both'
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
        animation: 'fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both'
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
        customer={selectedCustomer}
        site={selectedSite}
        isSubmitting={createCustomerMutation.isLoading || createCustomerSiteMutation.isLoading || updateCustomerSiteMutation.isLoading}
        onClose={() => { setCustomerDialogMode(null); setSelectedCustomer(null); setSelectedSite(null) }}
        onSubmit={(values) => {
          if (customerDialogMode === 'site') {
            if (selectedSite) { updateCustomerSiteMutation.mutate(values); return }
            createCustomerSiteMutation.mutate(values)
            return
          }
          createCustomerMutation.mutate(values)
        }}
      />
    </Box>
  )
}

export default CalibrationServiceCustomersPage
