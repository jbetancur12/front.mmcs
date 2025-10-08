import { useState, useEffect } from 'react'
import * as minioExports from 'minio'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { Box, Button, Typography } from '@mui/material'
import { NavigateBefore, NavigateNext } from '@mui/icons-material'

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
  view = 'preview',
  buttons = true
}: {
  path: string
  bucket?: string
  view?: 'preview' | 'default'
  buttons?: boolean
}) => {
  console.log('PDFViewer path:', path)
  console.log('PDFViewer bucket:', bucket)
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

          const chunks: any[] = []
          dataStream.on('data', (chunk: any) => chunks.push(chunk))
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
          {buttons && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              mb: 3,
              p: 2,
              bgcolor: '#f8f9fa',
              borderRadius: 3,
              border: '1px solid #e0e0e0'
            }}>
              <Button
                onClick={(event) => changePage(-1, event)}
                disabled={pageNumber <= 1}
                variant="contained"
                startIcon={<NavigateBefore />}
                sx={{
                  bgcolor: pageNumber <= 1 ? '#e0e0e0' : '#00BFA5',
                  color: pageNumber <= 1 ? '#9e9e9e' : 'white',
                  '&:hover': {
                    bgcolor: pageNumber <= 1 ? '#e0e0e0' : '#00ACC1'
                  },
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:disabled': {
                    bgcolor: '#e0e0e0',
                    color: '#9e9e9e'
                  }
                }}
              >
                Anterior
              </Button>
              
              <Box sx={{ 
                bgcolor: 'white',
                border: '2px solid #00BFA5',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                minWidth: 140,
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="body1" sx={{ 
                  fontWeight: 600,
                  color: '#00BFA5',
                  fontSize: '0.95rem'
                }}>
                  Página {pageNumber} de {numPages}
                </Typography>
              </Box>
              
              <Button
                onClick={(event) => changePage(1, event)}
                disabled={pageNumber >= numPages}
                variant="contained"
                endIcon={<NavigateNext />}
                sx={{
                  bgcolor: pageNumber >= numPages ? '#e0e0e0' : '#00BFA5',
                  color: pageNumber >= numPages ? '#9e9e9e' : 'white',
                  '&:hover': {
                    bgcolor: pageNumber >= numPages ? '#e0e0e0' : '#00ACC1'
                  },
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:disabled': {
                    bgcolor: '#e0e0e0',
                    color: '#9e9e9e'
                  }
                }}
              >
                Siguiente
              </Button>
            </Box>
          )}
          <Box sx={{ 
            mb: 4,
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            bgcolor: 'white'
          }}>
            <Document file={pdfData} onLoadSuccess={onDocumentLoadSuccess}>
              <Page 
                scale={1.5} 
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </Box>
       
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
