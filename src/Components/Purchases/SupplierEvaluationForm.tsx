// src/components/Purchases/SupplierEvaluationForm.tsx (o ubicación similar)
import React, { useState, useEffect, FC, FormEvent } from 'react'
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material'
import { Save, Cancel } from '@mui/icons-material'
import { useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private' // Ajusta la ruta
import Swal from 'sweetalert2'
import { isAxiosError } from 'axios'

// Asumiendo que estos tipos están en 'src/pages/Purchases/Types'
import { Supplier as ISupplier } from 'src/pages/Purchases/Types'
import { Supplier } from 'src/pages/Suppliers/SupplierDetailsPage'

export interface SupplierEvaluationData {
  id?: number
  supplierId: number
  evaluationDate: string // Formato YYYY-MM-DD
  qualityScore: number
  deliveryScore: number
  supportScore: number
  warrantyScore: number
  nonConformityScore: number
  invoiceScore: number
  comments?: string
  documentReference?: string
  // Campos calculados (opcionalmente mostrados, no enviados directamente si el backend los calcula)
  totalScore?: number
  finalCondition?: string
  supplier?: Pick<ISupplier, 'id' | 'name' | 'taxId'> // Para mostrar info del proveedor
}

interface SupplierEvaluationFormProps {
  supplier: Supplier // Información del proveedor que se está evaluando
  existingEvaluation?: SupplierEvaluationData | null // Para modo edición
  onSuccess: (evaluation: SupplierEvaluationData) => void // Callback tras éxito
  onCancel: () => void
}

// Límites para los puntajes de los criterios
const SCORE_MIN = 0
const SCORE_MAX = 15 // Asumiendo que cada criterio es sobre 15 para un total de 90

const calculateFinalCondition = (totalScore: number): string => {
  if (totalScore >= 76 && totalScore <= 90) return 'EXCELENTE'
  if (totalScore >= 56 && totalScore <= 75) return 'BUENO'
  if (totalScore >= 36 && totalScore <= 55) return 'APROBADO CON RESERVA'
  if (totalScore >= 0 && totalScore <= 35) return 'NO APROBADO'
  return 'INDETERMINADO'
}

const SupplierEvaluationForm: FC<SupplierEvaluationFormProps> = ({
  supplier,
  existingEvaluation,
  onSuccess,
  onCancel
}) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<
    Omit<
      SupplierEvaluationData,
      | 'id'
      | 'supplierId'
      | 'totalScore'
      | 'finalCondition'
      | 'evaluator'
      | 'supplier'
    >
  >({
    evaluationDate:
      existingEvaluation?.evaluationDate ||
      new Date().toISOString().split('T')[0],
    qualityScore: existingEvaluation?.qualityScore || 0,
    deliveryScore: existingEvaluation?.deliveryScore || 0,
    supportScore: existingEvaluation?.supportScore || 0,
    warrantyScore: existingEvaluation?.warrantyScore || 0,
    nonConformityScore: existingEvaluation?.nonConformityScore || 0,
    invoiceScore: existingEvaluation?.invoiceScore || 0,
    comments: existingEvaluation?.comments || '',
    documentReference:
      existingEvaluation?.documentReference || 'FOGC-MMCS-15 V03'
  })

  const [calculatedTotal, setCalculatedTotal] = useState<number>(0)
  const [calculatedCondition, setCalculatedCondition] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (existingEvaluation) {
      setFormData({
        evaluationDate:
          existingEvaluation.evaluationDate ||
          new Date().toISOString().split('T')[0],
        qualityScore: existingEvaluation.qualityScore || 0,
        deliveryScore: existingEvaluation.deliveryScore || 0,
        supportScore: existingEvaluation.supportScore || 0,
        warrantyScore: existingEvaluation.warrantyScore || 0,
        nonConformityScore: existingEvaluation.nonConformityScore || 0,
        invoiceScore: existingEvaluation.invoiceScore || 0,
        comments: existingEvaluation.comments || '',
        documentReference:
          existingEvaluation.documentReference || 'FOGC-MMCS-15 V03'
      })
    }
  }, [existingEvaluation])

  useEffect(() => {
    const scores = [
      formData.qualityScore,
      formData.deliveryScore,
      formData.supportScore,
      formData.warrantyScore,
      formData.nonConformityScore,
      formData.invoiceScore
    ]
    const total = scores.reduce((sum, score) => sum + (Number(score) || 0), 0)
    setCalculatedTotal(total)
    setCalculatedCondition(calculateFinalCondition(total))
  }, [formData])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    let processedValue: string | number = value
    if (name.endsWith('Score')) {
      processedValue = parseInt(value, 10)
      if (isNaN(processedValue)) processedValue = 0 // Default to 0 if parse fails
      processedValue = Math.max(SCORE_MIN, Math.min(SCORE_MAX, processedValue)) // Clamp value
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.evaluationDate)
      newErrors.evaluationDate = 'La fecha es requerida.'

    const scoreFields: (keyof typeof formData)[] = [
      'qualityScore',
      'deliveryScore',
      'supportScore',
      'warrantyScore',
      'nonConformityScore',
      'invoiceScore'
    ]
    scoreFields.forEach((field) => {
      const value = Number(formData[field])
      if (isNaN(value) || value < SCORE_MIN || value > SCORE_MAX) {
        newErrors[field] =
          `Debe ser un número entre ${SCORE_MIN} y ${SCORE_MAX}.`
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const mutationFn = async (dataToSave: SupplierEvaluationData) => {
    if (existingEvaluation?.id) {
      // Update
      const { data } = await axiosPrivate.put(
        `/supplier-evaluations/${existingEvaluation.id}`,
        dataToSave
      )
      return data
    } else {
      // Create
      const { data } = await axiosPrivate.post(
        `/supplier-evaluations/${supplier.id}`,
        dataToSave
      )
      return data
    }
  }

  const {
    mutate,
    isLoading,
    error: mutationError
  } = useMutation<SupplierEvaluationData, Error, SupplierEvaluationData>(
    mutationFn,
    {
      onSuccess: (data) => {
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
        ]) // Para refrescar la lista de evaluaciones
        onSuccess(data) // Llama al callback onSuccess
      },
      onError: (err) => {
        console.error('Error guardando evaluación:', err)
        let message = `Error al ${existingEvaluation ? 'actualizar' : 'guardar'} la evaluación.`
        if (isAxiosError(err) && err.response?.data?.message) {
          message = err.response.data.message
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
    const dataToSubmit: SupplierEvaluationData = {
      ...formData,
      supplierId: supplier.id
      // totalScore y finalCondition serán calculados por el backend gracias al hook del modelo
    }
    mutate(dataToSubmit)
  }

  const criteria: {
    label: string
    name: keyof typeof formData
    score: number
  }[] = [
    {
      label: 'Calidad de los productos y / o servicios',
      name: 'qualityScore',
      score: formData.qualityScore
    },
    {
      label: 'Cumplimiento en la entrega',
      name: 'deliveryScore',
      score: formData.deliveryScore
    },
    {
      label: 'Soporte Técnico o asesoramiento',
      name: 'supportScore',
      score: formData.supportScore
    },
    {
      label: 'Garantía Ofrecida',
      name: 'warrantyScore',
      score: formData.warrantyScore
    },
    {
      label: 'No conformidades presentadas',
      name: 'nonConformityScore',
      score: formData.nonConformityScore
    },
    {
      label: 'Entrega de Facturas',
      name: 'invoiceScore',
      score: formData.invoiceScore
    }
  ]

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant='h5' gutterBottom component='div'>
        Evaluación para: <strong>{supplier.name}</strong> (NIT: {supplier.taxId}
        )
      </Typography>
      <Typography variant='subtitle2' gutterBottom>
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

          {criteria.map((criterion) => (
            <Grid item xs={12} sm={6} md={4} key={criterion.name}>
              <TextField
                label={criterion.label}
                name={criterion.name}
                type='number'
                value={criterion.score.toString()} // TextField value debe ser string
                onChange={handleChange}
                error={!!errors[criterion.name]}
                helperText={errors[criterion.name]}
                inputProps={{ min: SCORE_MIN, max: SCORE_MAX }}
                fullWidth
                required
              />
            </Grid>
          ))}

          <Grid item xs={12}>
            <TextField
              label='Comentarios Adicionales'
              name='comments'
              multiline
              rows={4}
              value={formData.comments}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant='body1'>Puntaje Total Obtenido:</Typography>
            <Typography variant='h6' color='primary'>
              {calculatedTotal} / 90
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant='body1'>Condición Final:</Typography>
            <Typography
              variant='h6'
              color={
                calculatedCondition === 'NO APROBADO' ? 'error' : 'primary'
              }
            >
              {calculatedCondition}
            </Typography>
          </Grid>

          {mutationError && (
            <Grid item xs={12}>
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
