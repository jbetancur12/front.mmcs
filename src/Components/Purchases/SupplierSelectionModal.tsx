// components/SupplierSelectionModal.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Paper,
  Typography,
  Divider,
  FormGroup,
  Grid,
  TextField,
  MenuItem,
  InputLabel,
  FormControl,
  Alert,
  Select,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox
} from '@mui/material'

import { useEffect, useState } from 'react'
import withReactContent from 'sweetalert2-react-content'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  FormState,
  SupplierFormData,
  Criterion
} from 'src/pages/Purchases/Types'
import Swal from 'sweetalert2'

interface SupplierSelectionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  criteria: Criterion[]
  categories: string[]
}

const initialSupplierData = {
  name: '',
  taxId: '',
  phone: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  accountType: '',
  accountNumber: '',
  bankName: '',
  product: ''
}

const SupplierSelectionModal = ({
  open,
  onClose,
  onSuccess,
  criteria,
  categories
}: SupplierSelectionModalProps) => {
  const MySwal = withReactContent(Swal)
  const axiosPrivate = useAxiosPrivate()
  const [isSubmitting, setIsSubmitting] = useState(false) // Estado faltante
  const [formState, setFormState] = useState<FormState>({
    supplierData: initialSupplierData,
    providerType: '',
    selections: {},
    scores: {},
    totalScore: 0,
    whichAnswers: {}
  })
  const [error, setError] = useState<string>('')

  const groupedCriteria = criteria.reduce(
    (acc, criterion) => {
      const key = criterion.category
      if (!acc[key]) acc[key] = []
      acc[key].push(criterion)
      return acc
    },
    {} as Record<string, Criterion[]>
  )

  const handleSupplierInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormState((prev) => ({
      ...prev,
      supplierData: {
        ...prev.supplierData,
        [e.target.name]: e.target.value
      }
    }))
  }

  const handleSelectionChange = (
    category: string,
    criterion: Criterion,
    isChecked: boolean
  ) => {
    setError('')
    const newSelections = { ...formState.selections }
    const newWhichAnswers = { ...formState.whichAnswers }

    // // Manejar campo which
    // if (category === 'CALIDAD' && criterion.requiresWhich) {
    //   setFormState((prev) => ({ ...prev, showWhich: isChecked }))
    //   if (!isChecked) setFormState((prev) => ({ ...prev, which: undefined }))
    // }

    const isSingleSelect = [
      'PRECIO',
      'TIEMPO DE ENTREGA',
      'GARANTIA',
      'EXPERIENCIA',
      'RÉGIMEN TRIBUTARIO',
      'CONDICIONES DE PAGO'
    ].includes(category)

    if (isSingleSelect) {
      // Radio Button: Reemplazar selección anterior
      newSelections[category] = isChecked ? [criterion.id] : []
    } else {
      // Checkbox: Manejar múltiples selecciones
      newSelections[category] = newSelections[category] || []
      if (isChecked) {
        if (!newSelections[category].includes(criterion.id)) {
          newSelections[category].push(criterion.id)
        }
      } else {
        newSelections[category] = newSelections[category].filter(
          (id) => id !== criterion.id
        )
      }
    }

    if (criterion.requiresWhich && !isChecked) {
      newWhichAnswers[criterion.id] = ''
    }

    // Calcular puntuación
    const newScores: Record<string, number> = {}
    let total = 0

    Object.entries(newSelections).forEach(([cat, ids]) => {
      const categoryScore = ids.reduce((sum, id) => {
        const c = criteria.find((c) => c.id === id)
        return sum + (c?.baseScore || 0)
      }, 0)
      newScores[cat] = categoryScore
      total += categoryScore
    })

    setFormState((prev) => ({
      ...prev,
      selections: newSelections,
      scores: newScores,
      totalScore: total,
      whichAnswers: newWhichAnswers
    }))
  }

  const handleWhichChange = (criterionId: number, value: string) => {
    setFormState((prev) => ({
      ...prev,
      whichAnswers: {
        ...prev.whichAnswers,
        [criterionId]: value
      }
    }))
  }

  const validateForm = () => {
    const { supplierData, providerType, selections, whichAnswers } = formState
    const requiredFields = [
      supplierData.name,
      supplierData.taxId,
      supplierData.email,
      supplierData.address,
      providerType
    ]

    if (requiredFields.some((field) => !field)) {
      setError('Todos los campos básicos del proveedor son requeridos')
      return false
    }

    // Verificar que si un criterio de CALIDAD requiereWhich fue seleccionado,
    // entonces su "cual" no esté vacío.
    // (Si quisieras hacerlo global, no solo en CALIDAD, puedes quitar el `if (c.category === 'CALIDAD')`)
    for (const c of criteria) {
      if (c.category === 'CALIDAD' && c.requiresWhich) {
        // Si este criterio está seleccionado
        const isSelected = (selections[c.category] || []).includes(c.id)
        if (isSelected) {
          // Debe haber un "whichAnswers[c.id]"
          if (!whichAnswers[c.id] || whichAnswers[c.id].trim() === '') {
            setError(`Debe especificar el "Cuál" para: ${c.name}`)
            return false
          }
        }
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      // Preparamos los detalles de evaluación a partir de las selecciones
      const details = Object.values(formState.selections)
        .flat()
        .map((id) => {
          const foundCriterion = criteria.find((c) => c.id === id)
          return {
            selectionSupplierSubItemId: id,
            answer: true,
            which: formState.whichAnswers[id] || null,
            actualScore: foundCriterion?.baseScore || 0
          }
        })

      /* 
        Armamos el payload:
        - Si el puntaje es >= 61, se envían los datos del proveedor (para que se cree).
        - Si no se cumple, se envía supplierData como null y se crea solo la evaluación.
        - evaluationData incluye la fecha y la decisión final según el puntaje.
        - details es el arreglo de detalles de evaluación.
      */
      const { product, ...supplierDataWithoutProduct } = formState.supplierData
      const payload = {
        supplierData: {
          ...supplierDataWithoutProduct,
          typePerson: formState.providerType === 'Natural' ? 1 : 0
        },

        evaluationData: {
          // Si se crea el proveedor, el backend usará el ID del proveedor recién creado.
          // Si no se crea, puedes enviar null o forzarlo a null.
          supplierId: formState.totalScore < 61 ? null : undefined,
          selectionSupplierDate: new Date().toISOString(),
          product,
          finalDecision:
            formState.totalScore >= 81
              ? 'APPROVED'
              : formState.totalScore >= 61
                ? 'APPROVED WITH RESERVE'
                : 'NOT APPROVED'
        },
        details
      }

      // Llamada al endpoint único que maneja toda la operación dentro de una transacción
      await axiosPrivate.post('/suppliers', payload)

      const finalDecision = payload.evaluationData.finalDecision
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon:
          finalDecision === 'APPROVED' ||
          finalDecision === 'APPROVED WITH RESERVE'
            ? 'success'
            : 'error',
        title:
          finalDecision === 'APPROVED' ||
          finalDecision === 'APPROVED WITH RESERVE'
            ? 'Proveedor aprobado'
            : 'Proveedor no aprobado',
        showConfirmButton: false,
        timer: 3000
      })

      // Reiniciar el formulario
      setFormState({
        supplierData: initialSupplierData,
        providerType: '',
        selections: {},
        scores: {},
        totalScore: 0,
        whichAnswers: {}
      })
      onSuccess()
      onClose()
    } catch (error) {
      console.log(error)
      setError('Error guardando la información')
    } finally {
      setIsSubmitting(false) // Asegurar reset del estado
    }
  }

  const handleClose = () => {
    // Resetear el estado al cerrar
    setFormState({
      supplierData: initialSupplierData,
      providerType: '',
      selections: {},
      scores: {},
      totalScore: 0,
      whichAnswers: {}
    })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='lg'
      fullWidth
      scroll='paper'
    >
      <DialogTitle>Evaluar Nuevo Proveedor</DialogTitle>
      <DialogContent dividers>
        <Box component='form' onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            {error && (
              <Alert severity='error' sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* 1) Selector de tipo de proveedor */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Tipo de Proveedor *</InputLabel>
              <Select
                value={formState.providerType}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    providerType: e.target.value as any,
                    selections: {},
                    scores: {},
                    totalScore: 0
                  }))
                }
                required
              >
                <MenuItem value='Juridical'>Jurídico</MenuItem>
                <MenuItem value='Natural'>Natural</MenuItem>
              </Select>
            </FormControl>

            {/* 2) Renderiza los campos SOLO si hay un tipo seleccionado */}
            {formState.providerType && (
              <>
                {/* Sección de datos del proveedor */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant='h6' gutterBottom>
                    Información Básica
                  </Typography>

                  <Grid container spacing={2}>
                    {formState.providerType === 'Juridical' && (
                      <>
                        {/* Ejemplo de campos para Jurídico */}
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Razón Social'
                            name='name'
                            value={formState.supplierData.name}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='NIT'
                            name='taxId'
                            value={formState.supplierData.taxId}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Celular'
                            name='mobile'
                            value={formState.supplierData.mobile || ''}
                            onChange={handleSupplierInputChange}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Contacto'
                            name='contactName'
                            value={formState.supplierData.contactName || ''}
                            onChange={handleSupplierInputChange}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Cargo'
                            name='position'
                            value={formState.supplierData.position || ''}
                            onChange={handleSupplierInputChange}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Dirección'
                            name='address'
                            value={formState.supplierData.address}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Ciudad'
                            name='city'
                            value={formState.supplierData.city}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Teléfono'
                            name='phone'
                            value={formState.supplierData.phone}
                            onChange={handleSupplierInputChange}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Email'
                            name='email'
                            value={formState.supplierData.email}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Banco'
                            name='bankName'
                            value={formState.supplierData.bankName}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Tipo de cuenta'
                            name='accountType'
                            value={formState.supplierData.accountType}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Numero de cuenta'
                            name='accountNumber'
                            value={formState.supplierData.accountNumber}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Producto que ofrece'
                            name='product'
                            value={formState.supplierData.product}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                      </>
                    )}

                    {formState.providerType === 'Natural' && (
                      <>
                        {/* Ejemplo de campos para Natural */}
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Nombre'
                            name='name'
                            value={formState.supplierData.name}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='C.C.'
                            name='taxId'
                            value={formState.supplierData.taxId}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Profesión'
                            name='position'
                            value={formState.supplierData.position || ''}
                            onChange={handleSupplierInputChange}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Ciudad / País'
                            name='city'
                            value={formState.supplierData.city}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Departamento'
                            name='state'
                            value={formState.supplierData.state || ''}
                            onChange={handleSupplierInputChange}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Dirección'
                            name='address'
                            value={formState.supplierData.address}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Teléfono'
                            name='phone'
                            value={formState.supplierData.phone}
                            onChange={handleSupplierInputChange}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Email'
                            name='email'
                            value={formState.supplierData.email}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Banco'
                            name='bankName'
                            value={formState.supplierData.bankName}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Tipo de cuenta'
                            name='accountType'
                            value={formState.supplierData.accountType}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Numero de cuenta'
                            name='accountNumber'
                            value={formState.supplierData.accountNumber}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label='Servicio que ofrece'
                            name='product'
                            value={formState.supplierData.product}
                            onChange={handleSupplierInputChange}
                            required
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Paper>

                {/* Sección de criterios */}
                {categories.map((category) => (
                  <Paper key={category} sx={{ p: 2, mb: 3 }}>
                    <Typography variant='h6'>{category}</Typography>
                    <Divider sx={{ mb: 2 }} />

                    <FormGroup>
                      {(groupedCriteria[category] || [])
                        .filter(
                          (c) =>
                            c.type === 'Both' ||
                            c.type === formState.providerType
                        )
                        .map((criterion) => {
                          const isSelected = (
                            formState.selections[category] || []
                          ).includes(criterion.id)

                          const shouldShowWhich =
                            criterion.requiresWhich &&
                            category === 'CALIDAD' &&
                            isSelected

                          return (
                            <Box key={criterion.id} sx={{ mb: 1 }}>
                              {[
                                'PRECIO',
                                'TIEMPO DE ENTREGA',
                                'GARANTIA',
                                'EXPERIENCIA',
                                'RÉGIMEN TRIBUTARIO',
                                'CONDICIONES DE PAGO'
                              ].includes(category) ? (
                                <RadioGroup
                                  value={
                                    formState.selections[category]?.[0] || ''
                                  }
                                  onChange={(e) =>
                                    handleSelectionChange(
                                      category,
                                      criterion,
                                      e.target.checked
                                    )
                                  }
                                >
                                  <FormControlLabel
                                    value={criterion.id}
                                    control={<Radio />}
                                    label={`${criterion.name} (${criterion.baseScore} pts)`}
                                  />
                                </RadioGroup>
                              ) : (
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={(e) =>
                                        handleSelectionChange(
                                          category,
                                          criterion,
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={`${criterion.name} (${criterion.baseScore} pts)`}
                                />
                              )}

                              {/* Si está en CALIDAD, requiereWhich y está seleccionado, renderiza "Cuál" */}
                              {shouldShowWhich && (
                                <TextField
                                  sx={{ ml: 4, mt: 1 }} // pequeño margen para que se vea debajo/del lado
                                  label='¿Cuál?'
                                  value={
                                    formState.whichAnswers[criterion.id] || ''
                                  }
                                  onChange={(e) =>
                                    handleWhichChange(
                                      criterion.id,
                                      e.target.value
                                    )
                                  }
                                  size='small'
                                  required
                                />
                              )}
                            </Box>
                          )
                        })}
                    </FormGroup>

                    <Typography sx={{ mt: 2 }}>
                      Puntuación {category}: {formState.scores[category] || 0}{' '}
                      pts
                    </Typography>
                  </Paper>
                ))}

                {/* Resumen y botón de envío */}
                <Paper sx={{ p: 2, mt: 3 }}>
                  <Typography variant='h5'>
                    Puntuación Total: {formState.totalScore} pts
                  </Typography>
                  <Typography color='text.secondary' sx={{ mb: 2 }}>
                    {formState.totalScore >= 81
                      ? 'EXCELLENT'
                      : formState.totalScore >= 61
                        ? 'APPROVED'
                        : 'NO APROBADO'}
                  </Typography>

                  <Button
                    type='submit'
                    variant='contained'
                    size='large'
                    fullWidth
                    disabled={formState.totalScore < 0}
                  >
                    {formState.totalScore >= 0
                      ? 'Evaluar Proveedor'
                      : 'No Cumple Requisitos'}
                  </Button>
                </Paper>
              </>
            )}
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          type='submit'
          variant='contained'
          disabled={formState.totalScore < 0}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SupplierSelectionModal
