import { useState, useEffect } from 'react'
import * as minioExports from 'minio'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

// let minioClient = null;

// if (import.meta.env.VITE_ENV === "development") {
//   minioClient = new minioExports.Client({
//     endPoint: import.meta.env.VITE_MINIO_ENDPOINT || "localhost",
//     port: 9000,
//     useSSL: import.meta.env.VITE_MINIO_USESSL === "true" ? true : false,
//     accessKey: import.meta.env.VITE_MINIO_ACCESSKEY,
//     secretKey: import.meta.env.VITE_MINIO_SECRETKEY,
//   });
// } else {
//   minioClient = new minioExports.Client({
//     endPoint: import.meta.env.VITE_MINIO_ENDPOINT || "localhost",
//     useSSL: import.meta.env.VITE_MINIO_USESSL === "true" ? true : false,
//     accessKey: import.meta.env.VITE_MINIO_ACCESSKEY,
//     secretKey: import.meta.env.VITE_MINIO_SECRETKEY,
//   });
// }

const minioClient = new minioExports.Client({
  endPoint: import.meta.env.VITE_MINIO_ENDPOINT || 'localhost',
  port: import.meta.env.VITE_ENV === 'development' ? 9000 : undefined,
  useSSL: import.meta.env.VITE_MINIO_USESSL === 'true',
  accessKey: import.meta.env.VITE_MINIO_ACCESSKEY,
  secretKey: import.meta.env.VITE_MINIO_SECRETKEY
})

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString()

const PDFViewer = ({
  path,
  bucket = 'first-bucket',
  view = 'preview'
}: {
  path: string
  bucket: string
  view: 'preview' | 'default'
}) => {
  const [_numPages, setNumPages] = useState<number>(1)
  const [pageNumber, _setPageNumber] = useState<number>(1)
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

  // function changePage(offset: number) {
  //   setPageNumber((prevPageNumber) => prevPageNumber + offset);
  // }

  // function previousPage() {
  //   changePage(-1);
  // }

  // function nextPage() {
  //   changePage(1);
  // }

  return (
    <>
      {view === 'preview' && pdfData && (
        <Document file={pdfData} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} />
        </Document>
      )}
      {/* {pdfData && (
        <embed
          src={pdfData}
          width="100%"
          height="500"
          type="application/pdf"
        ></embed>
      )} */}
      {view === 'default' && pdfData && (
        <object
          data={pdfData}
          type='application/pdf'
          width='100%'
          height='500px'
        >
          <br />
          <a href={pdfData} id='enlaceDescargarPdf' download='ReactJS.pdf'>
            Tu dispositivo no puede visualizar los PDF, da click aquí para
            descargarlo
          </a>
        </object>
      )}
      {/* <div>
        <p>
          Page {pageNumber || (numPages ? 1 : "--")} of {numPages || "--"}
        </p>
        <button type="button" disabled={pageNumber <= 1} onClick={previousPage}>
          Previous
        </button>
        <button
          type="button"
          disabled={pageNumber >= numPages}
          onClick={nextPage}
        >
          Next
        </button>
      </div> */}
    </>
  )
}

export default PDFViewer
