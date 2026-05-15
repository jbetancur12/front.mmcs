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
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  TablePagination,
  TextField,
  Typography
} from '@mui/material'
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
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
  if (customer.sites?.length) {
    return customer.sites.length
  }

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
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    setPage(0)
  }, [deferredSearch])

  const {
    data,
    isLoading,
    isError,
    error
  } = useQuery({
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
      if (!selectedCustomer?.id) {
        throw new Error('Selecciona un cliente antes de crear una sede.')
      }

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
      if (!selectedCustomer?.id || !selectedSite) {
        throw new Error('Selecciona una sede antes de editarla.')
      }

      const response = await axiosPrivate.put<CalibrationServiceCustomer>(
        `/customers/${selectedCustomer.id}/sedes`,
        {
          ...values.site,
          siteId: selectedSite.id,
          oldSede: selectedSite.name,
          newSede: values.site.name
        }
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
    mutationFn: async ({
      customerId,
      certificateProfileEnabled
    }: {
      customerId: number
      certificateProfileEnabled: boolean
    }) => {
      const response = await axiosPrivate.patch<CalibrationServiceCustomer>(
        `/customers/${customerId}/certificate-profile`,
        { certificateProfileEnabled }
      )
      return response.data
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries(customerQueryKey)
      toast.success(
        customer.certificateProfileEnabled
          ? 'Cliente habilitado para certificados.'
          : 'Cliente oculto de la vista de certificados.'
      )
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
    <Box p={{ xs: 2, md: 3 }}>
      <Toaster position='top-center' />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Button
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => navigate('/calibration-services')}
            sx={{ mb: 1 }}
          >
            Volver a servicios
          </Button>
          <Typography variant='h4' fontWeight={800}>
            Clientes de calibración
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
            Base común de empresas y sedes. Aquí decides cuáles también aparecen en
            clientes para certificados.
          </Typography>
        </Box>

        {canManageCustomers ? (
          <Button
            variant='contained'
            startIcon={<AddBusinessOutlinedIcon />}
            onClick={() => {
              setSelectedCustomer(null)
              setCustomerDialogMode('customer')
            }}
          >
            Crear cliente
          </Button>
        ) : null}
      </Stack>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary' fontWeight={700}>
                Total clientes
              </Typography>
              <Typography variant='h3' fontWeight={900}>
                {totalItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant='overline' color='success.main' fontWeight={700}>
                Visibles para certificados
              </Typography>
              <Typography variant='h3' fontWeight={900}>
                {certificateEnabledCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant='overline' color='info.main' fontWeight={700}>
                Solo comerciales
              </Typography>
              <Typography variant='h3' fontWeight={900}>
                {commercialOnlyCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder='Buscar por nombre, NIT, correo, teléfono o ciudad'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: <SearchOutlinedIcon color='action' sx={{ mr: 1 }} />
            }}
            sx={{ mb: 2 }}
          />

          <Stack spacing={2}>
            {customers.map((customer) => (
              <Box
                key={customer.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2
                }}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent='space-between'
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  spacing={2}
                >
                  <Box>
                    <Stack direction='row' alignItems='center' spacing={1} flexWrap='wrap'>
                      <Typography variant='h6' fontWeight={800}>
                        {customer.nombre}
                      </Typography>
                      <Chip
                        size='small'
                        color={customer.certificateProfileEnabled ? 'success' : 'info'}
                        label={
                          customer.certificateProfileEnabled
                            ? 'Visible en certificados'
                            : 'Solo calibración'
                        }
                      />
                    </Stack>
                    <Typography variant='body2' color='text.secondary'>
                      NIT: {customer.identificacion || 'Sin NIT'} · {customer.email || 'Sin correo'} ·{' '}
                      {customer.telefono || 'Sin teléfono'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {customer.ciudad || 'Sin ciudad'}
                      {customer.departamento ? `, ${customer.departamento}` : ''} ·{' '}
                      {getCustomerSiteCount(customer)} sede(s)
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems='center'>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(customer.certificateProfileEnabled)}
                          disabled={
                            !canManageCustomers || updateCertificateProfileMutation.isLoading
                          }
                          onChange={(event) =>
                            updateCertificateProfileMutation.mutate({
                              customerId: customer.id,
                              certificateProfileEnabled: event.target.checked
                            })
                          }
                        />
                      }
                      label='Certificados'
                    />
                    {canManageCustomers ? (
                      <Button
                        variant='outlined'
                        startIcon={<PlaceOutlinedIcon />}
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setCustomerDialogMode('site')
                        }}
                      >
                        Nueva sede
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>

                {customer.sites?.length ? (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={1}>
                      {customer.sites.map((site: CalibrationServiceCustomerSite) => (
                        <Grid item xs={12} md={6} key={site.id || site.name}>
                          <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 1.5 }}>
                            <Stack direction='row' justifyContent='space-between' spacing={1}>
                              <Typography variant='subtitle2' fontWeight={800}>
                                {site.name}
                              </Typography>
                              {canManageCustomers ? (
                                <IconButton
                                  size='small'
                                  onClick={() => {
                                    setSelectedCustomer(customer)
                                    setSelectedSite(site)
                                    setCustomerDialogMode('site')
                                  }}
                                >
                                  <EditOutlinedIcon fontSize='small' />
                                </IconButton>
                              ) : null}
                            </Stack>
                            <Typography variant='caption' color='text.secondary' display='block'>
                              {[site.address, site.city, site.department]
                                .filter(Boolean)
                                .join(' · ') || 'Sin dirección detallada'}
                            </Typography>
                            <Typography variant='caption' color='text.secondary' display='block'>
                              {[site.contactName, site.contactEmail, site.contactPhone]
                                .filter(Boolean)
                                .join(' · ') || 'Sin contacto de sede'}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                ) : null}
              </Box>
            ))}

            {!customers.length ? (
              <Alert severity='info'>No encontramos clientes con ese criterio.</Alert>
            ) : null}
          </Stack>

          <TablePagination
            component='div'
            count={totalItems}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number.parseInt(event.target.value, 10))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage='Clientes por página'
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </CardContent>
      </Card>

      <CalibrationServiceCustomerDialog
        open={customerDialogMode !== null}
        mode={customerDialogMode || 'customer'}
        customer={selectedCustomer}
        site={selectedSite}
        isSubmitting={
          createCustomerMutation.isLoading ||
          createCustomerSiteMutation.isLoading ||
          updateCustomerSiteMutation.isLoading
        }
        onClose={() => {
          setCustomerDialogMode(null)
          setSelectedCustomer(null)
          setSelectedSite(null)
        }}
        onSubmit={(values) => {
          if (customerDialogMode === 'site') {
            if (selectedSite) {
              updateCustomerSiteMutation.mutate(values)
              return
            }

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
