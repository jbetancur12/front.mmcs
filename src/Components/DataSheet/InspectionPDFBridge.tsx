import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../config'
import InspectionMaintenancePDF from './InspectionMaintenancePDF'
import { Box, IconButton, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate } from 'react-router-dom'

const apiUrl = api()

const InspectionPDFBridge: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [activity, setActivity] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchReportHistory = async () => {
    try {
      const response = await axios.get(`${apiUrl}/calibrationHistory/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.statusText === 'OK') {
        setActivity(response.data.activity)
      }
    } catch (error) {
      console.error('Error fetching calibration history:', error)
    }
  }

  const fetchReport = async (activity: string) => {
    let path = `${apiUrl}/calibrationHistory/${id}`

    if (activity === 'Mantenimiento') {
      path = `${apiUrl}/inspectionMaintenance/${id}`
    }

    try {
      const response = await axios.get(path, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (response.statusText === 'OK') {
        setData(response.data)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    }
  }

  useEffect(() => {
    fetchReportHistory()
  }, [id])

  useEffect(() => {
    if (activity) {
      fetchReport(activity)
    }
  }, [activity])

  if (loading) return <div>Loading...</div>

  if (activity === 'Calibración') {
    return (
      <div>
        <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>

        <Box
          sx={{
            padding: 2,
            border: '2px solid green',
            borderRadius: 2,
            backgroundColor: '##e6ffe6',
            textAlign: 'center'
          }}
        >
          <Typography
            variant='h4'
            component='div'
            sx={{ fontWeight: 'bold', color: 'green' }}
          >
            Buscar certificado de calibración en las trazabilidades
          </Typography>
        </Box>
      </div>
    )
  }

  if (activity === 'Mantenimiento' && data) {
    return <InspectionMaintenancePDF data={data} />
  }

  return <div>Loading...</div>
}

export default InspectionPDFBridge
