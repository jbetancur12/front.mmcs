// src/pages/Evaluations/ListAllSupplierEvaluationsPage.tsx (o donde lo coloques)
import React, { useMemo, useState } from 'react'
import {
  Container,
  Grid,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button
} from '@mui/material'
import { type MRT_Cell, type MRT_ColumnDef } from 'material-react-table'
import { useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private' // Ajusta la ruta
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import {
  Edit,
  Add,
  Refresh,
  Close,
  PictureAsPdf,
  FactCheck,
  EmojiEvents,
  Star
} from '@mui/icons-material' // Importar iconos
import { useNavigate } from 'react-router-dom'

// Asume que ISupplier y SupplierEvaluationData están en un archivo de tipos compartido
// y SupplierEvaluationData es lo que devuelve el backend para CADA evaluación.
// Ajusta la ruta
import { Dialog, DialogTitle, DialogContent } from '@mui/material' // Para el modal de edición/creación
import { Supplier } from 'src/pages/Suppliers/SupplierDetailsPage'
import SupplierEvaluationForm, {
  SupplierEvaluationData
} from './SupplierEvaluationForm'
import { isAxiosError } from 'axios'
import { notify } from 'src/utils/notify'

// Interfaz para el objeto de evaluación como se espera de la API (con proveedor anidado)
interface EvaluationWithSupplier extends SupplierEvaluationData {
  supplier?: Pick<Supplier, 'id' | 'name' | 'taxId'>
  // Añade createdAt y updatedAt si vienen del backend y quieres mostrarlos
  createdAt?: string
  updatedAt?: string
}

// Puntajes: cifras cortas, centradas bajo su encabezado
const SCORE_CELL = {
  muiTableBodyCellProps: { align: 'center' as const },
  muiTableHeadCellProps: { align: 'center' as const }
}

const ListAllSupplierEvaluationsPage: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const navigate = useNavigate() // Si la creación/edición se hace en otra página

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<EvaluationWithSupplier | null>(null)
  // Estado para seleccionar proveedor al crear una nueva evaluación
  const [supplierForNewEvaluation, setSupplierForNewEvaluation] =
    useState<Supplier | null>(null)

  const {
    data: evaluations = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch // Para el botón de refrescar
  } = useQuery<EvaluationWithSupplier[], Error>(
    'allSupplierEvaluations',
    async () => {
      // Endpoint para listar TODAS las evaluaciones
      const response = await axiosPrivate.get<EvaluationWithSupplier[]>(
        '/supplier-evaluations'
      )
      return response.data
    }
  )

  const handleViewReport = async (evaluationId: number | undefined) => {
    try {
      // El endpoint debe estar configurado para devolver el PDF directamente
      const response = await axiosPrivate.get(
        `/reports/fog-mmcs-15/${evaluationId}`,
        {
          responseType: 'blob' // Importante para manejar la respuesta como archivo
        }
      )

      const file = new Blob([response.data], { type: 'application/pdf' })
      const fileURL = URL.createObjectURL(file)

      // Abrir PDF en nueva pestaña
      const pdfWindow = window.open(fileURL, '_blank')
      if (pdfWindow) {
        pdfWindow.focus()
        // Opcional: intentar nombrar la pestaña (puede no funcionar en todos los navegadores)
        // setTimeout(() => { try { pdfWindow.document.title = `Evaluacion_${supplierName}_${evaluationDate}`; } catch(e){} }, 500);
      } else {
        notify.warning(
          'Error',
          'El navegador bloqueó la apertura de una nueva pestaña. Revisa la configuración de pop-ups.'
        )
      }
      // No necesitas URL.revokeObjectURL(fileURL) inmediatamente si se abre en una nueva pestaña,
      // el navegador usualmente lo maneja al cerrar la pestaña.
    } catch (err) {
      console.error('Error al generar o mostrar el reporte PDF:', err)
      let message = 'No se pudo generar el reporte PDF.'
      if (isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message
      } else if (err instanceof Error) {
        message = err.message
      }
      notify.error('Error', message)
    }
  }

  const handleOpenCreateModal = () => {
    // Aquí necesitarías una forma de seleccionar para qué proveedor crear la evaluación.
    // Podrías abrir otro modal para seleccionar el proveedor, o navegar a una página.
    // Por simplicidad, asumiré que tienes un flujo para obtener `selectedSupplierObject`
    // Esto es un placeholder, necesitarás implementar la selección de proveedor.
    // const exampleSupplier: ISupplier = { id: 1, name: "Proveedor Ejemplo", taxId: "123", typePerson:0, contactName:"",email:"",phone:"", purchaseType: 1 };
    // if (exampleSupplier) {
    //   setSupplierForNewEvaluation(exampleSupplier);
    //   setSelectedEvaluation(null); // Asegurar que es modo creación
    //   setIsFormModalOpen(true);
    // } else {
    //   Swal.fire("Info", "Por favor, selecciona un proveedor para evaluar.", "info");
    // }
    navigate('/purchases/suppliers') // Navegar a la lista de proveedores para seleccionar uno y luego evaluar
    notify.info(
      'Info',
      "Selecciona un proveedor de la lista y usa la opción 'Evaluar Proveedor' en su página de detalles."
    )
  }

  const handleOpenEditModal = (evaluation: EvaluationWithSupplier) => {
    if (!evaluation.supplier) {
      notify.error(
        'Error',
        'Faltan datos del proveedor en esta evaluación para poder editarla.'
      )
      return
    }
    // Necesitamos el objeto Supplier completo para el formulario,
    // el 'evaluation.supplier' solo tiene Pick<>.
    // Idealmente, el SupplierEvaluationForm podría aceptar solo supplierId y cargar el supplier si es necesario,
    // o la lista de evaluaciones ya trae el objeto Supplier completo.
    // Asumamos que tenemos suficiente info en evaluation.supplier o que el form puede manejarlo.
    const minimalSupplierForForm: Supplier = {
      id: evaluation.supplier.id,
      name: evaluation.supplier.name,
      taxId: evaluation.supplier.taxId,
      // Rellenar otros campos de ISupplier con valores por defecto o de 'evaluation.supplier' si están disponibles
      typePerson: (evaluation.supplier as any).typePerson || 0,
      contactName: (evaluation.supplier as any).contactName || '',
      email: (evaluation.supplier as any).email || '',
      phone: (evaluation.supplier as any).phone || '',
      purchaseType: (evaluation.supplier as any).purchaseType || 1
    }

    setSelectedEvaluation(evaluation)
    setSupplierForNewEvaluation(minimalSupplierForForm) // Usamos el mismo estado para pasar el supplier al form
    setIsFormModalOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormModalOpen(false)
    setSelectedEvaluation(null)
    setSupplierForNewEvaluation(null)
    queryClient.invalidateQueries('allSupplierEvaluations')
    // El Swal de éxito ya se muestra dentro de SupplierEvaluationForm
  }

  const handleFormCancel = () => {
    setIsFormModalOpen(false)
    setSelectedEvaluation(null)
    setSupplierForNewEvaluation(null)
  }

  const columns = useMemo<MRT_ColumnDef<EvaluationWithSupplier>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', size: 60 },
      {
        accessorFn: (row) => row.supplier?.name || 'N/A',
        header: 'Proveedor',
        id: 'supplierName',
        size: 240,
        Cell: ({ cell }: { cell: MRT_Cell<EvaluationWithSupplier> }) => (
          <Typography variant='body2' fontWeight={600}>
            {cell.getValue<string>()}
          </Typography>
        )
      },
      {
        accessorFn: (row) => row.supplier?.taxId || 'N/A',
        header: 'NIT/CC',
        id: 'supplierTaxId',
        size: 130
      },
      {
        accessorKey: 'evaluationDate',
        header: 'Fecha de evaluación',
        size: 150,
        Cell: ({ cell }: { cell: MRT_Cell<EvaluationWithSupplier> }) => (
          <span style={{ whiteSpace: 'nowrap' }}>
            {new Date(cell.getValue<string>() + 'T00:00:00').toLocaleDateString(
              'es-CO',
              {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }
            )}
          </span>
        )
      },
      {
        accessorKey: 'finalCondition',
        header: 'Condición',
        size: 200,
        Cell: ({ cell }: { cell: MRT_Cell<EvaluationWithSupplier> }) => {
          const condition = cell.getValue<string>()
          let color: 'success' | 'info' | 'warning' | 'error' | 'default' =
            'default'
          if (condition === 'EXCELENTE') color = 'success'
          else if (condition === 'BUENO') color = 'info'
          else if (condition === 'APROBADO CON RESERVA') color = 'warning'
          else if (condition === 'NO APROBADO') color = 'error'
          const label = condition
            ? condition.charAt(0) + condition.slice(1).toLowerCase()
            : 'Sin condición'
          return (
            <Chip size='small' variant='outlined' color={color} label={label} />
          )
        }
      },
      { accessorKey: 'totalScore', header: 'Total', size: 80, ...SCORE_CELL },
      {
        accessorKey: 'qualityScore',
        header: 'Calidad',
        size: 90,
        ...SCORE_CELL
      },
      {
        accessorKey: 'deliveryScore',
        header: 'Entrega',
        size: 90,
        ...SCORE_CELL
      },
      {
        accessorKey: 'supportScore',
        header: 'Soporte',
        size: 90,
        ...SCORE_CELL
      },
      {
        accessorKey: 'warrantyScore',
        header: 'Garantía',
        size: 90,
        ...SCORE_CELL
      },
      {
        accessorKey: 'nonConformityScore',
        header: 'No conf.',
        size: 90,
        ...SCORE_CELL
      },
      {
        accessorKey: 'invoiceScore',
        header: 'Facturas',
        size: 90,
        ...SCORE_CELL
      },
      { accessorKey: 'comments', header: 'Comentarios', size: 280 },
      {
        accessorKey: 'createdAt',
        header: 'Creada',
        size: 130,
        Cell: ({ cell }: { cell: MRT_Cell<EvaluationWithSupplier> }) => (
          <span style={{ whiteSpace: 'nowrap' }}>
            {new Date(cell.getValue<string>()).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        )
      }
    ],
    []
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Evaluaciones de proveedores'
        subtitle='Historial de evaluaciones y su condición final'
        icon={<FactCheck />}
        actions={
          <>
            <Button
              variant='outlined'
              startIcon={<Refresh />}
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              sx={{
                color: '#00897B',
                borderColor: '#00BFA5',
                '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
              }}
            >
              Refrescar
            </Button>
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleOpenCreateModal}
              sx={{
                bgcolor: '#00BFA5',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#00ACC1' }
              }}
            >
              Nueva evaluación
            </Button>
          </>
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Evaluaciones'
            value={evaluations.length}
            icon={<FactCheck />}
            tone='teal'
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Condición excelente'
            value={
              evaluations.filter((e) =>
                String(e.finalCondition ?? '')
                  .toUpperCase()
                  .includes('EXCELENTE')
              ).length
            }
            icon={<EmojiEvents />}
            tone='green'
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Puntaje promedio'
            value={
              evaluations.length
                ? (
                    evaluations.reduce(
                      (acc, e) => acc + (Number(e.totalScore) || 0),
                      0
                    ) / evaluations.length
                  ).toFixed(1)
                : '0.0'
            }
            icon={<Star />}
            tone='blue'
          />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        data={evaluations}
        itemLabel={['evaluación', 'evaluaciones']}
        searchPlaceholder='Buscar evaluaciones'
        enableRowActions
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Tooltip title='Ver reporte PDF'>
              <IconButton
                onClick={() => handleViewReport(row.original.id)}
                aria-label={`Ver reporte PDF de la evaluación ${row.original.id}`}
                sx={{ color: '#00695C' }}
                size='small'
              >
                <PictureAsPdf />
              </IconButton>
            </Tooltip>
            <Tooltip title='Editar evaluación'>
              <IconButton
                onClick={() => handleOpenEditModal(row.original)}
                aria-label={`Editar la evaluación ${row.original.id}`}
                sx={{ color: '#2563eb' }}
                size='small'
              >
                <Edit />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        muiToolbarAlertBannerProps={
          isError ? { color: 'error', children: error?.message } : undefined
        }
        initialState={{
          density: 'compact',
          pagination: { pageSize: 10, pageIndex: 0 },
          sorting: [{ id: 'evaluationDate', desc: true }],
          columnVisibility: {
            // Ocultas por defecto para no saturar; se activan en "Columnas"
            qualityScore: false,
            deliveryScore: false,
            supportScore: false,
            warrantyScore: false,
            nonConformityScore: false,
            invoiceScore: false,
            createdAt: false
          }
        }}
        state={{ isLoading, showProgressBars: isFetching }}
      />

      {isFormModalOpen &&
        supplierForNewEvaluation && ( // Asegurar que supplierForNewEvaluation exista
          <Dialog
            open={isFormModalOpen}
            onClose={handleFormCancel}
            maxWidth='md'
            fullWidth
          >
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              {selectedEvaluation ? 'Editar Evaluación' : 'Nueva Evaluación'}{' '}
              de: {supplierForNewEvaluation.name}
              <IconButton onClick={handleFormCancel}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <SupplierEvaluationForm
                supplier={supplierForNewEvaluation} // Usar el supplier seleccionado para el formulario
                existingEvaluation={selectedEvaluation}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </DialogContent>
          </Dialog>
        )}
    </Container>
  )
}

export default ListAllSupplierEvaluationsPage
