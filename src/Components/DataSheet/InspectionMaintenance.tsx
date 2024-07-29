import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../config'
import axios from 'axios'
import { bigToast } from '../ExcelManipulation/Utils'

import * as yup from 'yup'
import { format } from 'date-fns'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { equal } from 'assert'

const apiUrl = api()

export interface InspectionHistoryData {
  id: number
  date: string
  internalCode: string
  activity: string
  comments: string
  verifiedBy: string
  equipmentId: number
}

const InspectionMaintenance: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tableData, setTableData] = useState<InspectionHistoryData[]>([])
  const [filteredTableData, setFilteredTableData] = useState<
    InspectionHistoryData[]
  >([])

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${apiUrl}/dataSheet/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.statusText === 'OK') {
        setTableData(response.data)
        setFilteredTableData(response.data.calibrationHistories)
      }
    } catch (error) {
      console.error('Error fetching dataSheet data:', error)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const columns = useMemo<MRT_ColumnDef<InspectionHistoryData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 10,
        enableEditing: false
      },
      {
        accessorKey: 'date',
        header: 'Fecha',
        size: 50,
        Cell: ({ row }) => {
          const date = new Date(row.original.date)
          return format(date, 'yyyy-MM-dd')
        }
      },
      {
        accessorKey: 'internalCode',
        header: 'Código interno',
        size: 150,
        enableEditing: false
      },
      {
        accessorKey: 'activity',
        header: 'Actividad',
        size: 150,
        enableEditing: false
      },
      {
        accessorKey: 'comments',
        header: 'Comentarios',
        size: 150,
        enableEditing: false
      },
      {
        accessorKey: 'verifiedBy',
        header: 'Verificador',
        size: 150,
        enableEditing: false
      },
      {
        accessorKey: 'equipmentId',
        header: 'Equipo',
        size: 150,
        enableEditing: false
      }
    ],
    []
  )

  const handleAddMaintenance = () => {
    // Lógica para agregar mantenimiento
    navigate('/new-maintenance', { state: { tableData, type: 'maintenance' } })
  }

  const handleAddCalibration = () => {
    // Lógica para agregar calibración
    bigToast('Agregar calibración no implementado aún.', 'error')
  }

  return (
    <Box>
      <Stack direction='row' spacing={2} marginBottom={2}>
        <Button
          variant='contained'
          color='primary'
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={handleAddMaintenance}
        >
          Agregar Mantenimiento
        </Button>
        <Button
          variant='contained'
          color='secondary'
          onClick={handleAddCalibration}
        >
          Agregar Calibración
        </Button>
      </Stack>
      <MaterialReactTable
        columns={columns}
        data={filteredTableData}
        localization={MRT_Localization_ES}
        enableColumnOrdering
        enableEditing
        initialState={{
          columnVisibility: { id: false, equipmentId: false }
        }}
      />
    </Box>
  )
}

export default InspectionMaintenance
