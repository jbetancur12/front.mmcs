import { useState } from 'react'
import * as XLSX from 'xlsx'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Typography
} from '@mui/material'
import { Download, UploadFile } from '@mui/icons-material'
import { techErrorMessage, useImportEquipment } from '@hooks/useTechManagement'
import { EquipmentPayload } from 'src/types/techManagement'
import { notifyError, notifySuccess, primaryButtonSx } from './techUi'

// Columnas de la plantilla y sinónimos aceptados (sin tildes ni mayúsculas).
const COLUMNS: { field: keyof EquipmentPayload; header: string; aliases: string[] }[] = [
  { field: 'name', header: 'Nombre del equipo', aliases: ['nombre', 'equipo', 'nombre del equipo', 'descripcion'] },
  { field: 'brand', header: 'Marca', aliases: ['marca'] },
  { field: 'model', header: 'Modelo', aliases: ['modelo'] },
  { field: 'serie', header: 'Serie', aliases: ['serie', 'serial', 'numero de serie'] },
  { field: 'activoFijo', header: 'Activo fijo', aliases: ['activo fijo', 'activo', 'placa', 'inventario'] },
  { field: 'city', header: 'Ciudad', aliases: ['ciudad'] },
  { field: 'sede', header: 'Sede', aliases: ['sede'] },
  { field: 'service', header: 'Servicio', aliases: ['servicio', 'area'] },
  { field: 'location', header: 'Ubicación', aliases: ['ubicacion'] },
  { field: 'riskClass', header: 'Clase de riesgo', aliases: ['clase de riesgo', 'riesgo', 'clasificacion'] },
  { field: 'invimaRegistry', header: 'Registro sanitario', aliases: ['registro sanitario', 'registro invima', 'invima'] },
  { field: 'lot', header: 'Lote', aliases: ['lote'] },
  { field: 'manufacturer', header: 'Fabricante', aliases: ['fabricante'] },
  { field: 'responsibleProvider', header: 'Proveedor responsable', aliases: ['proveedor', 'proveedor responsable'] },
  {
    field: 'calibrationPeriodMonths',
    header: 'Calibración cada (meses)',
    aliases: ['calibracion cada (meses)', 'periodicidad calibracion', 'calibracion (meses)']
  },
  {
    field: 'maintenancePeriodMonths',
    header: 'Preventivo cada (meses)',
    aliases: ['preventivo cada (meses)', 'periodicidad mantenimiento', 'mantenimiento (meses)']
  },
  { field: 'notes', header: 'Observaciones', aliases: ['observaciones', 'notas'] }
]

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const fieldFor = (header: string) => {
  const key = normalize(header)
  return COLUMNS.find((column) => column.aliases.includes(key) || normalize(column.header) === key)?.field
}

const downloadTemplate = () => {
  const sheet = XLSX.utils.aoa_to_sheet([
    COLUMNS.map((column) => column.header),
    ['Monitor de signos vitales', 'Philips', 'MX450', 'SN-001', 'AF-123', 'Pereira', 'Sede principal', 'UCI', 'Cama 3', 'IIB', 'INVIMA 2019DM-0001234', '', 'Philips', 'Metromedics', 12, 6, '']
  ])
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Inventario')
  XLSX.writeFile(book, 'plantilla_inventario_equipos.xlsx')
}

interface Props {
  customerId: string
  open: boolean
  onClose: () => void
}

/**
 * Importación del inventario desde Excel. El archivo se lee en el navegador y se envían las filas; una fila con la misma
 * serie/activo fijo que un equipo existente lo actualiza.
 */
const ImportEquipmentDialog = ({ customerId, open, onClose }: Props) => {
  const [rows, setRows] = useState<EquipmentPayload[]>([])
  const [fileName, setFileName] = useState('')
  const [ignored, setIgnored] = useState<string[]>([])
  const [result, setResult] = useState<{ created: number; updated: number; errors: { row: number; message: string }[] } | null>(null)
  const importer = useImportEquipment(customerId)

  const reset = () => {
    setRows([])
    setFileName('')
    setIgnored([])
    setResult(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = async (file?: File) => {
    if (!file) return
    reset()
    setFileName(file.name)
    const book = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets[book.SheetNames[0]], { defval: '' })
    const unknown = new Set<string>()
    const parsed = raw
      .map((record) => {
        const row: Record<string, unknown> = {}
        Object.entries(record).forEach(([header, value]) => {
          const field = fieldFor(header)
          if (!field) {
            unknown.add(header)
            return
          }
          const text = String(value ?? '').trim()
          if (text === '') return
          row[field] = field.endsWith('PeriodMonths') ? Number(text) : text
        })
        return row as EquipmentPayload
      })
      .filter((row) => Object.keys(row).length > 0)
    setRows(parsed)
    setIgnored([...unknown].filter((header) => !header.startsWith('__EMPTY')))
  }

  const handleImport = async () => {
    try {
      const response = await importer.mutateAsync(rows)
      setResult(response)
      notifySuccess(`${response.created} equipos creados y ${response.updated} actualizados`)
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo importar el inventario'))
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle
        sx={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', textAlign: 'center', fontWeight: 700 }}
      >
        Importar inventario desde Excel
      </DialogTitle>
      <DialogContent sx={{ pt: '24px !important' }}>
        <Typography variant='body2' color='text.secondary' mb={2}>
          Usa la plantilla o un Excel con encabezados como Nombre, Marca, Modelo, Serie, Activo fijo, Sede, Servicio, Clase
          de riesgo y Registro sanitario. Si la serie o el activo fijo coinciden con un equipo ya cargado, se actualiza.
        </Typography>
        <Box display='flex' gap={1.5} flexWrap='wrap' mb={2}>
          <Button startIcon={<Download />} onClick={downloadTemplate} sx={{ textTransform: 'none' }}>
            Descargar plantilla
          </Button>
          <Button component='label' variant='outlined' startIcon={<UploadFile />} sx={{ textTransform: 'none' }}>
            Elegir archivo
            <input
              hidden
              type='file'
              accept='.xlsx,.xls,.csv'
              onChange={(event) => {
                handleFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </Button>
        </Box>
        {fileName && (
          <Alert severity={rows.length ? 'info' : 'warning'} sx={{ mb: 2 }}>
            {fileName}: {rows.length} fila(s) para importar.
            {ignored.length > 0 && ` Columnas ignoradas: ${ignored.join(', ')}.`}
          </Alert>
        )}
        {result && (
          <Alert severity={result.errors.length ? 'warning' : 'success'}>
            {result.created} creados, {result.updated} actualizados
            {result.errors.length > 0 && `, ${result.errors.length} con error:`}
            {result.errors.length > 0 && (
              <List dense>
                {result.errors.slice(0, 20).map((error) => (
                  <ListItem key={error.row} sx={{ py: 0 }}>
                    Fila {error.row}: {error.message}
                  </ListItem>
                ))}
              </List>
            )}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
          {result ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!result && (
          <Button
            variant='contained'
            onClick={handleImport}
            disabled={!rows.length || importer.isLoading}
            sx={primaryButtonSx}
          >
            Importar {rows.length || ''}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ImportEquipmentDialog
