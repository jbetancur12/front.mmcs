import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Popper,
  PopperProps,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import {
  CalibrationServiceCustomer,
  CalibrationServiceDocument
} from '../../../types/calibrationService'
import {
  REQUEST_CHANNEL_OPTIONS,
  sectionCardSx
} from './calibrationServiceWorkspaceConstants'
import { CustomerDialogMode, FormState } from './calibrationServiceWorkspaceTypes'
import { getSiteDisplayLabel } from './calibrationServiceWorkspaceUtils'
import { CalibrationServiceWorkspaceForm } from './useCalibrationServiceWorkspaceForm'

// La lista del selector de clientes es más ancha que el campo: los nombres largos se leen en una o dos líneas
const WideListPopper = (props: PopperProps) => (
  <Popper {...props} placement='bottom-start' style={{ ...props.style, width: 'fit-content', minWidth: 380, maxWidth: 'min(640px, 92vw)' }} />
)

interface CalibrationServiceWorkspaceCustomerSectionProps {
  form: CalibrationServiceWorkspaceForm
  canEdit: boolean
  isBusy: boolean
  customerOptions: CalibrationServiceCustomer[]
  hasCustomersError: boolean
  requestEvidenceDocuments: CalibrationServiceDocument[]
  setCustomerDialogMode: (mode: CustomerDialogMode | null) => void
}

