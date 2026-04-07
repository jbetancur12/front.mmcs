import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import {
  CalibrationServiceItemPayload,
  CalibrationServiceProductSummary
} from '../../types/calibrationService'

interface EditableCalibrationServiceItem
  extends CalibrationServiceItemPayload {
  localId: string
}

interface CalibrationServiceItemsEditorProps {
  items: EditableCalibrationServiceItem[]
  products: CalibrationServiceProductSummary[]
  serviceTypeOptions: string[]
  canEdit: boolean
  isBusy: boolean
  onAddItem: () => void
  onRemoveItem: (localId: string) => void
  onSelectProduct: (
    localId: string,
    product: CalibrationServiceProductSummary | null
  ) => void
  onChangeItemField: (
    localId: string,
    field: keyof EditableCalibrationServiceItem,
    value: string | number | null
  ) => void
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const parsed = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(parsed) ? parsed : 0
}

const getItemTotals = (item: EditableCalibrationServiceItem) => {
  const subtotal = Math.max(Number(item.quantity) || 0, 0) * toNumber(item.unitPrice)
  const taxTotal = subtotal * (toNumber(item.taxRate) / 100)
  return { subtotal, taxTotal, total: subtotal + taxTotal }
}

const CalibrationServiceItemsEditor = ({
  items,
  products,
  serviceTypeOptions,
  canEdit,
  isBusy,
  onAddItem,
  onRemoveItem,
  onSelectProduct,
  onChangeItemField
}: CalibrationServiceItemsEditorProps) => {
  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        spacing={2}
      >
        <Box>
          <Typography variant='h6' fontWeight={700}>
            Ítems cotizados
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Tabla operativa para construir la cotización con cantidades, tipo
            de servicio y total por línea.
          </Typography>
        </Box>
        <Button
          variant='outlined'
          startIcon={<AddOutlinedIcon />}
          onClick={onAddItem}
          disabled={!canEdit || isBusy}
        >
          Agregar ítem
        </Button>
      </Stack>

      <Box sx={{ overflowX: 'auto' }}>
        <Table size='small' sx={{ minWidth: 1260 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 240 }}>Producto catálogo</TableCell>
              <TableCell sx={{ minWidth: 220 }}>Ítem</TableCell>
              <TableCell sx={{ minWidth: 180 }}>Instrumento</TableCell>
              <TableCell sx={{ minWidth: 160 }}>Intervalo</TableCell>
              <TableCell sx={{ minWidth: 110 }}>Cantidad</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Tipo servicio</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Valor unitario</TableCell>
              <TableCell sx={{ minWidth: 120 }}>IVA %</TableCell>
              <TableCell sx={{ minWidth: 180 }}>Notas</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Total línea</TableCell>
              <TableCell align='center' sx={{ minWidth: 90 }}>
                Acción
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => {
              const selectedProduct =
                products.find((product) => product.id === item.productId) || null
              const totals = getItemTotals(item)

              return (
                <TableRow key={item.localId} hover>
                  <TableCell>
                    <Autocomplete
                      size='small'
                      options={products}
                      value={selectedProduct}
                      getOptionLabel={(option) => option.name || ''}
                      onChange={(_, value) => onSelectProduct(item.localId, value)}
                      disabled={!canEdit || isBusy}
                      renderInput={(params) => (
                        <TextField {...params} label={`Producto ${index + 1}`} />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size='small'
                      required
                      label='Ítem'
                      value={item.itemName}
                      disabled={!canEdit || isBusy}
                      onChange={(event) =>
                        onChangeItemField(item.localId, 'itemName', event.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size='small'
                      label='Instrumento'
                      value={item.instrumentName || ''}
                      disabled={!canEdit || isBusy}
                      onChange={(event) =>
                        onChangeItemField(
                          item.localId,
                          'instrumentName',
                          event.target.value
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size='small'
                      label='Intervalo'
                      value={item.intervalText || ''}
                      disabled={!canEdit || isBusy}
                      onChange={(event) =>
                        onChangeItemField(
                          item.localId,
                          'intervalText',
                          event.target.value
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='Cant.'
                      value={item.quantity}
                      disabled={!canEdit || isBusy}
                      onChange={(event) =>
                        onChangeItemField(
                          item.localId,
                          'quantity',
                          Number(event.target.value)
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size='small'>
                      <InputLabel>Tipo servicio</InputLabel>
                      <Select
                        value={item.serviceType || 'Trazable'}
                        label='Tipo servicio'
                        disabled={!canEdit || isBusy}
                        onChange={(event) =>
                          onChangeItemField(
                            item.localId,
                            'serviceType',
                            event.target.value
                          )
                        }
                      >
                        {serviceTypeOptions.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='Valor unitario'
                      value={item.unitPrice}
                      disabled={!canEdit || isBusy}
                      onChange={(event) =>
                        onChangeItemField(
                          item.localId,
                          'unitPrice',
                          Number(event.target.value)
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='IVA %'
                      value={item.taxRate}
                      disabled={!canEdit || isBusy}
                      onChange={(event) =>
                        onChangeItemField(
                          item.localId,
                          'taxRate',
                          Number(event.target.value)
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size='small'
                      multiline
                      minRows={2}
                      label='Notas'
                      value={item.notes || ''}
                      disabled={!canEdit || isBusy}
                      onChange={(event) =>
                        onChangeItemField(item.localId, 'notes', event.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant='body2' fontWeight={700}>
                        {currencyFormatter.format(totals.total)}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Sub: {currencyFormatter.format(totals.subtotal)}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        IVA: {currencyFormatter.format(totals.taxTotal)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align='center'>
                    <IconButton
                      color='error'
                      disabled={!canEdit || isBusy}
                      onClick={() => onRemoveItem(item.localId)}
                    >
                      <DeleteOutlineOutlinedIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  )
}

export default CalibrationServiceItemsEditor
