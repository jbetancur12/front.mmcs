import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../config'
import axios from 'axios'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { format } from 'date-fns'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { Visibility } from '@mui/icons-material'

const apiUrl = api()

export interface InspectionHistoryData {
  id: number
  equipmentName: string
  date: string
  brand: string
  serialNumber: string
  model: string
  serviceType: string
  internalCode: string
  activity: string
  comments: string
  verifiedBy: string
  equipmentId: number
}

const InspectionMaintenance: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tableData, setTableData] = useState<InspectionHistoryData | null>(null)

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
    navigate('/dataSheets/' + id + '/new-maintenance', {
      state: { tableData, type: 'maintenance', id: id }
    })
  }

  const handleAddCalibration = () => {
    // Lógica para agregar calibración
    navigate('/dataSheets/' + id + '/new-calibration', {
      state: { tableData, type: 'calibration', id: id }
    })
  }

  const ActionsButtons = ({ id }: { id: number }) => {
    return (
      <Stack direction='row' spacing={2} marginBottom={2}>
        <Tooltip arrow placement='right' title='Ver'>
          <Link to={`${id}`}>
            <IconButton>
              <Visibility />
            </IconButton>
          </Link>
        </Tooltip>
      </Stack>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          gap: '2rem',
          mb: 5,
          justifyContent: 'space-between'
        }}
      >
        <Stack direction='row' spacing={2} marginBottom={2}>
          <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
            <ArrowBackIcon />
          </IconButton>
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
      </Box>

      <Paper elevation={3} sx={{ p: 2, width: '100%', mb: 2 }}>
        {tableData && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography>
                <strong>Nombre:</strong> {tableData.equipmentName}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography>
                <strong>Marca:</strong> {tableData.serialNumber}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography>
                <strong>Marca:</strong> {tableData.brand}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography>
                <strong>Código Interno:</strong> {tableData.internalCode}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography>
                <strong>Modelo:</strong> {tableData.model}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography>
                <strong>Tipo de Servicio:</strong> {tableData.serviceType}
              </Typography>
            </Grid>
          </Grid>
        )}
      </Paper>

      <MaterialReactTable
        columns={columns}
        data={filteredTableData}
        localization={MRT_Localization_ES}
        enableColumnOrdering
        initialState={{
          columnVisibility: { id: false, equipmentId: false }
        }}
        enableEditing
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <ActionsButtons id={row.original.id} />
          </Box>
        )}
      />
    </Box>
  )
}

export default InspectionMaintenance