/** Paso 1: cliente, alcance, sede, vía de solicitud y evidencia de la solicitud. */
const CalibrationServiceWorkspaceCustomerSection = ({
  form,
  canEdit,
  isBusy,
  customerOptions,
  hasCustomersError,
  requestEvidenceDocuments,
  setCustomerDialogMode
}: CalibrationServiceWorkspaceCustomerSectionProps) => {
  const {
    formState,
    selectedCustomer,
    customerSites,
    requestEvidenceFile,
    setRequestEvidenceFile,
    requestEvidenceTitle,
    setRequestEvidenceTitle,
    setField,
    handleCustomerChange,
    handleCustomerSiteChange
  } = form

  return (
    <Card elevation={0} sx={sectionCardSx}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2.5 }}>
          <GroupOutlinedIcon sx={{ color: '#00897B', fontSize: 22 }} />
          <Typography variant='h6' fontWeight={700} sx={{ color: '#111827' }}>
            Cliente y alcance
          </Typography>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Autocomplete
                fullWidth
                PopperComponent={WideListPopper}
                options={customerOptions}
                value={selectedCustomer}
                getOptionLabel={(option) =>
                  [option.nombre, option.identificacion].filter(Boolean).join(' · ')
                }
                onChange={(_, value) => handleCustomerChange(value)}
                disabled={
                  !canEdit ||
                  isBusy ||
                  (hasCustomersError && customerOptions.length === 0)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Cliente'
                    required
                    inputProps={{ ...params.inputProps, title: params.inputProps.value ? String(params.inputProps.value) : undefined }}
                  />
                )}
              />
              <Tooltip title='Nuevo cliente'>
                <span>
                  <Button
                    variant='outlined'
                    aria-label='Nuevo cliente'
                    startIcon={<PersonAddAltOutlinedIcon />}
                    sx={{ height: 56, minWidth: { xs: '100%', sm: 56 }, width: { xs: '100%', sm: 56 }, px: { xs: 2, sm: 0 }, '& .MuiButton-startIcon': { mr: { xs: 1, sm: 0 }, ml: { sm: 0 } } }}
                    disabled={!canEdit || isBusy}
                    onClick={() => setCustomerDialogMode('customer')}
                  >
                    <Box component='span' sx={{ display: { xs: 'inline', sm: 'none' } }}>Nuevo cliente</Box>
                  </Button>
                </span>
              </Tooltip>
            </Stack>
              </Box>
              <Box sx={{ width: { xs: '100%', md: 190 }, flexShrink: 0 }}>
            <FormControl fullWidth>
              <InputLabel>Alcance</InputLabel>
              <Select
                value={formState.scopeType || 'general'}
                label='Alcance'
                disabled={!canEdit || isBusy}
                onChange={(event) => setField('scopeType', event.target.value as FormState['scopeType'])}
              >
                <MenuItem value='general'>Cliente general</MenuItem>
                <MenuItem value='site'>Sede específica</MenuItem>
              </Select>
            </FormControl>
              </Box>
            </Stack>
          </Grid>
          {formState.scopeType === 'site' ? (
            <Grid item xs={12} md={6}>
              {customerSites.length ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <FormControl fullWidth>
                    <InputLabel>Sede</InputLabel>
                    <Select
                      value={formState.customerSite || ''}
                      label='Sede'
                      disabled={!canEdit || isBusy}
                      onChange={(event) => {
                        const site = customerSites.find(
                          (candidate) => candidate.name === event.target.value
                        )
                        handleCustomerSiteChange(site || null)
                      }}
                    >
                      {customerSites.map((site) => (
                        <MenuItem key={site.id || site.name} value={site.name}>
                          {getSiteDisplayLabel(site)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant='outlined'
                    sx={{ minWidth: 130 }}
                    disabled={!canEdit || isBusy || !selectedCustomer}
                    onClick={() => setCustomerDialogMode('site')}
                  >
                    Nueva sede
                  </Button>
                </Stack>
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    fullWidth
                    label='Sede'
                    value={formState.customerSite || ''}
                    disabled={!canEdit || isBusy}
                    onChange={(event) => setField('customerSite', event.target.value)}
                  />
                  <Button
                    variant='outlined'
                    sx={{ minWidth: 130 }}
                    disabled={!canEdit || isBusy || !selectedCustomer}
                    onClick={() => setCustomerDialogMode('site')}
                  >
                    Crear sede
                  </Button>
                </Stack>
              )}
            </Grid>
          ) : null}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Vía de solicitud</InputLabel>
              <Select
                value={formState.requestChannel || ''}
                label='Vía de solicitud'
                disabled={!canEdit || isBusy}
                onChange={(event) => setField('requestChannel', event.target.value)}
              >
                {REQUEST_CHANNEL_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2 }}>
          <UploadFileOutlinedIcon sx={{ color: '#00897B', fontSize: 20 }} />
          <Typography variant='subtitle2' fontWeight={700} sx={{ color: '#374151' }}>
            Evidencia de solicitud *
          </Typography>
          {requestEvidenceFile || requestEvidenceDocuments.length ? (
            <Chip icon={<CheckCircleOutlineOutlinedIcon sx={{ fontSize: 14 }} />} size='small' label='Adjunta' color='success' variant='outlined' sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.5 }, '& .MuiChip-icon': { fontSize: 14, ml: 0.5 } }} />
          ) : (
            <Chip size='small' label='Obligatorio' color='error' variant='outlined' sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.5 } }} />
          )}
        </Stack>
        <Stack spacing={2}>
          <TextField fullWidth label='Título de la evidencia' value={requestEvidenceTitle} disabled={!canEdit || isBusy} onChange={(event) => setRequestEvidenceTitle(event.target.value)} required />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Button component='label' variant='outlined' startIcon={<UploadFileOutlinedIcon />} disabled={!canEdit || isBusy}>
              Seleccionar archivo
              <input
                hidden
                type='file'
                accept='.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'
                onChange={(event) => setRequestEvidenceFile(event.target.files?.[0] || null)}
              />
            </Button>
            <Typography variant='body2' color='text.secondary'>
              {requestEvidenceFile ? requestEvidenceFile.name : 'Adjunta PDF, imagen o soporte documental de la solicitud.'}
            </Typography>
          </Stack>
          {requestEvidenceDocuments.length ? (
            <List dense disablePadding>
              {requestEvidenceDocuments.map((document) => (
                <ListItem key={document.id} disableGutters>
                  <ListItemText primary={document.title || document.originalFileName} secondary={`Version ${document.version}`} />
                </ListItem>
              ))}
            </List>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default CalibrationServiceWorkspaceCustomerSection
