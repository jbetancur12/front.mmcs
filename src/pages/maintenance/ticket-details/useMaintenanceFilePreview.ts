import { useEffect, useRef, useState } from 'react'
import useAxiosPrivate from '../../../utils/use-axios-private'
import { MaintenanceFile } from '../../../types/maintenance'
import { getFileDisplayName } from './maintenanceTicketDetailUtils'

type ShowToast = (
  message: string,
  severity: 'success' | 'error' | 'warning' | 'info'
) => void

/** Vista previa y descarga de archivos del ticket, con caché de URLs blob. */
const useMaintenanceFilePreview = (showToast: ShowToast) => {
  const axiosPrivate = useAxiosPrivate() // Initialize axios interceptors for automatic token refresh
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<MaintenanceFile | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [filePreviewCache, setFilePreviewCache] = useState<
    Record<string, string>
  >({})
  const filePreviewCacheRef = useRef<Record<string, string>>({})

  useEffect(() => {
    filePreviewCacheRef.current = filePreviewCache
  }, [filePreviewCache])

  useEffect(() => {
    return () => {
      Object.values(filePreviewCacheRef.current).forEach((url) => {
        window.URL.revokeObjectURL(url)
      })
    }
  }, [])

  const getFilePreviewUrl = async (file: MaintenanceFile) => {
    if (filePreviewCache[file.id]) {
      return filePreviewCache[file.id]
    }

    const response = await axiosPrivate.get(
      `/maintenance/files/${file.id}/download`,
      {
        responseType: 'blob'
      }
    )

    const url = window.URL.createObjectURL(response.data)
    setFilePreviewCache((prev) => ({ ...prev, [file.id]: url }))
    return url
  }

  const handleFileView = async (file: MaintenanceFile) => {
    setPreviewOpen(true)
    setPreviewFile(file)
    setPreviewLoading(true)
    setPreviewError(null)

    try {
      const url = await getFilePreviewUrl(file)
      setPreviewUrl(url)
    } catch (error) {
      console.error('Error loading file preview:', error)
      setPreviewError('No se pudo cargar la vista previa del archivo')
      showToast('Error al cargar la vista previa del archivo', 'error')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setPreviewFile(null)
    setPreviewUrl(null)
    setPreviewLoading(false)
    setPreviewError(null)
  }

  const handleDownloadPreviewFile = async () => {
    if (!previewFile) return

    try {
      const url = await getFilePreviewUrl(previewFile)
      const link = document.createElement('a')
      link.href = url
      link.download = getFileDisplayName(previewFile)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading file:', error)
      showToast('Error al descargar el archivo', 'error')
    }
  }

  return {
    getFilePreviewUrl,
    handleFileView,
    handleClosePreview,
    handleDownloadPreviewFile,
    previewOpen,
    setPreviewOpen,
    previewFile,
    setPreviewFile,
    previewUrl,
    setPreviewUrl,
    previewLoading,
    setPreviewLoading,
    previewError,
    setPreviewError,
    filePreviewCache,
    setFilePreviewCache
  }
}

export default useMaintenanceFilePreview
