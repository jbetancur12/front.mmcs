import React, { useState } from 'react'
import { useQuery, useMutation } from 'react-query'
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
  Card,
  CardContent,
  Typography,
  CardActions,
  Grid,
  Divider,
  Box
} from '@mui/material'
import { ArrowBack, Delete, Download, Edit, Warning } from '@mui/icons-material'
import {
  fetchDocuments,
  addDocument,
  updateDocument,
  deleteDocument
} from './documentUtils'
import { Document, ReminderResponse } from './types'
import { useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'

const Documents: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const vehicleId = parseInt(id as string, 10)

  // Query para obtener documentos y recordatorios
  const {
    data: {
      documents = [],
      reminders = [],
      currentMileage = 0,
      vehicleData
    } = {},
    refetch
  } = useQuery(['documents', vehicleId], () => fetchDocuments(vehicleId))

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
      <IconButton onClick={() => navigate('/fleet')} sx={{ mr: 2 }}>
        <ArrowBack />
      </IconButton>
      <Button variant='contained' onClick={() => handleOpen()}>
        Agregar Documento
      </Button>

      <Box sx={{ p: 2 }}>
        <Typography variant='h5' sx={{ mb: 2 }}>
          Hoja de Vida del Vehiculo
        </Typography>
        {vehicleData && (
          <Card
            sx={{
              maxWidth: 345,
              mb: 2,
              textAlign: 'center',
              justifyContent: 'center'
            }}
          >
            <CardContent>
              <Typography variant='h6'>
                {vehicleData.make} - {vehicleData.model}
              </Typography>
              <Typography color='textSecondary'>
                Año: {vehicleData.year}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center' }}>
              <Button
                variant='contained'
                color='primary'
                onClick={() =>
                  navigate(`/fleet/${id}/data-sheet`, {
                    state: { vehicleData, documents }
                  })
                }
              >
                Descargar Hoja de Vida
              </Button>
            </CardActions>
          </Card>
        )}
      </Box>

      <Stack spacing={2} marginTop={2}>
        <Typography variant='h5'>Documentos</Typography>
        <Grid container spacing={2}>
          {documents.map((doc: Document) => (
            <Grid item xs={12} md={2} key={doc.id}>
              <Card>
                <CardContent>
                  <Typography variant='h6'>
                    {doc.documentType} - {doc.documentNumber}
                  </Typography>
                  <Typography color='textSecondary'>
                    Expira:{' '}
                    {doc.expirationDate
                      ? format(parseISO(doc.expirationDate), 'yyyy-MM-dd')
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

        <Typography variant='h5' marginTop={4}>
          Recordatorios Próximos
        </Typography>
        <Grid container spacing={2}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#506F69', // Verde brillante
              padding: '16px',
              borderRadius: '8px',
              margin: 'auto',
              boxShadow: '0px 4px 8px rgba(0,0,0,0.3)' // Sombra para un efecto retro
            }}
          >
            <Typography
              variant='h6'
              sx={{
                fontWeight: 'bold',
                fontFamily: 'Orbitron, monospace',
                textAlign: 'center',
                margin: 'auto',
                color: '#000000' // Color del texto, asegúrate de que contraste con el fondo
              }}
            >
              {currentMileage.toLocaleString('es-CO', {
                style: 'unit',
                unit: 'kilometer'
              })}
            </Typography>
            <Typography
              variant='h6'
              sx={{
                fontWeight: 'bold',
                fontFamily: 'Orbitron, monospace',
                textAlign: 'center',
                margin: 'auto',
                color: '#000000' // Color del texto
              }}
            >
              {new Date().toLocaleString('es-CO', {
                month: '2-digit',
                day: 'numeric',
                year: 'numeric'
              })}
            </Typography>
            {reminders.length > 0 && (
              <IconButton
                sx={{
                  color: '#FFC107' // Color del ícono, elige uno que contraste
                }}
              >
                <Warning />
              </IconButton>
            )}
          </Box>
          {reminders.map((reminder: ReminderResponse) => (
            <Grid item xs={12} md={12} key={reminder.id} padding={2}>
              <Card>
                <CardContent>
                  <Typography variant='h6'>
                    {reminder.interventionType.name}
                  </Typography>
                  <Typography color='textSecondary'>
                    Kilometros:{' '}
                    {reminder.dueMileage
                      ? reminder.dueMileage.toLocaleString('es-CO', {
                          style: 'unit',
                          unit: 'kilometer'
                        })
                      : 'No especificado'}
                  </Typography>
                  <Typography color='textSecondary'>
                    Fecha de vencimiento:{' '}
                    {reminder.dueDate
                      ? format(parseISO(reminder.dueDate), 'yyyy-MM-dd')
                      : 'No especificado'}
                  </Typography>
                </CardContent>
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
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label='Fecha de Expiración'
              value={documentExpirationDate}
              type='date'
              onChange={(e) => setDocumentExpirationDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
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
