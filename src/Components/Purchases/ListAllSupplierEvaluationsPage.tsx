// src/pages/Evaluations/ListAllSupplierEvaluationsPage.tsx (o donde lo coloques)
import React, { useMemo, useState } from 'react'
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Button
} from '@mui/material'
import MaterialReactTable, {
  type MRT_ColumnDef,
  type MRT_Row
} from 'material-react-table'
import { useQuery, useQueryClient, useMutation } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private' // Ajusta la ruta
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { Edit, Add, Refresh, Close, PictureAsPdf } from '@mui/icons-material' // Importar iconos
import { useNavigate } from 'react-router-dom'

// Asume que ISupplier y SupplierEvaluationData están en un archivo de tipos compartido
// y SupplierEvaluationData es lo que devuelve el backend para CADA evaluación.
// Ajusta la ruta
import { Dialog, DialogTitle, DialogContent } from '@mui/material' // Para el modal de edición/creación
import { Supplier } from 'src/pages/Suppliers/SupplierDetailsPage'
import SupplierEvaluationForm, {
  SupplierEvaluationData
} from './SupplierEvaluationForm'
import Swal from 'sweetalert2'
import { isAxiosError } from 'axios'

// Interfaz para el objeto de evaluación como se espera de la API (con proveedor anidado)
interface EvaluationWithSupplier extends SupplierEvaluationData {
  supplier?: Pick<Supplier, 'id' | 'name' | 'taxId'>
  // Añade createdAt y updatedAt si vienen del backend y quieres mostrarlos
  createdAt?: string
  updatedAt?: string
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

  const handleViewReport = async (
    evaluationId: number | undefined,
    supplierName: string,
    evaluationDate: string
  ) => {
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
        Swal.fire(
          'Error',
          'El navegador bloqueó la apertura de una nueva pestaña. Revisa la configuración de pop-ups.',
          'warning'
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
      Swal.fire('Error', message, 'error')
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
    Swal.fire(
      'Info',
      "Selecciona un proveedor de la lista y usa la opción 'Evaluar Proveedor' en su página de detalles.",
      'info'
    )
  }

  const handleOpenEditModal = (evaluation: EvaluationWithSupplier) => {
    if (!evaluation.supplier) {
      Swal.fire(
        'Error',
        'Faltan datos del proveedor en esta evaluación para poder editarla.',
        'error'
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

  const handleFormSuccess = (savedEvaluation: SupplierEvaluationData) => {
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
      { accessorKey: 'id', header: 'ID Eval.', size: 80 },
      {
        accessorFn: (row) => row.supplier?.name || 'N/A',
        header: 'Proveedor',
        id: 'supplierName',
        size: 200
      },
      {
        accessorFn: (row) => row.supplier?.taxId || 'N/A',
        header: 'NIT/CC Prov.',
        id: 'supplierTaxId',
        size: 120
      },
      {
        accessorKey: 'evaluationDate',
        header: 'Fecha Eval.',
        size: 110,
        Cell: ({ cell }) =>
          new Date(cell.getValue<string>() + 'T00:00:00').toLocaleDateString() // Asegurar que se interprete como local
      },
      {
        accessorKey: 'totalScore',
        header: 'Total',
        size: 70,
        muiTableBodyCellProps: { align: 'center' }
      },
      {
        accessorKey: 'finalCondition',
        header: 'Condición',
        size: 180,
        Cell: ({ cell }) => {
          const condition = cell.getValue<string>()
          let color: 'success' | 'info' | 'warning' | 'error' | 'default' =
            'default'
          if (condition === 'EXCELENTE') color = 'success'
          else if (condition === 'BUENO') color = 'info'
          else if (condition === 'APROBADO CON RESERVA') color = 'warning'
          else if (condition === 'NO APROBADO') color = 'error'
          return (
            <Chip
              label={condition}
              color={color}
              size='small'
              sx={{
                textTransform: 'capitalize',
                minWidth: 130,
                textAlign: 'center'
              }}
            />
          )
        }
      },
      {
        accessorKey: 'qualityScore',
        header: 'Calidad',
        size: 70,
        muiTableBodyCellProps: { align: 'center' }
      },
      {
        accessorKey: 'deliveryScore',
        header: 'Entrega',
        size: 70,
        muiTableBodyCellProps: { align: 'center' }
      },
      {
        accessorKey: 'supportScore',
        header: 'Soporte',
        size: 70,
        muiTableBodyCellProps: { align: 'center' }
      },
      {
        accessorKey: 'warrantyScore',
        header: 'Garantía',
        size: 70,
        muiTableBodyCellProps: { align: 'center' }
      },
      {
        accessorKey: 'nonConformityScore',
        header: 'No Conf.',
        size: 70,
        muiTableBodyCellProps: { align: 'center' }
      },
      {
        accessorKey: 'invoiceScore',
        header: 'Facturas',
        size: 70,
        muiTableBodyCellProps: { align: 'center' }
      },
      {
        accessorKey: 'comments',
        header: 'Comentarios',
        size: 250,
        muiTableBodyCellProps: { sx: { fontSize: '0.75rem' } }
      },
      {
        accessorKey: 'createdAt',
        header: 'Creada',
        size: 130,
        Cell: ({ cell }) =>
          new Date(cell.getValue<string>()).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
      }
    ],
    []
  )

  return (
    <Container maxWidth='xl' sx={{ mt: 2, mb: 4 }}>
      <Typography variant='h4' gutterBottom component='h1'>
        Listado de Evaluaciones de Proveedores
      </Typography>

      <MaterialReactTable
        columns={columns}
        data={evaluations}
        enableRowActions // Habilitar acciones por fila
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Tooltip title='Editar Evaluación'>
              <IconButton
                onClick={() => handleOpenEditModal(row.original)}
                color='primary'
                size='small'
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title='Ver Reporte PDF'>
              <IconButton
                onClick={() =>
                  handleViewReport(
                    row.original.id,
                    row.original.supplier?.name || 'Proveedor',
                    row.original.evaluationDate
                  )
                }
                color='secondary'
                size='small'
              >
                <PictureAsPdf />
              </IconButton>
            </Tooltip>
            {/* <Tooltip title="Eliminar Evaluación"> // La eliminación es una acción destructiva, manejar con cuidado
              <IconButton onClick={() => { console.log("Eliminar", row.original.id) }} color="error" size="small">
                <Delete />
              </IconButton>
            </Tooltip> */}
          </Box>
        )}
        renderTopToolbarCustomActions={() => (
          <Box sx={{ display: 'flex', gap: '1rem', p: '4px' }}>
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleOpenCreateModal}
              color='primary'
            >
              Nueva Evaluación
            </Button>
            <Button
              variant='outlined'
              startIcon={<Refresh />}
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
            >
              Refrescar
            </Button>
          </Box>
        )}
        muiTableContainerProps={{ sx: { maxHeight: 'calc(100vh - 200px)' } }}
        muiToolbarAlertBannerProps={
          isError ? { color: 'error', children: error?.message } : undefined
        }
        initialState={{
          density: 'compact',
          pagination: { pageSize: 10, pageIndex: 0 },
          sorting: [{ id: 'evaluationDate', desc: true }], // Ordenar por fecha descendente por defecto
          columnVisibility: {
            // Ocultar algunas columnas por defecto para no saturar
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
        localization={MRT_Localization_ES}
        enableColumnResizing
        enableColumnOrdering
        enableGrouping
        enablePinning
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
