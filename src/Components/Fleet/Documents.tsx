import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  Typography,
  CardActions,
  Grid,
  Divider
} from '@mui/material'
import { Delete, Download, Edit } from '@mui/icons-material'
import {
  fetchDocuments,
  addDocument,
  updateDocument,
  deleteDocument
} from './documentUtils'
import { Document } from './types'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'

const Documents: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const vehicleId = parseInt(id as string, 10)

  const { data: documents = [], refetch } = useQuery(
    ['documents', vehicleId],
    () => fetchDocuments(vehicleId)
  )

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  )
  const [documentTypeSelect, setDocumentTypeSelect] = useState<string>('SOAT')
  const [documentType, setDocumentType] = useState<string>('')
  const [documentExpirationDate, setDocumentExpirationDate] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [open, setOpen] = useState(false)

  const addOrUpdateDocument = useMutation(
    (doc: Document) =>
      doc.id ? updateDocument(doc) : addDocument(vehicleId, doc),
    {
      onSuccess: () => {
        refetch()
        setOpen(false)
      }
    }
  )

  const deleteDoc = useMutation(
    (docId: number) => deleteDocument(vehicleId, docId),
    {
      onSuccess: () => {
        refetch()
      }
    }
  )

  const handleOpen = (doc?: Document) => {
    if (doc) {
      setSelectedDocument(doc)
      setDocumentTypeSelect(doc.documentType)
      setDocumentType(doc.documentType === 'Other' ? doc.documentType : '')
      setDocumentExpirationDate(doc.expirationDate || '')
      setDocumentNumber(doc.documentNumber || '')
    } else {
      setSelectedDocument(null)
      setDocumentTypeSelect('SOAT')
      setDocumentType('')
      setDocumentExpirationDate('')
      setDocumentNumber('')
    }
    setOpen(true)
  }

  const handleClose = () => setOpen(false)

  const handleSave = () => {
    const doc: Document = {
      id: selectedDocument?.id,
      documentType:
        documentTypeSelect === 'Other' ? documentType : documentTypeSelect,
      expirationDate: documentExpirationDate,
      documentNumber: documentNumber
    }
    addOrUpdateDocument.mutate(doc)
  }

  return (
    <div>
      <Button variant='contained' onClick={() => handleOpen()}>
        Agregar Documento
      </Button>

      <Stack spacing={2} marginTop={2}>
        <Grid container spacing={2}>
          {documents.map((doc: Document) => (
            <Grid item xs={12} md={2}>
              <Card key={doc.id}>
                <CardContent>
                  <Typography variant='h6'>
                    {doc.documentType} - {doc.documentNumber}
                  </Typography>
                  <Typography color='textSecondary'>
                    Expira:{' '}
                    {doc.expirationDate
                      ? format(parseInt(doc.expirationDate), 'yyyy-MM-dd')
                      : 'No especificado'}
                  </Typography>
                </CardContent>
                <CardActions style={{ justifyContent: 'center' }}>
                  <Tooltip title='Descargar'>
                    <IconButton>
                      <Download />
                    </IconButton>
                  </Tooltip>
                  <Divider orientation='vertical' flexItem />
                  <Tooltip title='Editar'>
                    <IconButton onClick={() => handleOpen(doc)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Eliminar'>
                    <IconButton
                      color='error'
                      onClick={() => deleteDoc.mutate(doc.id!)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {selectedDocument ? 'Editar Documento' : 'Agregar Documento'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Select
              value={documentTypeSelect}
              onChange={(e) => {
                const value = e.target.value as string
                setDocumentTypeSelect(value)
                setDocumentType(value)
                if (value !== 'Other') setDocumentType('')
              }}
            >
              <MenuItem value='SOAT'>SOAT</MenuItem>
              <MenuItem value='RTM'>RTM</MenuItem>
              <MenuItem value='Seguro contra todo'>Seguro contra todo</MenuItem>
              <MenuItem value='Other'>Otro</MenuItem>
            </Select>
            {documentTypeSelect === 'Other' && (
              <TextField
                label='Otro Documento'
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              />
            )}
            <TextField
              label='Número de Documento'
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              InputLabelProps={{
                shrink: true
              }}
            />
            <TextField
              label='Fecha de Expiración'
              value={documentExpirationDate}
              type='date'
              onChange={(e) => setDocumentExpirationDate(e.target.value)}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant='contained' color='primary'>
            {selectedDocument ? 'Guardar Cambios' : 'Agregar Documento'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default Documents
