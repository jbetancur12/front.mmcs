import { Add, Delete, Edit, WorkspacePremium } from '@mui/icons-material'
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  IconButton,
  Stack,
  TextField,
  Tooltip
} from '@mui/material'

import {
  MaterialReactTable,
  type MRT_Cell,
  type MRT_ColumnDef,
  type MRT_Row,
  type MaterialReactTableProps
} from 'material-react-table'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from 'react-query'
import toast from 'react-hot-toast'

import FormDialog from 'src/Components/Common/FormDialog'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { purchaseTableStyle } from 'src/Components/Purchases/purchaseTableStyle'
import {
  CERTIFICATE_TYPE_QUERY_KEYS,
  useCertificateTypes,
  useCreateCertificateType,
  useDeleteCertificateType,
  useUpdateCertificateType
} from '@hooks/certificates/useCertificateTypes'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

// Define interfaces
export interface CertificateTypeData {
  id: number
  name: string
}

// API URL

// Main component
const Table: React.FC = () => {
  const canManageCertificateTypes = useCan(
    PERMISSIONS.CALIBRATION_CERTIFICATE_TYPE_MANAGE
  )
  const queryClient = useQueryClient()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const { data: certificateTypesData } = useCertificateTypes()
  const tableData = useMemo<CertificateTypeData[]>(
    () => certificateTypesData ?? [],
    [certificateTypesData]
  )
  const createCertificateTypeMutation = useCreateCertificateType()
  const updateCertificateTypeMutation = useUpdateCertificateType()
  const deleteCertificateTypeMutation = useDeleteCertificateType()
  // const [filteredTableData, setFilteredTableData] = useState<CertificateTypeData[]>([]);

  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  // Create a new certificateType
  const onCreateCertificateType = async (
    certificateTypeData: CertificateTypeData
  ) => {
    try {
      const response = await createCertificateTypeMutation.mutateAsync({
        name: certificateTypeData.name
      })

      if (response.status === 201) {
        toast.success('Equipo Creado Exitosamente!', {
          duration: 4000,
          position: 'top-center'
        })
      } else {
        console.error('Error al crear tipo de certificado')
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  // const updateUser = async (certificateTypeData: CertificateTypeData) => {

  //   try {
  //     const response = await axiosPrivate.put(`/certificateTypes/${certificateTypeData.id}`, certificateTypeData, {
  //       headers: {
  //         'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
  //       },
  //     });

  //     if (response.status === 201) {
  //       toast.success('Equipo Modificado Exitosamente!', {
  //         duration: 4000,
  //         position: 'top-center',
  //       });
  //       ; // Refresh data after creation
  //     } else {
  //       console.error('Error al crear tipo de certificado');
  //     }
  //   } catch (error) {
  //     console.error('Error de red:', error);
  //   }
  // }

  const handleCreateNewRow = (values: CertificateTypeData) => {
    onCreateCertificateType(values)
    setCreateModalOpen(false)
  }

  const handleSaveRowEdits: MaterialReactTableProps<CertificateTypeData>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = { ...values }
        delete updatedValues.id
        try {
          const response = await updateCertificateTypeMutation.mutateAsync({
            id: values.id,
            payload: updatedValues
          })

          if (response.status === 201) {
            toast.success('Equipo Modificado Exitosamente!', {
              duration: 4000,
              position: 'top-center'
            })
            queryClient.setQueryData<CertificateTypeData[]>(
              CERTIFICATE_TYPE_QUERY_KEYS.list(),
              (prev = []) =>
                prev.map((item, index) => (index === row.index ? values : item))
            )
          } else {
            console.error('Error al crear tipo de certificado')
          }
        } catch (error) {
          console.error('Error de red:', error)
        }

        exitEditingMode() //required to exit editing mode and close modal
      }
    }

  const handleCancelRowEdits = () => {
    setValidationErrors({})
  }

  const removeRowFromCache = (id: number) => {
    queryClient.setQueryData<CertificateTypeData[]>(
      CERTIFICATE_TYPE_QUERY_KEYS.list(),
      (prev = []) => prev.filter((item) => item.id !== id)
    )
  }

  const deleteUser = async (id: number) => {
    try {
      const response = await deleteCertificateTypeMutation.mutateAsync(id)

      if (response.status === 201) {
        toast.success('Equipo Eliminado Exitosamente!', {
          duration: 4000,
          position: 'top-center'
        })
        removeRowFromCache(id)
      } else {
        console.error('Error al crear tipo de certificado')
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  const handleDeleteRow = useCallback(
    (row: MRT_Row<CertificateTypeData>) => {
      if (!confirm(`Are you sure you want to delete ${row.getValue('name')}`)) {
        return
      }
      deleteUser(row.getValue('id'))
      removeRowFromCache(row.getValue('id'))
    },
    [deleteUser]
  )

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<CertificateTypeData>
    ): MRT_ColumnDef<CertificateTypeData>['muiTableBodyCellEditTextFieldProps'] => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid =
            cell.column.id === 'email'
              ? validateEmail(event.target.value)
              : cell.column.id === 'age'
                ? validateAge(+event.target.value)
                : validateRequired(event.target.value)
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is required`
            })
          } else {
            //remove validation error for cell if valid
            delete validationErrors[cell.id]
            setValidationErrors({
              ...validationErrors
            })
          }
        }
      }
    },
    [validationErrors]
  )

  //should be memoized or stable
  const columns = useMemo<MRT_ColumnDef<CertificateTypeData>[]>(
    () => [
      {
        accessorKey: 'id', //access nested data with dot notation
        header: 'ID',
        size: 10,
        enableEditing: false
      },
      {
        accessorKey: 'name', //access nested data with dot notation
        header: 'Nombre',
        size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      }
    ],
    [getCommonEditTextFieldProps]
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Tipos de certificado'
        subtitle='Clasificación de los certificados que emite el laboratorio'
        icon={<WorkspacePremium />}
        actions={
          canManageCertificateTypes ? (
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={() => setCreateModalOpen(true)}
              sx={{
                bgcolor: '#00BFA5',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#00ACC1' }
              }}
            >
              Crear tipo de certificado
            </Button>
          ) : undefined
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            label='Tipos de certificado'
            value={tableData.length}
            icon={<WorkspacePremium />}
            tone='teal'
          />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <MaterialReactTable
          {...purchaseTableStyle}
          displayColumnDefOptions={{
            'mrt-row-actions': {
              muiTableHeadCellProps: {
                align: 'center'
              },
              size: 120
            }
          }}
          columns={columns}
          data={tableData}
          editingMode='modal' //default
          enableColumnOrdering
          enableEditing={canManageCertificateTypes}
          enableRowActions={canManageCertificateTypes}
          enablePinning
          initialState={{ columnPinning: { right: ['mrt-row-actions'] } }}
          onEditingRowSave={handleSaveRowEdits}
          onEditingRowCancel={handleCancelRowEdits}
          renderRowActions={({ row, table }) => (
            <Box sx={{ display: 'flex', gap: '1rem' }}>
              <Tooltip arrow placement='left' title='Edit'>
                <IconButton
                  color='primary'
                  onClick={() => table.setEditingRow(row)}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip arrow placement='right' title='Delete'>
                <IconButton color='error' onClick={() => handleDeleteRow(row)}>
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        />
      </Paper>
      <CreateNewAccountModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
    </Container>
  )
}

interface CreateModalProps {
  columns: MRT_ColumnDef<CertificateTypeData>[]
  onClose: () => void
  onSubmit: (values: CertificateTypeData) => void
  open: boolean
}

/** Crea un tipo de certificado nuevo. */
export const CreateNewAccountModal = ({
  open,
  columns,
  onClose,
  onSubmit
}: CreateModalProps) => {
  const [values, setValues] = useState<any>({})

  // Cada vez que se abre, el formulario empieza vacío
  useEffect(() => {
    if (open) setValues({})
  }, [open])

  const fields = columns.filter((column) => column.accessorKey !== 'id')
  const isIncomplete = fields.some(
    (column) => !String(values[column.accessorKey ?? ''] ?? '').trim()
  )

  const handleSubmit = () => {
    if (isIncomplete) return
    onSubmit(values)
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title='Crear tipo de certificado'
      subtitle='Clasifica los certificados que emite el laboratorio'
      submitLabel='Crear tipo de certificado'
      onSubmit={handleSubmit}
      submitDisabled={isIncomplete}
    >
      <Stack spacing={2}>
        {fields.map((column) => (
          <TextField
            key={column.accessorKey}
            label={column.header}
            name={column.accessorKey}
            required
            fullWidth
            value={values[column.accessorKey ?? ''] ?? ''}
            onChange={(e) =>
              setValues({ ...values, [e.target.name]: e.target.value })
            }
          />
        ))}
      </Stack>
    </FormDialog>
  )
}

const validateRequired = (value: string) => !!value.length
const validateEmail = (email: string) =>
  !!email.length &&
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
const validateAge = (age: number) => age >= 18 && age <= 50

export default Table
