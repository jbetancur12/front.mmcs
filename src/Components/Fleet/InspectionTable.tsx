import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import MaterialReactTable, {
  MRT_ColumnDef,
  MRT_Row
} from 'material-react-table'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { api } from '../../config'
import { useNavigate, useParams } from 'react-router-dom'

import { InspectionHistory } from './types'
import { format } from 'date-fns'
import { CheckCircle, Error, Visibility, Warning } from '@mui/icons-material'

const apiUrl = api()

const fetchInspections = async (
  vehicleId: number
): Promise<InspectionHistory[]> => {
  const { data } = await axios.get(
    `${apiUrl}/vehicles/${vehicleId}/inspections`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    }
  )
  return data
}

const getConditionIcon = (condition: string) => {
  switch (condition) {
    case 'good':
      return <CheckCircle sx={{ color: 'green' }} />
    case 'fair':
      return <Warning sx={{ color: 'orange' }} />
    case 'poor':
    case 'low':
      return <Error sx={{ color: 'red' }} />
    default:
      return null
  }
}

const InspectionsTable = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [inspections, setInspections] = useState<InspectionHistory[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadInspections = async () => {
      try {
        if (id) {
          const data = await fetchInspections(Number(id))
          setInspections(data)
        }
      } catch (error) {
        console.error('Error fetching inspections:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInspections()
  }, [id])

  const columns = useMemo<MRT_ColumnDef<InspectionHistory>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', size: 50 },
      {
        accessorKey: 'inspectionType',
        header: 'Tipo de Inspección',
        size: 150
      },
      {
        accessorKey: 'inspectionDate',
        header: 'Fecha de Inspección',
        size: 150,
        Cell: ({ row }) =>
          format(new Date(row.getValue('inspectionDate')), 'yyyy-MM-dd')
      },
      {
        accessorKey: 'trip.purpose',
        header: 'Proposito del viaje',
        size: 150
      },
      {
        accessorKey: 'summary', // Este será el nuevo campo que resumirá el estado
        header: 'Estado General',
        size: 150,
        Cell: ({ row }) => {
          // Aquí defines cómo combinar los valores de las condiciones
          const {
            tireCondition,
            brakeCondition,
            fluidLevels,
            lightsCondition
          } = row.original

          // Combinar las condiciones en un solo estado
          const conditions = [
            tireCondition,
            brakeCondition,
            fluidLevels,
            lightsCondition
          ]
          const worstCondition = conditions.reduce((worst, condition) => {
            if (
              condition.toLocaleLowerCase() === 'poor' ||
              condition.toLocaleLowerCase() === 'low'
            )
              return 'poor'
            if (condition.toLocaleLowerCase() === 'fair')
              return worst === 'good' ? worst : 'fair'

            return worst
          }, 'good')

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              {getConditionIcon(worstCondition)}
            </Box>
          )
        }
      }
    ],
    []
  )

  const handleInpectionVisibility = async (inspection: InspectionHistory) => {
    navigate(`${inspection.id}`, { state: { inspection } })
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant='h4' gutterBottom>
        Reportes de Inspección
      </Typography>
      {loading ? (
        <Typography variant='body1'>Cargando...</Typography>
      ) : (
        <MaterialReactTable
          columns={columns}
          data={inspections}
          enableColumnOrdering
          enableSorting
          enablePagination={false}
          enableColumnFilters={false}
          enableEditing={true}
          initialState={{ columnVisibility: { id: false } }} // Oculta columnas no deseadas
          renderRowActions={({ row }) => (
            <Box sx={{ display: 'flex', gap: '1rem' }}>
              <Tooltip arrow placement='right' title='Ver'>
                <IconButton
                  onClick={() => handleInpectionVisibility(row.original)}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        />
      )}
    </Box>
  )
}

export default InspectionsTable
