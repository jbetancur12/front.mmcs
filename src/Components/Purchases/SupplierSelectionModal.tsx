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
  Checkbox,
  IconButton
} from '@mui/material'

import { ChangeEvent, useEffect, useState } from 'react'
import withReactContent from 'sweetalert2-react-content'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  FormState,
  Criterion,
  SelectionSupplier
} from 'src/pages/Purchases/Types'
import Swal from 'sweetalert2'
import { isAxiosError } from 'axios'
import { Close } from '@mui/icons-material'

interface SupplierSelectionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  criteria: Criterion[]
  categories: string[]
  existingSelectionData?: SelectionSupplier | null
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
  product: '',
  purchaseType: 1,
  contactName: '',
  position: ''
}

const initialFormState: FormState = {
  supplierData: initialSupplierData,
  providerType: '', // 'Juridical' o 'Natural'
  selections: {},
  scores: {},
  totalScore: 0,
  whichAnswers: {}
}

const SupplierSelectionModal = ({
  open,
  onClose,
  onSuccess,
  criteria,
  categories,
  existingSelectionData
}: SupplierSelectionModalProps) => {
  const MySwal = withReactContent(Swal)
  const axiosPrivate = useAxiosPrivate()
  const [isSubmitting, setIsSubmitting] = useState(false) // Estado faltante
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (open) {
      if (existingSelectionData && existingSelectionData.supplier) {
        // --- MODO EDICIÓN ---
        const newSelections: Record<string, number[]> = {}
        const newScores: Record<string, number> = {}
        const newWhichAnswers: Record<string, string> = {}
        let newTotalScore = 0

        // Reconstruir selections, scores, y whichAnswers a partir de existingSelectionData.details
        // Asumiendo que existingSelectionData.details es Array<SelectionSupplierDetail>
        ;(existingSelectionData.details || []).forEach((detail: any) => {
          const criterion = criteria.find(
            (c) => c.id === detail.selectionSupplierSubItemId
          )
          if (criterion) {
            if (!newSelections[criterion.category]) {
              newSelections[criterion.category] = []
            }
            newSelections[criterion.category].push(criterion.id)

            if (detail.which) {
              newWhichAnswers[criterion.id] = detail.which
            }
            // Sumar al score de la categoría y al total
            newScores[criterion.category] =
              (newScores[criterion.category] || 0) + (criterion.baseScore || 0)
            newTotalScore += criterion.baseScore || 0
          }
        })

        setFormState({
          supplierData: {
            // Asegurar que todos los campos de initialSupplierData estén presentes
            name: existingSelectionData.supplier.name || '',
            taxId: existingSelectionData.supplier.taxId || '',
            phone: existingSelectionData.supplier.phone || '',
            mobile: existingSelectionData.supplier.mobile || '',
            email: existingSelectionData.supplier.email || '',
            address: existingSelectionData.supplier.address || '',
            city: existingSelectionData.supplier.city || '',
            accountType: existingSelectionData.supplier.accountType || '',
            accountNumber: existingSelectionData.supplier.accountNumber || '',
            bankName: existingSelectionData.supplier.bankName || '',
            product: existingSelectionData.product || '', // 'product' viene de SelectionSupplier
            purchaseType: existingSelectionData.supplier.purchaseType || 1,
            contactName: existingSelectionData.supplier.contactName || '',
            position: existingSelectionData.supplier.position || ''
          },
          providerType:
            existingSelectionData.supplier.typePerson === 1
              ? 'Natural'
              : 'Juridical',
          selections: newSelections,
          scores: newScores,
          totalScore: newTotalScore,
          whichAnswers: newWhichAnswers
        })
      } else {
        // --- MODO CREACIÓN ---
        setFormState(initialFormState)
      }
      setError('') // Limpiar errores al abrir/cambiar modo
    }
  }, [open, existingSelectionData, criteria])

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
    e: ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    // Ajustar tipo para Select
    const target = e.target as HTMLInputElement // Asumir HTMLInputElement para simplicidad o castear select
    setFormState((prev) => ({
      ...prev,
      supplierData: { ...prev.supplierData, [target.name]: target.value }
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
              : 'NOT APPROVED',
        id: existingSelectionData?.id
      },
      details
    }
    try {
      if (existingSelectionData?.id) {
        // --- MODO EDICIÓN: Llamar a PUT/PATCH ---
        await axiosPrivate.put(
          `/suppliers/selection-suppliers/${existingSelectionData.supplierId}`,
          payload
        ) // Ajusta el endpoint
        MySwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Selección de proveedor actualizada',
          showConfirmButton: false,
          timer: 3000
        })
      } else {
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
      }
      setFormState(initialFormState)
      onSuccess()
      onClose()
    } catch (error) {
      console.log(error)
      let message = 'Error guardando la información.'
      if (isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message
      }
      setError(message)
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
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {existingSelectionData
          ? 'Editar Selección/Evaluación de Proveedor'
          : 'Evaluar Nuevo Proveedor'}
        <IconButton aria-label='close' onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>
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
                            label='Compra Tipo'
                            name='purchaseType'
                            value={formState.supplierData.purchaseType}
                            onChange={handleSupplierInputChange}
                            select
                            required
                          >
                            <MenuItem value={1}>1</MenuItem>
                            <MenuItem value={2}>2</MenuItem>
                          </TextField>
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
                            select
                            required
                          >
                            <MenuItem value='Ahorros'>Ahorros</MenuItem>
                            <MenuItem value='Corriente'>Corriente</MenuItem>
                          </TextField>
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
                            label='Compra Tipo'
                            name='purchaseType'
                            value={formState.supplierData.purchaseType}
                            onChange={handleSupplierInputChange}
                            select
                            required
                          >
                            <MenuItem value={1}>1</MenuItem>
                            <MenuItem value={2}>2</MenuItem>
                          </TextField>
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
                            select
                            required
                          >
                            <MenuItem value='Ahorros'>Ahorros</MenuItem>
                            <MenuItem value='Corriente'>Corriente</MenuItem>
                          </TextField>
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
                </Paper>
              </>
            )}
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress size={24} />
          ) : existingSelectionData ? (
            'Guardar Cambios'
          ) : (
            'Evaluar y Guardar'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SupplierSelectionModal
