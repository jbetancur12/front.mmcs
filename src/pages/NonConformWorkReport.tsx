import React, { useState } from 'react'
import { Container } from '@mui/material'
import NonConformWorkReportTable from 'src/Components/NonConformWorkReport/NonConformWorkReportTable'
import NonConformWorkReportForm from 'src/Components/NonConformWorkReport/NonConformWorkReportForm'
import { useNavigate } from 'react-router-dom'
import { NonConformWorkReport } from 'src/Components/NonConformWorkReport/NonConformWorkReport.types'

const NonConformWorkReportPage: React.FC = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'table' | 'create' | 'edit'>('table')
  const [editData, setEditData] = useState<NonConformWorkReport | null>(null)

  const handleCreate = () => {
    setEditData(null)
    setMode('create')
  }

  const handleEdit = (row: NonConformWorkReport) => {
    setEditData(row)
    setMode('edit')
  }

  const handleView = (_row: NonConformWorkReport) => {
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
        <NonConformWorkReportForm
          initialData={editData || {}}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </Container>
  )
}

export default NonConformWorkReportPage
