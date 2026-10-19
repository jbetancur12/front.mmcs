import { useEffect, useState } from 'react'
import useAxiosPrivate from '@utils/use-axios-private'

/** Vista previa de un documento del servicio (imagen en línea o visor PDF). */
const useCalibrationServiceDocumentViewer = (serviceId: number) => {
  const [viewDocumentId, setViewDocumentId] = useState<number | null>(null)
  const [viewDocumentFileName, setViewDocumentFileName] = useState('')
  const [viewDocumentBlobUrl, setViewDocumentBlobUrl] = useState('')
  const [viewDocumentIsImage, setViewDocumentIsImage] = useState(false)
  const axiosPrivate = useAxiosPrivate()

  useEffect(() => {
    if (!viewDocumentId) return

    let cancelled = false

    const loadBlob = async () => {
      try {
        const response = await axiosPrivate.get(
          `/calibration-services/${serviceId}/documents/${viewDocumentId}/download`,
          { responseType: 'blob' }
        )
        if (cancelled) return
        const blob = response.data as Blob
        const url = URL.createObjectURL(blob)
        setViewDocumentBlobUrl(url)
        setViewDocumentIsImage(blob.type.startsWith('image/'))
      } catch {
        if (!cancelled) {
          setViewDocumentBlobUrl('')
          setViewDocumentIsImage(false)
        }
      }
    }

    loadBlob()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDocumentId])

  const handleViewDocument = (documentId: number, fileName: string) => {
    if (viewDocumentBlobUrl) URL.revokeObjectURL(viewDocumentBlobUrl)
    setViewDocumentBlobUrl('')
    setViewDocumentIsImage(false)
    setViewDocumentId(documentId)
    setViewDocumentFileName(fileName)
  }

  const handleCloseViewDocument = () => {
    if (viewDocumentBlobUrl) URL.revokeObjectURL(viewDocumentBlobUrl)
    setViewDocumentId(null)
    setViewDocumentFileName('')
    setViewDocumentBlobUrl('')
    setViewDocumentIsImage(false)
  }

  return {
    viewDocumentId,
    viewDocumentFileName,
    viewDocumentBlobUrl,
    viewDocumentIsImage,
    handleViewDocument,
    handleCloseViewDocument
  }
}

export default useCalibrationServiceDocumentViewer
