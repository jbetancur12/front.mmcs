// src/components/Purchases/SupplierEvaluationForm.tsx

import { useState, useEffect, FC, FormEvent, ChangeEvent } from 'react'
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  MenuItem
} from '@mui/material'
import { Save, Cancel } from '@mui/icons-material'
import { useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private' // Ajusta la ruta
import Swal from 'sweetalert2'
import { isAxiosError } from 'axios' // Importar AxiosResponse
import { SelectChangeEvent } from '@mui/material/Select'

// Asumiendo que estos tipos están en 'src/pages/Purchases/Types'
// o en un archivo central de tipos.
interface ISupplier {
  id: number
  name: string
  taxId: string
  // Otros campos de ISupplier que puedas necesitar
}

export interface SupplierEvaluationData {
  id?: number // Opcional, solo presente si se edita una evaluación existente
  supplierId: number // Se asigna desde la prop 'supplier'
  evaluationDate: string // Formato YYYY-MM-DD
  qualityScore: number
  deliveryScore: number
  supportScore: number
  warrantyScore: number
  nonConformityScore: number
  invoiceScore: number
  comments?: string
  documentReference?: string
  preparedBy?: string
  approvedBy?: string
  totalScore?: number // Calculado en UI para feedback, y en backend para persistencia
  finalCondition?: string // Calculado en UI para feedback, y en backend para persistencia
  supplier?: Pick<ISupplier, 'id' | 'name' | 'taxId'> // Para mostrar info del proveedor si la data viene así
}

interface SupplierEvaluationFormProps {
  supplier: ISupplier // Información del proveedor que se está evaluando
  existingEvaluation?: SupplierEvaluationData | null // Para modo edición
  onSuccess: (evaluation: SupplierEvaluationData) => void // Callback tras éxito
  onCancel: () => void
}

// Límites y opciones para los puntajes de los criterios
const SCORE_MIN = 0
const SCORE_MAX = 15 // El puntaje máximo para "Excelente"

const scoreOptions = [
  // Es importante que el valor por defecto (0) tenga una opción visible si quieres que el Select muestre algo.
  { value: 0, label: 'No Calificado / No Aplica (0 pts)' },
  { value: 2, label: 'Regular (2 pts)' },
  { value: 10, label: 'Bueno (10 pts)' },
  { value: 15, label: 'Excelente (15 pts)' }
]

const evaluatorOptions = [
  { value: 'Jessica Cardona Garcia', label: 'Jessica Cardona Garcia' },
  { value: 'Daniel Alberto Paredes', label: 'Daniel Alberto Paredes' }
]

const approverOptions = [
  {
    value: 'Andres Felipe Bernal Meneses',
    label: 'Andres Felipe Bernal Meneses'
  }
]

// Función para calcular la condición final basada en el puntaje total
const calculateFinalCondition = (totalScore: number): string => {
  if (totalScore >= 76 && totalScore <= 90) return 'EXCELENTE'
  if (totalScore >= 56 && totalScore <= 75) return 'BUENO'
  if (totalScore >= 36 && totalScore <= 55) return 'APROBADO CON RESERVA'
  if (totalScore >= 0 && totalScore <= 35) return 'NO APROBADO'
  return 'INDETERMINADO' // Para puntajes fuera de rango o inicial
}

// Tipo para las claves de los campos de puntaje en formData
type ScoreFieldName =
  | 'qualityScore'
  | 'deliveryScore'
  | 'supportScore'
  | 'warrantyScore'
  | 'nonConformityScore'
  | 'invoiceScore'

// Tipo para la parte del estado formData que maneja este formulario
type EvaluationFormData = Omit<
  SupplierEvaluationData,
  'id' | 'supplierId' | 'totalScore' | 'finalCondition' | 'supplier'
>

const SupplierEvaluationForm: FC<SupplierEvaluationFormProps> = ({
  supplier,
  existingEvaluation,
  onSuccess,
  onCancel
}) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  const initialFormData: EvaluationFormData = {
    evaluationDate: new Date().toISOString().split('T')[0],
    qualityScore: 0, // Default a 0 para 'No Calificado'
    deliveryScore: 0,
    supportScore: 0,
    warrantyScore: 0,
    nonConformityScore: 0,
    invoiceScore: 0,
    comments: '',
    documentReference: 'FOGC-MMCS-15 V03', // Default del formato
    preparedBy: 'Jessica Cardona Garcia',
    approvedBy: 'Andres Felipe Bernal Meneses'
  }

  const [formData, setFormData] = useState<EvaluationFormData>(initialFormData)
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0)
  const [calculatedCondition, setCalculatedCondition] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (existingEvaluation) {
      setFormData({
        evaluationDate:
          existingEvaluation.evaluationDate ||
          new Date().toISOString().split('T')[0],
        qualityScore: existingEvaluation.qualityScore ?? 0,
        deliveryScore: existingEvaluation.deliveryScore ?? 0,
        supportScore: existingEvaluation.supportScore ?? 0,
        warrantyScore: existingEvaluation.warrantyScore ?? 0,
        nonConformityScore: existingEvaluation.nonConformityScore ?? 0,
        invoiceScore: existingEvaluation.invoiceScore ?? 0,
        comments: existingEvaluation.comments || '',
        documentReference:
          existingEvaluation.documentReference || 'FOGC-MMCS-15 V03',
        preparedBy: existingEvaluation.preparedBy || 'Jessica Cardona Garcia',
        approvedBy:
          existingEvaluation.approvedBy || 'Andres Felipe Bernal Meneses'
      })
    } else {
      // Resetear a valores por defecto si no hay existingEvaluation (ej. al cambiar de editar a crear, o al abrir para crear)
      setFormData(initialFormData)
    }
  }, [existingEvaluation]) // Dependencia clave

  useEffect(() => {
    const scores: number[] = [
      Number(formData.qualityScore),
      Number(formData.deliveryScore),
      Number(formData.supportScore),
      Number(formData.warrantyScore),
      Number(formData.nonConformityScore),
      Number(formData.invoiceScore)
    ]
    const total = scores.reduce((sum, score) => sum + (score || 0), 0)
    setCalculatedTotal(total)
    setCalculatedCondition(calculateFinalCondition(total))
  }, [formData])

  const handleChange = (
    event:
      | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<number> // Acepta ambos tipos de evento
  ) => {
    const { name, value } = event.target
    let processedValue: string | number = value

    // Para los campos de puntaje, el valor del Select ya es el número (o un string que representa el número)
    if (name.endsWith('Score')) {
      processedValue = Number(value) // Convertir a número. Si es "" del Select, será 0.
      if (isNaN(processedValue)) processedValue = 0 // Fallback si no es un número
      // El clamping no es estrictamente necesario si las opciones del Select son la única fuente,
      // pero lo mantenemos por si acaso.
      processedValue = Math.max(SCORE_MIN, Math.min(SCORE_MAX, processedValue))
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.evaluationDate) {
      newErrors.evaluationDate = 'La fecha es requerida.'
    }

    const scoreFields: ScoreFieldName[] = [
      'qualityScore',
      'deliveryScore',
      'supportScore',
      'warrantyScore',
      'nonConformityScore',
      'invoiceScore'
    ]

    scoreFields.forEach((field) => {
      const value = formData[field] // Ya es un número en formData
      if (
        typeof value !== 'number' ||
        !scoreOptions.some((opt) => opt.value === value)
      ) {
        newErrors[field] = `Seleccione una calificación válida.`
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const mutationFn = async (dataToSubmitForBackend: EvaluationFormData) => {
    // El backend espera supplierId y los scores numéricos.
    // totalScore y finalCondition se calculan en backend por el hook del modelo.
    const payload: Omit<
      SupplierEvaluationData,
      'id' | 'totalScore' | 'finalCondition' | 'supplier'
    > = {
      ...dataToSubmitForBackend,
      supplierId: supplier.id
    }

    if (existingEvaluation?.id) {
      const { data } = await axiosPrivate.put<SupplierEvaluationData>(
        `/supplier-evaluations/${existingEvaluation.id}`,
        payload
      )
      return data
    } else {
      const { data } = await axiosPrivate.post<SupplierEvaluationData>(
        `/supplier-evaluations/${supplier.id}`,
        payload
      )
      return data
    }
  }

  const {
    mutate,
    isLoading,
    error: mutationError
  } = useMutation<SupplierEvaluationData, Error, EvaluationFormData>(
    mutationFn,
    {
      onSuccess: (responseData) => {
        // responseData es SupplierEvaluationData devuelta por el backend
        Swal.fire({
          title: 'Éxito',
          text: `Evaluación ${existingEvaluation ? 'actualizada' : 'guardada'} correctamente.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
        queryClient.invalidateQueries([
          'supplierEvaluations',
          supplier.id.toString()
        ])
        queryClient.invalidateQueries('allSupplierEvaluations') // Si tienes una lista global de evaluaciones
        onSuccess(responseData) // Pasar la data completa recibida del backend
      },
      onError: (err) => {
        console.error('Error guardando evaluación:', err)
        let message = `Error al ${existingEvaluation ? 'actualizar' : 'guardar'} la evaluación.`
        if (isAxiosError(err) && err.response?.data?.message) {
          message =
            typeof err.response.data.message === 'string'
              ? err.response.data.message
              : JSON.stringify(err.response.data.message)
        } else if (err instanceof Error) {
          message = err.message
        }
        Swal.fire('Error', message, 'error')
      }
    }
  )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!validateForm()) {
      Swal.fire(
        'Atención',
        'Por favor corrige los errores en el formulario.',
        'warning'
      )
      return
    }
    mutate(formData) // formData ya tiene la estructura correcta Omit<...>
  }

  // Definición de criterios para el renderizado del formulario
  const criteria: { label: string; name: ScoreFieldName }[] = [
    { label: 'Calidad de los productos y / o servicios', name: 'qualityScore' },
    { label: 'Cumplimiento en la entrega', name: 'deliveryScore' },
    { label: 'Soporte Técnico o asesoramiento', name: 'supportScore' },
    { label: 'Garantía Ofrecida', name: 'warrantyScore' },
    { label: 'No conformidades presentadas', name: 'nonConformityScore' },
    { label: 'Entrega de Facturas', name: 'invoiceScore' }
  ]

  return (
    // Si este Paper está dentro de un DialogContent con dividers, la elevación puede ser 0 o baja.
    <Paper elevation={0} sx={{ p: { xs: 0, sm: 1, md: 2 } }}>
      <Typography variant='h6' gutterBottom component='div'>
        {' '}
        {/* Cambiado a h6 si está en un Dialog */}
        Evaluación para Proveedor: <strong>{supplier.name}</strong> (NIT:{' '}
        {supplier.taxId})
      </Typography>
      <Typography
        variant='body2'
        color='text.secondary'
        gutterBottom
        sx={{ mb: 2 }}
      >
        Referencia Documento: {formData.documentReference}
      </Typography>
      <Box component='form' onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label='Fecha de Evaluación'
              name='evaluationDate'
              type='date'
              value={formData.evaluationDate}
              onChange={handleChange}
              error={!!errors.evaluationDate}
              helperText={errors.evaluationDate}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
          </Grid>

          {/* --- Renderizado de Criterios con Select --- */}
          {criteria.map((criterion) => (
            <Grid item xs={12} sm={6} md={4} key={criterion.name}>
              <TextField
                select
                fullWidth
                required
                label={criterion.label}
                name={criterion.name}
                value={formData[criterion.name]} // El valor es un número (0, 2, 10, 15)
                onChange={handleChange as any} // Cast a 'any' para simplificar el tipo de evento del Select
                error={!!errors[criterion.name]}
                helperText={errors[criterion.name]}
                // SelectProps={{ displayEmpty: true }} // Si quieres un placeholder visible
              >
                {/* <MenuItem value="" disabled><em>-- Calificar --</em></MenuItem> */}
                {scoreOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          ))}

          <Grid item xs={12} sx={{ mt: 1 }}>
            {' '}
            {/* Añadido margen superior */}
            <TextField
              label='Comentarios Adicionales'
              name='comments'
              multiline
              rows={3}
              value={formData.comments}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              label='Evaluado por (Elaboró)'
              name='preparedBy'
              value={formData.preparedBy}
              onChange={handleChange as any}
              fullWidth
              required
            >
              {evaluatorOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              label='Aprobado por'
              name='approvedBy'
              value={formData.approvedBy}
              onChange={handleChange as any}
              fullWidth
              required
            >
              {evaluatorOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sx={{ mt: 1 }}>
            <Box
              display='flex'
              flexDirection={{ xs: 'column', md: 'row' }}
              gap={4}
              alignItems='center'
            >
              <Box>
                <Typography variant='body1' component='div' fontWeight='medium'>
                  Puntaje Total Obtenido:
                </Typography>
                <Typography variant='h5' color='primary.main' fontWeight='bold'>
                  {calculatedTotal} / 90
                </Typography>
              </Box>

              <Box>
                <Typography variant='body1' component='div' fontWeight='medium'>
                  Condición Final:
                </Typography>
                <Typography
                  variant='h5'
                  fontWeight='bold' // @ts-ignore
                  color={
                    calculatedCondition === 'NO APROBADO' ||
                    calculatedCondition === 'INDETERMINADO'
                      ? 'error.main'
                      : calculatedCondition === 'EXCELENTE' ||
                          calculatedCondition === 'BUENO'
                        ? 'success.main'
                        : 'warning.main'
                  }
                >
                  {calculatedCondition}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {mutationError && (
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Alert severity='error'>
                Error al guardar: {(mutationError as Error).message}
              </Alert>
            </Grid>
          )}

          <Grid
            item
            xs={12}
            sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}
          >
            <Button
              onClick={onCancel}
              startIcon={<Cancel />}
              color='inherit'
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type='submit'
              variant='contained'
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color='inherit' />
                ) : (
                  <Save />
                )
              }
              disabled={isLoading}
            >
              {isLoading
                ? existingEvaluation
                  ? 'Actualizando...'
                  : 'Guardando...'
                : existingEvaluation
                  ? 'Actualizar Evaluación'
                  : 'Guardar Evaluación'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  )
}

export default SupplierEvaluationForm
