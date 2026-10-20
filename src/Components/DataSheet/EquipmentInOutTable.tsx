import { useMemo } from 'react'

import { useNavigate, useParams } from 'react-router-dom'

import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { Box, Grid, IconButton, Typography } from '@mui/material'
import { format } from 'date-fns'
import { ArrowBack } from '@mui/icons-material'
import { useEquipmentInOutReport } from '@hooks/dataSheets/useDataSheets'

interface EquipmentInOutRecord {
  id: number
  outReason: string
  outDate: string
  inDate: string
  visualOutInspection: string
  visualInInspection: string
  operationalOutTest: string
  operationalInTest: string
  observationsIn: string | null
  observationsOut: string | null
  registeredBy: string
  equipmentId: number
  createdAt: string
  updatedAt: string
}

const EquipmentInOutTable = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: inOutReport } = useEquipmentInOutReport<{
    equipmentName: string
    internalCode: string
    equipmentInOutRecords: EquipmentInOutRecord[]
  }>(id)
  const equipmentInfo = useMemo(
    () =>
      inOutReport
        ? {
            equipmentName: inOutReport.equipmentName,
            internalCode: inOutReport.internalCode
          }
        : null,
    [inOutReport]
  )
  const inOutData = useMemo(
    () => inOutReport?.equipmentInOutRecords ?? [],
    [inOutReport]
  )

  const columns = useMemo<MRT_ColumnDef<EquipmentInOutRecord>[]>(
    () => [
      {
        accessorFn: () => equipmentInfo?.equipmentName || '',
        id: 'equipmentName',
        header: 'Nombre del Equipo',
        size: 150
      },
      {
        accessorFn: () => equipmentInfo?.internalCode || '',
        id: 'internalCode',
        header: 'Código Interno',
        size: 150
      },
      {
        accessorKey: 'outReason',
        header: 'Motivo de Salida',
        size: 150
      },
      {
        accessorKey: 'outDate',
        header: 'Fecha de Salida',
        size: 150,
        Cell: ({ row }) => {
          const date = new Date(row.getValue('outDate'))
          return format(date, 'yyyy-MM-dd')
        }
      },
      {
        accessorKey: 'inDate',
        header: 'Fecha de Entrada',
        size: 150,
        Cell: ({ row }) => {
          const date = new Date(row.getValue('inDate'))
          return format(date, 'yyyy-MM-dd')
        }
      },
      {
        accessorKey: 'visualOutInspection',
        header: 'Inspección Visual Salida',
        size: 150
      },
      {
        accessorKey: 'visualInInspection',
        header: 'Inspección Visual Entrada',
        size: 150
      },
      {
        accessorKey: 'operationalOutTest',
        header: 'Prueba Operacional Salida',
        size: 150
      },
      {
        accessorKey: 'operationalInTest',
        header: 'Prueba Operacional Entrada',
        size: 150
      },
      {
        accessorKey: 'observationsOut',
        header: 'Observaciones Salida',
        size: 150
      },
      {
        accessorKey: 'observationsIn',
        header: 'Observaciones Entrada',
        size: 150
      },
      {
        accessorKey: 'registeredBy',
        header: 'Registrado Por',
        size: 150
      }
    ],
    [equipmentInfo]
  )

  return (
    <>
      <IconButton
        onClick={() => navigate(`/datasheets/${id}/in-out`)}
        sx={{ mb: 2 }}
      >
        <ArrowBack />
      </IconButton>
      <MaterialReactTable
        columns={columns}
        data={inOutData}
        localization={MRT_Localization_ES}
        enableColumnOrdering
        initialState={{
          columnVisibility: {
            observationsOut: false,
            observationsIn: false
          }
        }}
        renderDetailPanel={({ row }) => {
          const observationsOut = row.getValue<string>('observationsOut') || ''
          const observationsIn = row.getValue<string>('observationsIn') || ''

          return (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  {observationsOut.length > 0 && (
                    <>
                      <Typography variant='h6'>
                        Observaciones de Salida
                      </Typography>
                      <div>{observationsOut}</div>
                    </>
                  )}
                  {observationsIn.length > 0 && (
                    <>
                      <Typography variant='h6'>
                        Observaciones de Entrada
                      </Typography>
                      <div>{observationsIn}</div>
                    </>
                  )}
                </Grid>
              </Grid>
            </Box>
          )
        }}
      />
    </>
  )
}

export default EquipmentInOutTable
