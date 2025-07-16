import { useState } from 'react'
import { Box, Paper } from '@mui/material'
import NonConformWorkReportTable from 'src/Components/NonConformWorkReport/NonConformWorkReportTable'
import NonConformWorkReportForm from 'src/Components/NonConformWorkReport/NonConformWorkReportForm'

const NonConformWorkReportPage = () => {
  const [mode, setMode] = useState<'table' | 'create' | 'edit'>('table')
  const [editData, setEditData] = useState<any>(null)

  const handleCreate = () => {
    setEditData(null)
    setMode('create')
  }

  const handleEdit = (row: any) => {
    setEditData(row)
    setMode('edit')
  }

  const handleView = (_row: any) => {
    // Aquí podrías mostrar un modal de detalle si lo deseas
    alert('View not implemented yet')
  }

  const handleSuccess = () => {
    setMode('table')
    setEditData(null)
  }

  const handleCancel = () => {
    setMode('table')
    setEditData(null)
  }

  return (
    <Box p={2}>
      <Paper sx={{ p: 2 }}>
        {mode === 'table' && (
          <NonConformWorkReportTable
            onCreate={handleCreate}
            onEdit={handleEdit}
            onView={handleView}
          />
        )}
        {(mode === 'create' || mode === 'edit') && (
          <NonConformWorkReportForm
            initialData={editData || {}}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}
      </Paper>
    </Box>
  )
}

export default NonConformWorkReportPage
