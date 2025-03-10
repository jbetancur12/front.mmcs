import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from '@mui/material'
import { useParams } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../store/userStore'
import useAxiosPrivate from '@utils/use-axios-private'
import { debounce } from 'lodash'
import toast, { Toaster } from 'react-hot-toast'
import Loader from '../Loader2'

// Componentes refactorizados
import { StatusUpdateSection } from './StatusUpdateSection'
import { CustomerSelector } from './CustomerSelector'
import { ProductsSection } from './ProductsSection'
import { FinancialSummary } from './FinancialSummary'
import { PaymentConditionsSection } from './PaymentConditionsSection'
import { CommentsSection } from './CommentsSection'
import { ConditionsSection } from './ConditionsSection'
import { SubmitButton } from './SubmitButton'

// Tipos y constantes
import {
  Customer,
  HandleProductChangeType,
  OptionType,
  Product,
  QuoteFormData,
  StatusKey
} from './types'
import { statusOptions, paymentConditionsOptions, texts } from './constants'
import { styles } from '../ExcelManipulation/Utils'
import { NumericFormatCustom } from '../NumericFormatCustom'

const QuoteForm: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const { id } = useParams<{ id?: string }>()
  const $userStore = useStore(userStore)

  const [quoteType, setQuoteType] = useState<'equipos' | 'mantenimiento'>(
    'equipos'
  )
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [products, setProducts] = useState<Product[]>([
    { name: 'Buscar Producto', price: 0, quantity: 1, visits: 1 }
  ])
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(19)
  const [observations, setObservations] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('contado')
  const [onlyRead, setOnlyRead] = useState(false)
  const [status, setStatus] = useState({
    status: 'created' as StatusKey,
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
    generalConditions: texts(quoteType).generalConditions,
    paymentConditions: texts(quoteType, paymentMethod).paymentConditions,
    deliveryConditions: texts().deliveryConditions,
    maintenanceConditionsInLab: texts().maintenanceConditionsInLab,
    maintenanceConditionsInInSitu: texts().maintenanceConditionsInInSitu,
    methodsUsed: texts().methodsUsed,
    capacityAndResources: texts(quoteType).capacityAndResources
  })

  const loadOptions = useCallback(
    (inputValue: string) =>
      new Promise<any>((resolve) =>
        debounce(async () => {
          try {
            const response = await axiosPrivate.get(`/products`, {
              params: { q: inputValue }
            })
            resolve(
              response.data.map((item: any) => ({
                value: item.id,
                label: item.name,
                price: item.price
              }))
            )
          } catch (error) {
            console.error('Error al cargar opciones:', error)
            resolve([])
          }
        }, 1000)()
      ),
    []
  )

  const loadOptionsClient = useCallback(
    (inputValue: string) => {
      return new Promise<any[]>((resolve) => {
        const debouncedSearch = debounce(async (searchValue: string) => {
          try {
            const response = await axiosPrivate.get(`/customers`, {
              params: { q: searchValue }
            })
            const options = response.data.map((item: any) => ({
              value: item.id,
              label: item.nombre,
              ...item
            }))
            resolve(options)
          } catch (error) {
            console.error('Error al cargar opciones:', error)
            resolve([])
          }
        }, 1000)

        debouncedSearch(inputValue)
      })
    },
    [axiosPrivate]
  )

  const fetchQuote = useCallback(async () => {
    try {
      const response = await axiosPrivate.get<QuoteFormData>(`/quotes/${id}`)
      if (response.status === 200) {
        const { data } = response

        setTaxRate(data.taxRatio || 19) // Valor por defecto 19 si no existe
        setDiscount(data.discountRatio || 0) // Valor por defecto 0 si no existe
        setQuoteType(data.quoteType)

        // Verificar y convertir el status
        const lastStatus = data.status[data.status.length - 1]
        const isValidStatus = (s: string): s is StatusKey =>
          Object.keys(statusOptions).includes(s)

        const validStatus = isValidStatus(lastStatus.status)
          ? lastStatus.status
          : 'created'

        setStatus({
          ...lastStatus,
          status: validStatus
        })

        setCustomer(data.customer)
        setProducts(data.products)
        setDiscount(data.discountRatio)
        setTaxRate(data.taxRatio)
        setObservations(data.observations)
        setComments(data.comments)
        setOtherFields(data.otherFields)
        setPaymentMethod(data.otherFields.paymentMethod)

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
  }, [axiosPrivate, id])

  useEffect(() => {
    setOtherFields({
      generalConditions: texts(quoteType, paymentMethod).generalConditions,
      paymentConditions: texts(quoteType, paymentMethod).paymentConditions,
      deliveryConditions: texts(quoteType, paymentMethod).deliveryConditions,
      maintenanceConditionsInLab: texts(quoteType, paymentMethod)
        .maintenanceConditionsInLab,
      maintenanceConditionsInInSitu: texts(quoteType, paymentMethod)
        .maintenanceConditionsInInSitu,
      methodsUsed: texts(quoteType, paymentMethod).methodsUsed,
      capacityAndResources: texts(quoteType, paymentMethod).capacityAndResources
    })
  }, [quoteType, paymentMethod]) // <-- Aquí la magia de la actualización

  useEffect(() => {
    if (id) fetchQuote()
  }, [id, fetchQuote])

  const handleProductChange: HandleProductChangeType = (
    index,
    field,
    value,
    quoteType
  ) => {
    const updatedProducts = [...products]
    if (quoteType === 'mantenimiento' && field === 'visits') {
      updatedProducts[index] = {
        ...updatedProducts[index],
        visits: Number(value)
      }
    }
    if (field === 'product') {
      const product = value as OptionType
      updatedProducts[index] = {
        ...updatedProducts[index],
        name: product.label,
        price: product.price
      }
    } else {
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: value
      }
    }

    setProducts(updatedProducts)
  }

  const handleAddProduct = () => {
    const newProduct: Product = {
      name: '',
      price: 0,
      quantity: 1,
      ...(quoteType === 'mantenimiento' && { visits: 1 })
    }
    setProducts([...products, newProduct])
  }

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index)
    setProducts(updatedProducts)
  }

  const handleAddComment = () => {
    setComments([...comments, ''])
  }

  const handleCommentChange = (index: number, text: string) => {
    const updatedComments = [...comments]
    updatedComments[index] = text
    setComments(updatedComments)
  }

  const handleUpdateStatus = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await axiosPrivate.put(`/quotes/${id}/status`, {
        status: {
          ...status,
          date: new Date()
        }
      })
      toast.success('Estado actualizado exitosamente!')
    } catch (error) {
      console.error('Error actualizando estado:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) {
      toast.error('Selecciona un cliente')
      return
    }

    setLoading(true)

    try {
      const requestData = {
        customerId: customer.id,
        quoteType,
        products,
        taxRatio: taxRate,
        discountRatio: discount,
        observations,
        comments,
        otherFields: { ...otherFields, paymentMethod },
        status: !!id ? undefined : status
      }

      const response = id
        ? await axiosPrivate.put(`/quotes/${id}`, requestData)
        : await axiosPrivate.post('/quotes', requestData)

      if (response.status >= 200 && response.status < 300) {
        toast.success(
          `Cotización ${id ? 'actualizada' : 'creada'} exitosamente!`
        )
        if (!id) {
          // Resetear todos los campos
          setCustomer(null)
          setProducts([{ name: 'Buscar Producto', price: 0, quantity: 1 }])
          setDiscount(0)
          setTaxRate(19)
          setObservations('')
          setComments([
            'Pago 100% adelantado',
            `Forma de Pago: ${paymentConditionsOptions['contado']}`,
            'Sujeto a disponibilidad de inventario.'
          ])
          setStatus({
            status: 'created',
            user: $userStore.nombre,
            date: new Date(),
            comments: ''
          })
          setPaymentMethod('contado')
          setOnlyRead(false)
        }
        if (id) window.location.href = '/dashboard/cotizaciones'
      }
    } catch (error) {
      toast.error(`Error al ${id ? 'actualizar' : 'crear'} la cotización`)
    } finally {
      setLoading(false)
    }
  }

  const subtotal = products.reduce((_, product) => {
    const base = product.price * product.quantity
    return quoteType === 'mantenimiento'
      ? base * (product.visits || 1) // Usamos 1 como valor por defecto si no hay visitas
      : base
  }, 0)
  const discountAmount = subtotal * (discount / 100)
  const tax = (subtotal - discountAmount) * (taxRate / 100)
  const total = subtotal + tax - discountAmount

  return (
    <Box sx={{ margin: 'auto', p: 3 }}>
      <Toaster position='top-center' />
      <Loader loading={loading} />

      <Typography variant='h4' gutterBottom>
        {id ? `Cotización VT-${id}` : 'Nueva Cotización'}
      </Typography>

      <form onSubmit={handleSubmit}>
        {id && (
          <StatusUpdateSection
            status={status}
            handleStatus={(e) =>
              setStatus({ ...status, status: e.target.value as StatusKey })
            }
            handleUpdateStatus={handleUpdateStatus}
            onStatusChange={setStatus}
          />
        )}
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo de Cotización</InputLabel>
            <Select
              value={quoteType}
              onChange={(e) =>
                setQuoteType(e.target.value as 'equipos' | 'mantenimiento')
              }
              label='Tipo de Cotización'
              disabled={!!id} // Deshabilitar si es edición
            >
              <MenuItem value='equipos'>Venta de Equipos</MenuItem>
              <MenuItem value='mantenimiento'>
                Servicios de Mantenimiento
              </MenuItem>
            </Select>
          </FormControl>
        </Paper>

        <CustomerSelector
          loadOptions={loadOptionsClient}
          setCustomer={setCustomer}
          customer={customer}
          id={id}
          onlyRead={onlyRead}
          styles={styles}
        />

        <ProductsSection
          products={products}
          handleAddProduct={handleAddProduct}
          handleProductChange={handleProductChange}
          handleRemoveProduct={handleRemoveProduct}
          loadOptions={loadOptions}
          onlyRead={onlyRead}
          quoteType={quoteType}
        />

        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            label='Descuento (%)'
            type='number'
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            InputProps={{
              inputComponent: NumericFormatCustom as any,
              readOnly: onlyRead // Cambiar de disabled a readOnly
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label='IVA (%)'
            type='number'
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            InputProps={{
              inputComponent: NumericFormatCustom as any,
              readOnly: onlyRead // Cambiar de disabled a readOnly
            }}
          />
        </Paper>

        <FinancialSummary
          subtotal={subtotal}
          discountAmount={discountAmount}
          tax={tax}
          taxRate={taxRate}
          discount={discount}
          total={total}
        />

        <PaymentConditionsSection
          paymentMethod={paymentMethod}
          handlePaymentChange={(e) => setPaymentMethod(e.target.value)}
          onlyRead={onlyRead}
        />

        <CommentsSection
          comments={comments}
          handleAddComment={handleAddComment}
          handleCommentChange={handleCommentChange}
          onlyRead={onlyRead}
        />

        <ConditionsSection
          otherFields={otherFields}
          quoteType={quoteType}
          handleOtherFields={(e) =>
            setOtherFields({ ...otherFields, [e.target.name]: e.target.value })
          }
          onlyRead={onlyRead}
        />

        <SubmitButton onlyRead={onlyRead} hasId={!!id} />
      </form>
    </Box>
  )
}

export default QuoteForm
