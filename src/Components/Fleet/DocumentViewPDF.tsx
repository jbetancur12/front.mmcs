import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as minioExports from 'minio'
import { Box, CircularProgress, IconButton, Typography } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'

const minioClient = new minioExports.Client({
  endPoint: import.meta.env.VITE_MINIO_ENDPOINT || 'localhost',
  port: import.meta.env.VITE_ENV === 'development' ? 9000 : undefined,
  useSSL: import.meta.env.VITE_MINIO_USESSL === 'true',
  accessKey: import.meta.env.VITE_MINIO_ACCESSKEY,
  secretKey: import.meta.env.VITE_MINIO_SECRETKEY
})

const DocumentViewPDF = () => {
  const { id } = useParams<{ id: string }>()
  const [pdfData, setPdfData] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const getBucket = async () => {
      minioClient.getObject(
        'fleet-documents',
        id as string,

        function (err: Error | null, dataStream: any) {
          if (err) {
            console.error(err)
            return
          }

          const chunks: Uint8Array[] = []
          dataStream.on('data', (chunk: Uint8Array) => chunks.push(chunk))
          dataStream.on('end', () => {
            const pdfBlob = new Blob(chunks, { type: 'application/pdf' })
            const pdfUrl = URL.createObjectURL(pdfBlob)

            setPdfData(pdfUrl)
          })
        }
      )
    }
    getBucket()
  }, [id])

  if (!pdfData) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='100vh'
        flexDirection='column'
      >
        <CircularProgress />
        <Typography variant='h6' sx={{ mt: 2, color: 'text.secondary' }}>
          Generando PDF...
        </Typography>
      </Box>
    )
  } else {
    return (
      <>
        <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          <ArrowBack />
        </IconButton>
        <object
          data={pdfData}
          type='application/pdf'
          width='100%'
          height='1000px'
        >
          <br />
          <a href={pdfData} id='enlaceDescargarPdf' download={`${id}`}>
            Tu dispositivo no puede visualizar los PDF, da click aquí para
            descargarlo
          </a>
        </object>
      </>
    )
  }
}

export default DocumentViewPDF
