import React, { useCallback, useEffect, useState } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

import toast, { Toaster } from 'react-hot-toast'
import { useParams } from 'react-router-dom'
import Loader from './Loader2'
import AsyncSelect from 'react-select/async'
import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Skeleton
} from '@mui/material'
import { useStore } from '@nanostores/react'
import { userStore } from '../store/userStore'
import { statusOptions } from './TableQuotes'
import { NumericFormatCustom } from './NumericFormatCustom'
import { styles } from './ExcelManipulation/Utils'
import useAxiosPrivate from '@utils/use-axios-private'
import { debounce } from 'lodash'

interface Product {
  name: string
  price: number
  quantity: number
}

export interface Customer {
  id: number
  nombre: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  value: string
}
interface QuoteFormData {
  id?: number // Agregamos el signo de interrogación para indicar que el ID es opcional
  customer: Customer | null
  products: Product[]
  discountRatio: number
  taxRatio: number
  observations: string
  comments: string[]
  otherFields: {
    paymentMethod: string
    generalConditions: string
    paymentConditions: string
    deliveryConditions: string
  }
  status: {
    status: string
    user: string
    date: Date
    comments: string
  }[]
}

interface OptionType {
  value: string
  label: string
  price: number
}
interface PaymentConditionsOptions {
  [key: string]: string
}

const paymentConditionsOptions: PaymentConditionsOptions = {
  contado: 'De contado',
  credito: 'Crédito'
}

