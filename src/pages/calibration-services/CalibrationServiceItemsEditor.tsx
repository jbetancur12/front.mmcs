import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  CalibrationServiceItemPayload,
  CalibrationServiceProductSummary
} from '../../types/calibrationService'
import { NumericFormatCustom } from '../../Components/NumericFormatCustom'

type CatalogPriceSourceOption = {
  value: 'medicalPrice' | 'industrialPrice' | 'thirdPartyPrice' | 'price'
  label: string
}

interface EditableCalibrationServiceItem
  extends CalibrationServiceItemPayload {
  localId: string
}

interface CalibrationServiceItemsEditorProps {
  items: EditableCalibrationServiceItem[]
  products: CalibrationServiceProductSummary[]
  serviceTypeOptions: string[]
  catalogPriceSourceOptions: readonly CatalogPriceSourceOption[]
  suggestedCatalogPriceSource: CatalogPriceSourceOption['value']
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
  onSelectCatalogPrice: (
    localId: string,
    product: CalibrationServiceProductSummary | null,
    priceSource: CatalogPriceSourceOption['value']
  ) => void
  onChangeItemOtherField: (
    localId: string,
    field: string,
    value: unknown
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

const getCatalogPriceValue = (
  product: CalibrationServiceProductSummary | null,
  priceSource: CatalogPriceSourceOption['value']
) => {
  if (!product) {
    return null
  }

  if (priceSource === 'medicalPrice') return product.medicalPrice ?? null
  if (priceSource === 'industrialPrice') return product.industrialPrice ?? null
  if (priceSource === 'thirdPartyPrice') return product.thirdPartyPrice ?? null
  return product.price ?? null
}

const CalibrationServiceItemsEditor = ({
  items,
  products,
  serviceTypeOptions,
  catalogPriceSourceOptions,
  suggestedCatalogPriceSource,
  canEdit,
  isBusy,
  onAddItem,
  onRemoveItem,
  onSelectProduct,
  onChangeItemField,
  onSelectCatalogPrice,
  onChangeItemOtherField
}: CalibrationServiceItemsEditorProps) => {
  return (
    <Stack spacing={3}>
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
            Configuración detallada de cantidades, productos, tipos de servicio y totales.
          </Typography>
        </Box>
        <Button
          variant='contained'
          color='primary'
          startIcon={<AddOutlinedIcon />}
          onClick={onAddItem}
          disabled={!canEdit || isBusy}
        >
          Agregar ítem
        </Button>
      </Stack>

      <Stack spacing={2}>
        {items.map((item, index) => {
          const selectedProduct =
            products.find((product) => product.id === item.productId) || null
          const totals = getItemTotals(item)
          const selectedCatalogPriceSource =
            (typeof item.otherFields?.catalogPriceSource === 'string'
              ? item.otherFields.catalogPriceSource
              : 'price') as CatalogPriceSourceOption['value']
          const itemNameLabel = item.itemName || 'Nuevo ítem'

          return (
            <Accordion
              key={item.localId}
              variant='outlined'
              defaultExpanded={!item.itemName}
              sx={{
                borderRadius: '8px !important',
                '&:before': { display: 'none' }, // removes the default accordion divider line
                transition: 'box-shadow 0.2s',
                '&:hover': {
                  boxShadow: 2
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel-${item.localId}-content`}
                id={`panel-${item.localId}-header`}
                sx={{
                  '& .MuiAccordionSummary-content': { 
                    alignItems: 'center', 
                    pr: 1 
                  }
                }}
              >
                <Typography
                  variant='subtitle2'
                  color='primary'
                  fontWeight='bold'
                  sx={{ textTransform: 'uppercase', letterSpacing: 1, mr: 2, minWidth: 80 }}
                >
                  Ítem #{index + 1}
                </Typography>
                
                <Typography variant='body2' fontWeight='medium' sx={{ flexGrow: 1 }}>
                  {item.quantity ? `${item.quantity} x ` : ''}{itemNameLabel} 
                  {totals.total > 0 ? ` · ${currencyFormatter.format(totals.total)}` : ''}
                </Typography>

                <IconButton
                  color='error'
                  disabled={!canEdit || isBusy}
                  size='small'
                  title='Eliminar ítem'
                  sx={{ mr: 1 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveItem(item.localId)
                  }}
                  onFocus={(e) => e.stopPropagation()}
                >
                  <DeleteOutlineOutlinedIcon />
                </IconButton>
              </AccordionSummary>
              
              <AccordionDetails sx={{ pt: 0, px: { xs: 2, sm: 3 }, pb: 3 }}>
                <Grid container spacing={2}>
                  {/* Fila 1: Selección de producto de catálogo */}
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      size='small'
                      options={products}
                      value={selectedProduct}
                      getOptionLabel={(option) => option.name || ''}
                      onChange={(_, value) => onSelectProduct(item.localId, value)}
                      disabled={!canEdit || isBusy}
                      renderInput={(params) => (
                        <TextField {...params} label='Producto catálogo' />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Stack spacing={0.75}>
                      <FormControl fullWidth size='small'>
                        <InputLabel>Precio catálogo</InputLabel>
                        <Select
                          value={selectedCatalogPriceSource}
                          label='Precio catálogo'
                          disabled={!canEdit || isBusy || !selectedProduct}
                          onChange={(event) => {
                            const nextPriceSource =
                              event.target.value as CatalogPriceSourceOption['value']
                            onChangeItemOtherField(
                              item.localId,
                              'catalogPriceSource',
                              nextPriceSource
                            )
                            onSelectCatalogPrice(
                              item.localId,
                              selectedProduct,
                              nextPriceSource
                            )
                          }}
                        >
                          {catalogPriceSourceOptions.map((option) => {
                            const optionValue = getCatalogPriceValue(
                              selectedProduct,
                              option.value
                            )

                            return (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                                {' · '}
                                {optionValue !== null
                                  ? currencyFormatter.format(optionValue)
                                  : 'Sin valor'}
                                {option.value === suggestedCatalogPriceSource
                                  ? ' · Sugerido'
                                  : ''}
                              </MenuItem>
                            )
                          })}
                        </Select>
                      </FormControl>
                      {selectedProduct ? (
                        <Stack
                          direction='row'
                          spacing={1}
                          alignItems='center'
                          flexWrap='wrap'
                        >
                          {selectedCatalogPriceSource ===
                          suggestedCatalogPriceSource ? (
                            <Chip
                              size='small'
                              color='success'
                              variant='outlined'
                              label='Usando precio sugerido'
                            />
                          ) : (
                            <Chip
                              size='small'
                              color='warning'
                              variant='outlined'
                              label='Precio del ítem ajustado'
                            />
                          )}
                          <Typography variant='caption' color='text.secondary'>
                            Sugerido para esta cotización:{' '}
                            {catalogPriceSourceOptions.find(
                              (option) =>
                                option.value === suggestedCatalogPriceSource
                            )?.label || 'Valor general'}
                          </Typography>
                        </Stack>
                      ) : null}
                    </Stack>
                  </Grid>

                  {/* Fila 2: Detalles del ítem */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size='small'
                      required
                      label='Nombre Ítem'
                      value={item.itemName}
                      disabled={!canEdit || isBusy}
                      onChange={(event) =>
                        onChangeItemField(item.localId, 'itemName', event.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
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
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
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
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
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
                  </Grid>

                  {/* Fila 3: Cantidad y Precios */}
                  <Grid item xs={12} sm={4} md={2}>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='Cantidad'
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
                  </Grid>
                  <Grid item xs={12} sm={4} md={3}>
                    <TextField
                      fullWidth
                      size='small'
                      label='Valor unitario'
                      value={item.unitPrice}
                      disabled={!canEdit || isBusy}
                      InputProps={{ inputComponent: NumericFormatCustom as never }}
                      onChange={(event) =>
                        onChangeItemField(
                          item.localId,
                          'unitPrice',
                          Number(event.target.value)
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={2}>
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
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      size='small'
                      label='Notas / Observaciones'
                      value={item.notes || ''}
                      disabled={!canEdit || isBusy}
                      onChange={(event) =>
                        onChangeItemField(item.localId, 'notes', event.target.value)
                      }
                    />
                  </Grid>
                </Grid>

                {/* Footer del card con los totales */}
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'flex-end',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 3
                  }}
                >
                  <Box textAlign={{ xs: 'left', sm: 'right' }}>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      Subtotal
                    </Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      {currencyFormatter.format(totals.subtotal)}
                    </Typography>
                  </Box>
                  <Box textAlign={{ xs: 'left', sm: 'right' }}>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      IVA
                    </Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      {currencyFormatter.format(totals.taxTotal)}
                    </Typography>
                  </Box>
                  <Box textAlign={{ xs: 'left', sm: 'right' }}>
                    <Typography variant='caption' color='primary' display='block'>
                      Total Línea
                    </Typography>
                    <Typography variant='h6' color='primary' fontWeight='bold' lineHeight={1}>
                      {currencyFormatter.format(totals.total)}
                    </Typography>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Stack>
    </Stack>
  )
}

export default CalibrationServiceItemsEditor

