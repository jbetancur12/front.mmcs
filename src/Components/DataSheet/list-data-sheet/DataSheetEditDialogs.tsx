import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography
} from '@mui/material'
import {
  Close,
  EditOutlined,
  ImageOutlined,
  PictureAsPdfOutlined
} from '@mui/icons-material'
import FormDialog from 'src/Components/Common/FormDialog'
import FileDropZone from 'src/Components/Common/FileDropZone'
import { notify } from 'src/utils/notify'

export type EditStep = 'options' | 'image' | 'invoice' | null

interface DataSheetEditDialogsProps {
  step: EditStep
  onClose: () => void
  onStepChange: (step: EditStep) => void
  equipmentName?: string
  /** Sube la foto nueva del equipo. */
  onUploadImage: (image: File) => Promise<void>
  /** Sube la factura en PDF. */
  onUploadInvoice: (pdf: File) => Promise<void>
  /** Abre la edición de los demás datos en la tabla. */
  onEditOther: () => void
}

interface OptionProps {
  icon: React.ReactElement
  title: string
  description: string
  onClick: () => void
}

/** Opción grande del selector: ícono en cajita turquesa, título y una línea. */
const Option: React.FC<OptionProps> = ({
  icon,
  title,
  description,
  onClick
}) => (
  <Box
    component='button'
    type='button'
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      width: '100%',
      p: 2,
      textAlign: 'left',
      cursor: 'pointer',
      font: 'inherit',
      bgcolor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      '&:hover': { borderColor: '#00BFA5', bgcolor: '#f6fcfb' },
      '&:focus-visible': { outline: '3px solid #00695C', outlineOffset: 2 }
    }}
  >
    <Box
      aria-hidden
      sx={{
        width: 44,
        height: 44,
        borderRadius: '12px',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        bgcolor: '#E0F7F4',
        color: '#00695C'
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography fontWeight={600}>{title}</Typography>
      <Typography variant='body2' color='text.secondary'>
        {description}
      </Typography>
    </Box>
  </Box>
)

/** Vista previa de la imagen elegida; libera la URL al cambiar o cerrar. */
const ImagePreview: React.FC<{ file: File }> = ({ file }) => {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return (
    <Box
      component='img'
      src={url}
      alt='Vista previa de la foto del equipo'
      sx={{
        mt: 2,
        width: '100%',
        maxHeight: 220,
        objectFit: 'contain',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}
    />
  )
}

const rejectFile = (message: string) =>
  notify.error('Archivo no válido', message)

/**
 * Flujo de edición de una hoja de vida: primero se elige qué editar (foto,
 * factura u otros datos) y la foto y la factura se suben desde un
 * `FormDialog` con `FileDropZone`.
 */
const DataSheetEditDialogs: React.FC<DataSheetEditDialogsProps> = ({
  step,
  onClose,
  onStepChange,
  equipmentName,
  onUploadImage,
  onUploadInvoice,
  onEditOther
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFile(null)
    setLoading(false)
  }, [step])

  const submit = async (upload: (f: File) => Promise<void>) => {
    if (!file) {
      rejectFile('Selecciona un archivo antes de continuar.')
      return
    }
    setLoading(true)
    try {
      await upload(file)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog
        open={step === 'options'}
        onClose={onClose}
        maxWidth='xs'
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 1
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='h6' component='span' fontWeight={700}>
              Editar hoja de vida
            </Typography>
            {equipmentName && (
              <Typography variant='body2' color='text.secondary'>
                {equipmentName}
              </Typography>
            )}
          </Box>
          <IconButton aria-label='Cerrar' onClick={onClose} edge='end'>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 1.5, pt: 2.5 }}>
          <Option
            icon={<ImageOutlined />}
            title='Cambiar la foto'
            description='Sube una imagen nueva del equipo.'
            onClick={() => onStepChange('image')}
          />
          <Option
            icon={<PictureAsPdfOutlined />}
            title='Subir la factura'
            description='Carga o reemplaza la factura en PDF.'
            onClick={() => onStepChange('invoice')}
          />
          <Option
            icon={<EditOutlined />}
            title='Editar los datos'
            description='Cambia nombre, marca, modelo y demás campos.'
            onClick={() => {
              onClose()
              onEditOther()
            }}
          />
        </DialogContent>
      </Dialog>

      <FormDialog
        open={step === 'image'}
        onClose={onClose}
        title='Cambiar la foto'
        subtitle={equipmentName}
        submitLabel='Actualizar'
        onSubmit={() => submit(onUploadImage)}
        loading={loading}
      >
        <FileDropZone
          file={file}
          onFileSelected={setFile}
          onReject={rejectFile}
          accept='image/*'
          acceptLabel='imagen'
          title='Arrastra la foto aquí o haz clic para elegirla'
          hint='JPG, PNG o WEBP, hasta 10 MB'
          disabled={loading}
        />
        {file && <ImagePreview file={file} />}
      </FormDialog>

      <FormDialog
        open={step === 'invoice'}
        onClose={onClose}
        title='Subir la factura'
        subtitle={equipmentName}
        submitLabel='Subir factura'
        onSubmit={() => submit(onUploadInvoice)}
        loading={loading}
      >
        <FileDropZone
          file={file}
          onFileSelected={setFile}
          onReject={rejectFile}
          accept='application/pdf'
          acceptLabel='PDF'
          disabled={loading}
        />
      </FormDialog>
    </>
  )
}

export default DataSheetEditDialogs
