import { useState, useEffect } from 'react'
import * as minioExports from 'minio'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { Box, Button, Typography } from '@mui/material'

const minioClient = new minioExports.Client({
  endPoint: import.meta.env.VITE_MINIO_ENDPOINT || 'localhost',
  port: import.meta.env.VITE_ENV === 'development' ? 9000 : undefined,
  useSSL: import.meta.env.VITE_MINIO_USESSL === 'true',
  accessKey: import.meta.env.VITE_MINIO_ACCESSKEY,
  secretKey: import.meta.env.VITE_MINIO_SECRETKEY
})

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

const PDFViewer = ({
  path,
  bucket = 'first-bucket',
  view = 'preview'
}: {
  path: string
  bucket?: string
  view?: 'preview' | 'default'
}) => {
  console.log('🚀 ~ path:', path)
  const [numPages, setNumPages] = useState<number>(1)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [pdfData, setPdfData] = useState<string | null>(null)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  useEffect(() => {
    const getBucket = async () => {
      minioClient.getObject(
        bucket,
        path,

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
  }, [path])

  const changePage = (
    offset: number,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    setPageNumber((prevPageNumber) => prevPageNumber + offset)
  }

  return (
    <>
      {view === 'preview' && pdfData && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 2,
              marginBottom: 2
            }}
          >
            <Button
              variant='contained'
              color='primary'
              disabled={pageNumber <= 1}
              onClick={(event) => changePage(-1, event)}
              sx={{ marginRight: 2 }}
            >
              Anterior
            </Button>
            <Button
              variant='contained'
              color='primary'
              disabled={pageNumber >= numPages}
              onClick={(event) => changePage(1, event)}
            >
              Siguiente
            </Button>
          </Box>
          <Box sx={{ marginBottom: 4 }}>
            <Document file={pdfData} onLoadSuccess={onDocumentLoadSuccess}>
              <Page scale={1.5} pageNumber={pageNumber} />
            </Document>
          </Box>
          <Typography variant='body1'>
            Página {pageNumber} de {numPages}
          </Typography>
        </Box>
      )}
      {view === 'default' && pdfData && (
        <object
          data={pdfData}
          type='application/pdf'
          width='100%'
          height='500px'
        >
          <br />
          <a href={pdfData} id='enlaceDescargarPdf' download='ReactJS.pdf'>
            No es posible visualizar el PDF en dispositios moviles, da click
            aquí para descargarlo
          </a>
        </object>
      )}
    </>
  )
}

export default PDFViewer
