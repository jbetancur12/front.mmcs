import { useDeferredValue, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined'
import { toast } from 'react-hot-toast'
import {
  useAvailableLoanEquipment,
  useCalibrationServiceLoanEquipment,
  useCalibrationServiceLoanMutations
} from '../../hooks/useCalibrationServices'
import {
  CalibrationServiceLoanEquipment,
  CalibrationServiceLoanEquipmentOption
} from '../../types/calibrationService'
import { getApiErrorMessage } from '../../utils/apiError'

interface Props {
  serviceId: string
}

const DEFAULT_INSPECTION = 'Sin novedad'

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString('es-CO') : ''

const getOptionLabel = (option: CalibrationServiceLoanEquipmentOption) =>
  [option.internalCode, option.equipmentName].filter(Boolean).join(' · ')

const CalibrationServiceLoanEquipmentSection = ({ serviceId }: Props) => {
  const { data: loans = [], isLoading } = useCalibrationServiceLoanEquipment(serviceId)
  const { createLoan, returnLoan, cancelLoan } = useCalibrationServiceLoanMutations()

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const { data: options = [], isFetching: isSearching } =
    useAvailableLoanEquipment(deferredSearch)

  const [selected, setSelected] = useState<CalibrationServiceLoanEquipmentOption | null>(null)
  const [visualOut, setVisualOut] = useState(DEFAULT_INSPECTION)
  const [operationalOut, setOperationalOut] = useState(DEFAULT_INSPECTION)
  const [notesOut, setNotesOut] = useState('')

  const [returnTarget, setReturnTarget] = useState<CalibrationServiceLoanEquipment | null>(null)
  const [visualIn, setVisualIn] = useState(DEFAULT_INSPECTION)
  const [operationalIn, setOperationalIn] = useState(DEFAULT_INSPECTION)
  const [notesIn, setNotesIn] = useState('')

  const pendingCount = loans.filter((loan) => !loan.returned).length

  const resetOutForm = () => {
    setSelected(null)
    setSearch('')
    setVisualOut(DEFAULT_INSPECTION)
    setOperationalOut(DEFAULT_INSPECTION)
    setNotesOut('')
  }

  const handleAdd = async () => {
    if (!selected) return

    try {
      await createLoan.mutateAsync({
        serviceId,
        equipmentId: selected.id,
        visualOutInspection: visualOut.trim() || DEFAULT_INSPECTION,
        operationalOutTest: operationalOut.trim() || DEFAULT_INSPECTION,
        observationsOut: notesOut.trim() || null
      })
      toast.success(`Equipo ${selected.internalCode || ''} dejado en préstamo.`)
      resetOutForm()
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No pudimos registrar el equipo de préstamo.'))
    }
  }

  const openReturn = (loan: CalibrationServiceLoanEquipment) => {
    setReturnTarget(loan)
    setVisualIn(DEFAULT_INSPECTION)
    setOperationalIn(DEFAULT_INSPECTION)
    setNotesIn('')
  }

  const handleReturn = async () => {
    if (!returnTarget) return

    try {
      await returnLoan.mutateAsync({
        serviceId,
        loanId: returnTarget.id,
        visualInInspection: visualIn.trim() || DEFAULT_INSPECTION,
        operationalInTest: operationalIn.trim() || DEFAULT_INSPECTION,
        observationsIn: notesIn.trim() || null
      })
      toast.success(`Equipo ${returnTarget.internalCode || ''} devuelto.`)
      setReturnTarget(null)
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No pudimos registrar el retorno del equipo.'))
    }
  }

  const handleCancel = async (loan: CalibrationServiceLoanEquipment) => {
    const confirmed = window.confirm(
      `¿Anular el préstamo de ${loan.internalCode || 'este equipo'}? Quedará disponible de nuevo.`
    )
    if (!confirmed) return

    try {
      await cancelLoan.mutateAsync({ serviceId, loanId: loan.id })
      toast.success('Préstamo anulado.')
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No pudimos anular el préstamo.'))
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant='body2' color='text.secondary'>
        Deja registrados los equipos de préstamo que se entregan al cliente con este
        servicio. Al entregar, haz aquí el chequeo de retorno de cada uno.
      </Typography>

      <Box>
        <Autocomplete
          size='small'
          options={options}
          value={selected}
          loading={isSearching}
          getOptionLabel={getOptionLabel}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          filterOptions={(items) => items}
          noOptionsText='No hay equipos de préstamo disponibles con esa búsqueda'
          onInputChange={(_, value, reason) => {
            if (reason === 'input') setSearch(value)
          }}
          onChange={(_, option) => setSelected(option)}
          renderInput={(params) => (
            <TextField
              {...params}
              label='Buscar equipo de préstamo disponible'
              placeholder='Código o nombre del equipo…'
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isSearching ? <CircularProgress size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }}
            />
          )}
        />
      </Box>

      {selected ? (
        <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1.5 }}>
            {getOptionLabel(selected)}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size='small'
                label='Estado visual al entregar'
                value={visualOut}
                onChange={(event) => setVisualOut(event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size='small'
                label='Prueba de funcionamiento'
                value={operationalOut}
                onChange={(event) => setOperationalOut(event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size='small'
                label='Observaciones'
                value={notesOut}
                onChange={(event) => setNotesOut(event.target.value)}
              />
            </Grid>
          </Grid>
          <Stack direction='row' spacing={1} justifyContent='flex-end' sx={{ mt: 2 }}>
            <Button size='small' onClick={resetOutForm} disabled={createLoan.isLoading}>
              Cancelar
            </Button>
            <Button
              size='small'
              variant='contained'
              onClick={() => void handleAdd()}
              disabled={createLoan.isLoading}
              sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' }, textTransform: 'none' }}
            >
              Dejar en préstamo
            </Button>
          </Stack>
        </Box>
      ) : null}

      {isLoading ? (
        <Box display='flex' justifyContent='center' py={2}>
          <CircularProgress size={24} />
        </Box>
      ) : loans.length === 0 ? (
        <Alert severity='info'>
          Aún no se han dejado equipos de préstamo en este servicio.
        </Alert>
      ) : (
        <>
          {pendingCount > 0 ? (
            <Alert severity='warning'>
              Este cliente tiene {pendingCount}{' '}
              {pendingCount === 1 ? 'equipo' : 'equipos'} de préstamo pendiente
              {pendingCount === 1 ? '' : 's'} de retorno.
            </Alert>
          ) : (
            <Alert severity='success'>Todos los equipos de préstamo fueron devueltos.</Alert>
          )}
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Equipo</TableCell>
                  <TableCell>Entregado</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align='right'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>
                        {loan.internalCode}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {[loan.equipmentName, loan.brand, loan.serialNumber]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{formatDateTime(loan.outDate)}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {loan.visualOutInspection} · {loan.operationalOutTest}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {loan.returned ? (
                        <Tooltip
                          title={[
                            loan.visualInInspection,
                            loan.operationalInTest,
                            loan.observationsIn
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        >
                          <Chip
                            size='small'
                            color='success'
                            label={`Devuelto ${formatDateTime(loan.inDate)}`}
                          />
                        </Tooltip>
                      ) : (
                        <Chip size='small' color='warning' label='Prestado' />
                      )}
                    </TableCell>
                    <TableCell align='right'>
                      {!loan.returned ? (
                        <Stack direction='row' spacing={0.5} justifyContent='flex-end'>
                          <Button
                            size='small'
                            variant='outlined'
                            startIcon={<AssignmentReturnOutlinedIcon />}
                            onClick={() => openReturn(loan)}
                            sx={{ textTransform: 'none' }}
                          >
                            Registrar retorno
                          </Button>
                          <Tooltip title='Anular préstamo'>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() => void handleCancel(loan)}
                              disabled={cancelLoan.isLoading}
                            >
                              <DeleteOutlineOutlinedIcon fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog
        open={Boolean(returnTarget)}
        onClose={returnLoan.isLoading ? undefined : () => setReturnTarget(null)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Chequeo de retorno</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Typography variant='body2'>
              {returnTarget ? getOptionLabel(returnTarget) : ''}
            </Typography>
            <TextField
              fullWidth
              label='Estado visual al recibir'
              value={visualIn}
              onChange={(event) => setVisualIn(event.target.value)}
            />
            <TextField
              fullWidth
              label='Prueba de funcionamiento'
              value={operationalIn}
              onChange={(event) => setOperationalIn(event.target.value)}
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              label='Observaciones'
              value={notesIn}
              onChange={(event) => setNotesIn(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnTarget(null)} disabled={returnLoan.isLoading}>
            Cancelar
          </Button>
          <Button
            variant='contained'
            onClick={() => void handleReturn()}
            disabled={returnLoan.isLoading}
            sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' }, textTransform: 'none' }}
          >
            Confirmar retorno
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default CalibrationServiceLoanEquipmentSection