const QuoteForm: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const { id } = useParams<{ id?: string }>()
  const $userStore = useStore(userStore)

  const [customer, setCustomer] = useState<Customer | null>(null)

  const [products, setProducts] = useState<Product[]>([
    { name: 'Buscar Producto', price: 0, quantity: 1 }
  ])
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(19)
  const [observations, setObservations] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('contado')
  const [onlyRead, setOnlyRead] = useState(false)
  const [status, setStatus] = useState({
    status: 'created',
    user: $userStore.nombre,
    date: new Date(),
    comments: ''
  })

  const [comments, setComments] = useState<string[]>([
    'Pago 100% adelantado',
    `Forma de Pago: ${paymentConditionsOptions[paymentMethod]}`,
    'Sujeto a disponibilidad de inventario.'
  ])
  const [otherFields, setOtherFields] = useState({
    generalConditions:
      'Metromedics es responsable del manejo de toda la información del cliente obtenida durante la ejecución de las actividades de calibración.\nEl personal de Metromedics no está sometido a presiones comerciales, financieras o de otro tipo, tanto externas como internas que puedan influenciar el juicio técnico y transparente de los resultados obtenidos en el servicio',
    paymentConditions: `La validez de la presente oferta es de 30 días.\nEl pago debe ser realizado en la cuenta de ahorros N° 85138050837 de banco Bancolombia, a nombre de Metromedics S.A.S.\nUna vez realizado el pago, favor enviar copia del soporte de pago a la siguiente dirrección de correo electronico,    comercial@metromedicslab.com.co\nForma de Pago es ${paymentConditionsOptions[paymentMethod]}`,
    deliveryConditions:
      'Tiempo de entrega: 15 días hábiles a partir de la fecha de pago.'
  })
  const handlePaymentChange = (e: SelectChangeEvent) => {
    setPaymentMethod(e.target.value as string)
  }

  const handleStatus = (e: SelectChangeEvent) => {
    setStatus({ ...status, status: e.target.value as string })
  }

  const handleOtherFields = (e: any) => {
    setOtherFields({ ...otherFields, [e.target.name]: e.target.value })
  }

  useEffect(() => {
    setComments([
      'Pago 100% adelantado',
      `Forma de Pago: ${paymentConditionsOptions[paymentMethod]}`,
      'Sujeto a disponibilidad de inventario.'
    ])
    setOtherFields({
      ...otherFields,
      paymentConditions: `La validez de la presente oferta es de 30 días.\nEl pago debe ser realizado en la cuenta de ahorros N° 85138050837 de banco Bancolombia, a nombre de Metromedics S.A.S.\nUna vez realizado el pago, favor enviar copia del soporte de pago a la siguiente dirrección de correo electronico,    comercial@metromedicslab.com.co\nForma de Pago es ${paymentConditionsOptions[paymentMethod]}`
    })
  }, [paymentMethod])

  //#region LoadOptions

  const loadOptions = useCallback(
    debounce(async (inputValue: string) => {
      try {
        const response = await axiosPrivate.get(`/products`, {
          params: { q: inputValue }
        })
        const data = response.data
        return data.map((item: any) => ({
          value: item.id,
          label: item.name,
          price: item.price
        }))
      } catch (error) {
        console.error('Error al cargar opciones:', error)
        throw error
      }
    }, 1000),
    []
  )

  const loadOptionsClient = useCallback(
    debounce(async (inputValue: string) => {
      try {
        const response = await axiosPrivate.get(`/customers`, {
          params: { q: inputValue }
        })
        const data = response.data
        return data.map((item: any) => ({
          value: item.id,
          label: item.nombre
        }))
      } catch (error) {
        console.error('Error al cargar opciones:', error)
        throw error
      }
    }, 1000),
    []
  )

  const fetchQuote = async () => {
    try {
      const response = await axiosPrivate.get<QuoteFormData>(`/quotes/${id}`)

      if (response.statusText === 'OK') {
        const { data } = response
        setCustomer(data.customer)
        setProducts(data.products)
        setDiscount(data.discountRatio)
        setTaxRate(data.taxRatio)
        setObservations(data.observations)
        setComments(data.comments)
        setOtherFields(data.otherFields)
        setPaymentMethod(data.otherFields.paymentMethod)
        setStatus(data.status[data.status.length - 1])
        setOnlyRead(
          data.status.some(
            (status) =>
              status.status === 'accepted' || status.status === 'rejected'
          )
        )
      }
    } catch (error) {
      console.error('Error fetching quote data:', error)
    }
  }

  useEffect(() => {
    if (id) {
      fetchQuote()
    }
  }, [id])

  const handleProductChange = (
    index: number,
    field: string,
    value: string | number | OptionType | Product
  ) => {
    const updatedProducts = products.map((product, idx) => {
      if (idx === index && field !== 'product') {
        return {
          ...product,
          [field]: value
        }
      } else if (idx === index && field === 'product') {
        const { label, price } = value as OptionType
        return {
          ...product,
          name: label,
          price: price
        }
      } else {
        return product
      }
    })

    setProducts(updatedProducts)
  }

  const handleAddProduct = () => {
    setProducts([...products, { name: '', price: 0, quantity: 1 }])
  }

  const handleAddComment = () => {
    setComments([...comments, ''])
  }

  const handleCommentChange = (index: number, text: string) => {
    const updatedComments = [...comments]
    updatedComments[index] = text
    setComments(updatedComments)
  }

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = [...products]
    updatedProducts.splice(index, 1)
    setProducts(updatedProducts)
  }

  const subtotal = products.reduce(
    (acc, product) => acc + product.price * product.quantity,
    0
  )
  const discountAmount = subtotal * (discount / 100) // Calcula el monto del descuento
  const tax = (subtotal - discountAmount) * (taxRate / 100)
  const total = subtotal + tax - discountAmount // Aplica el descuento al total

  const handleUpdateStatus = async (e: any) => {
    e.preventDefault()
    try {
      const response = await axiosPrivate.put(
        `/quotes/${id}/status`,
        {
          status: {
            status: status.status,
            user: status.user,
            date: new Date(),
            comments: status.comments
          }
        },
        {}
      )

      if (response.status >= 200 && response.status < 300) {
        toast.success('Estado actualizado exitosamente!', {
          duration: 4000,
          position: 'top-center'
        })
      } else {
        throw new Error('Error al actualizar el estado')
      }
    } catch (error) {
      console.error('Error de red:', error)
      toast.error(
        'Error al actualizar el estado. Por favor, inténtalo de nuevo.'
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!customer) {
      toast.error('Por favor, selecciona un cliente.')
      return
    }
    if (products.length === 0 || products.some((product) => !product.name)) {
      toast.error('Por favor, agrega al menos un producto.')
      return
    }
    setLoading(true)

    const requestConfig = {}

    const requestData = {
      customerId: customer?.value,
      products,
      taxRatio: taxRate,
      discountRatio: discount,
      observations,
      comments,
      otherFields: { ...otherFields, paymentMethod: paymentMethod },
      status: {
        status: status.status,
        user: status.user,
        date: new Date(),
        comments: status.comments
      }
    }

    try {
      let response
      let actionMessage

      if (!!id) {
        response = await axiosPrivate.put(
          `/quotes/${id}`,
          requestData,
          requestConfig
        )
        actionMessage = 'modificada'
      } else {
        response = await axiosPrivate.post(
          `/quotes`,
          requestData,
          requestConfig
        )
        actionMessage = 'creada'
      }

      if (response.status >= 200 && response.status < 300) {
        setLoading(false)
        toast.success(`Cotización ${actionMessage} Exitosamente!`, {
          duration: 4000,
          position: 'top-center'
        })
        if (!id) {
          setProducts([{ name: '', price: 0, quantity: 0 }])
          setCustomer(null)
        } else {
          window.location.href = '/dashboard/cotizaciones'
        }
      } else {
        throw new Error('Error al crear equipo')
      }
    } catch (error) {
      setLoading(false)
      console.error('Error de red:', error)
      toast.error(
        'Error al crear la cotización. Por favor, inténtalo de nuevo.'
      )
    }
  }

  let edit = id ? products[0].name !== '' : true

  if (id && customer === null) {
    return <Skeleton />
  }

  return (
    <Box sx={{ margin: 'auto' }}>
      <Toaster />
      <Loader loading={loading} />
      <Typography variant='h4' component='h1' sx={{ mb: 2 }}>
        {!!id ? `Cotización VT-${id}` : 'Nueva Cotización'}
      </Typography>

      <form onSubmit={handleSubmit}>
        {!!id && (
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <FormControl fullWidth>
                  <InputLabel id='demo-simple-select-label'>Estado</InputLabel>
                  <Select
                    labelId='status-label'
                    id='status'
                    label='Estado'
                    variant='outlined'
                    value={status.status}
                    onChange={handleStatus}
                    sx={{ mb: 2 }}
                  >
                    {Object.keys(statusOptions).map((key) => (
                      <MenuItem key={key} value={key}>
                        {statusOptions[key]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={9}>
                <TextField
                  label='Observaciones'
                  variant='outlined'
                  multiline
                  rows={1}
                  value={status.comments}
                  onChange={(e) =>
                    setStatus({ ...status, comments: e.target.value })
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid
                item
                xs={3}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Button
                  type='submit'
                  variant='contained'
                  onClick={handleUpdateStatus}
                >
                  Actualizar Estado
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <AsyncSelect
            isDisabled={onlyRead}
            cacheOptions
            // defaultOptions

            placeholder='Buscar Cliente'
            loadOptions={loadOptionsClient}
            onChange={(selectedOption: any) =>
              setCustomer(selectedOption) as any
            }
            defaultValue={
              id && {
                value: customer?.id,
                label: customer?.nombre
              }
            }
            styles={styles(!!customer)}
          />
        </Paper>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          {products.length > 0 &&
            edit &&
            products.map((product, index) => {
              const productName = product.name

              return (
                <div
                  key={index}
                  style={{ display: 'flex', marginBottom: '8px' }}
                >
                  <div style={{ marginRight: '10px', width: '50%' }}>
                    <AsyncSelect
                      cacheOptions
                      isDisabled={onlyRead}
                      loadOptions={loadOptions}
                      onChange={(selectedOption: any) => {
                        handleProductChange(index, 'product', selectedOption)
                      }}
                      placeholder='Buscar Producto'
                      defaultValue={
                        id && {
                          value: index,
                          label: productName
                        }
                      }
                      classNamePrefix='react-select'
                      styles={styles(!!productName)}
                    />
                  </div>

                  <TextField
                    disabled={onlyRead}
                    label='Precio'
                    variant='outlined'
                    name='price'
                    value={product.price}
                    onChange={(e) =>
                      handleProductChange(index, 'price', e.target.value)
                    }
                    InputProps={{
                      inputComponent: NumericFormatCustom as any
                    }}
                    style={{ marginRight: '8px', flex: 1 }}
                    sx={{ mr: 2, width: '100%' }}
                    // thousandSeparator={true}
                    // prefix="$"
                    // customInput={TextField}
                  />
                  <TextField
                    disabled={onlyRead}
                    label='Cantidad'
                    variant='outlined'
                    type='number'
                    value={product.quantity}
                    onChange={(e) =>
                      handleProductChange(
                        index,
                        'quantity',
                        parseInt(e.target.value)
                      )
                    }
                    style={{ marginRight: '8px', flex: 0.5 }}
                    sx={{ mr: 2, width: '100%' }}
                  />
                  <TextField
                    disabled={onlyRead}
                    label='Total'
                    variant='outlined'
                    value={product.quantity * product.price}
                    style={{ marginRight: '8px', flex: 1 }}
                    sx={{ mr: 2, width: '100%' }}
                    InputProps={{
                      readOnly: true,
                      inputComponent: NumericFormatCustom as any
                    }}
                  />
                  <Button
                    disabled={onlyRead}
                    variant='contained'
                    color='error'
                    onClick={() => handleRemoveProduct(index)}
                    sx={{ mr: 1, width: '10px' }}
                  >
                    X
                  </Button>
                </div>
              )
            })}
          <Button
            variant='contained'
            onClick={handleAddProduct}
            sx={{ mb: 2 }}
            disabled={onlyRead}
          >
            Agregar Producto
          </Button>
        </Paper>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <TextField
            disabled={onlyRead}
            label='Descuento (%)'
            variant='outlined'
            type='number'
            value={discount}
            onChange={(e) => setDiscount(parseFloat(e.target.value))}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            disabled={onlyRead}
            label='IVA (%)'
            variant='outlined'
            type='number'
            value={taxRate}
            onChange={(e) => setTaxRate(parseInt(e.target.value))}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Paper>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Typography variant='subtitle1'>
            Subtotal: $
            {subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </Typography>
          <Typography variant='subtitle1'>
            Descuento: $
            {discountAmount.toLocaleString('es-ES', {
              minimumFractionDigits: 2
            })}{' '}
            ({discount}%)
          </Typography>
          <Typography variant='subtitle1'>
            IVA ({taxRate}%): $
            {tax.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </Typography>
          <Typography variant='h6'>
            Total: $
            {total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </Typography>
        </Paper>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <FormControl>
            <InputLabel id='demo-simple-select-label'>Forma de Pago</InputLabel>
            <Select
              disabled={onlyRead}
              labelId='demo-simple-select-label'
              id='demo-simple-select'
              label='Forma de Pago'
              variant='outlined'
              value={paymentMethod}
              onChange={handlePaymentChange}
              sx={{ mb: 2 }}
            >
              {Object.keys(paymentConditionsOptions).map((key) => (
                <MenuItem key={key} value={key}>
                  {paymentConditionsOptions[key]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Typography variant='h4' component='p' sx={{ mb: 2 }}>
            Comentarios
          </Typography>

          {comments.map((comment, index) => (
            <Grid
              container
              spacing={2}
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Grid item xs={11} width='100%'>
                <TextField
                  disabled={onlyRead}
                  key={index}
                  label={`Comentario ${index + 1} `}
                  variant='outlined'
                  multiline
                  rows={1}
                  value={comment}
                  onChange={(e) => handleCommentChange(index, e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={1}>
                <Button
                  variant='contained'
                  color='error'
                  onClick={() => {
                    const updatedComments = [...comments]
                    updatedComments.splice(index, 1)
                    setComments(updatedComments)
                  }}
                  sx={{ mb: 2 }}
                >
                  X
                </Button>
              </Grid>
            </Grid>
          ))}
          <Button
            variant='contained'
            onClick={handleAddComment}
            sx={{ mb: 2 }}
            disabled={onlyRead}
          >
            Agregar Comentario
          </Button>
        </Paper>
        {/* <TextField
          label="Observaciones"
          variant="outlined"
          multiline
          rows={4}
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        /> */}
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <TextField
            disabled={onlyRead}
            name='generalConditions'
            label='Condiciones Generales'
            variant='outlined'
            multiline
            rows={4}
            value={otherFields.generalConditions}
            onChange={handleOtherFields}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            disabled={onlyRead}
            name='paymentConditions'
            label='Condiciones de Pago'
            variant='outlined'
            multiline
            rows={4}
            value={otherFields.paymentConditions}
            onChange={handleOtherFields}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            disabled={onlyRead}
            name='deliveryConditions'
            label='Condiciones de Entrega'
            variant='outlined'
            multiline
            rows={1}
            value={otherFields.deliveryConditions}
            onChange={handleOtherFields}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Paper>
        <Button
          type='submit'
          variant='contained'
          sx={{ mb: 2 }}
          disabled={onlyRead}
        >
          {!!id ? 'Actualizar' : 'Crear'}
        </Button>
      </form>
    </Box>
  )
}

export default QuoteForm
