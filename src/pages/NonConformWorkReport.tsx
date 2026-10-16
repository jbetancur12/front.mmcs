import { useState } from 'react'
import { Container, Paper } from '@mui/material'
import NonConformWorkReportTable from 'src/Components/NonConformWorkReport/NonConformWorkReportTable'
import NonConformWorkReportForm from 'src/Components/NonConformWorkReport/NonConformWorkReportForm'
import { useNavigate } from 'react-router-dom'

const NonConformWorkReportPage = () => {
  const navigate = useNavigate()
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
    navigate(`/non-conform-work-reports/${_row.id}`)
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
    <Container maxWidth='xl' sx={{ py: 3 }}>
      {mode === 'table' && (
        <NonConformWorkReportTable
          onCreate={handleCreate}
          onEdit={handleEdit}
          onView={handleView}
        />
      )}
      {(mode === 'create' || mode === 'edit') && (
        <Paper sx={{ p: 2 }}>
          <NonConformWorkReportForm
            initialData={editData || {}}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Paper>
      )}
    </Container>
  )
}

export default NonConformWorkReportPage
