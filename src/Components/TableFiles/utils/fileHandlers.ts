import axios, { AxiosError } from 'axios'
import { toast } from 'react-hot-toast'
import useAxiosPrivate from '@utils/use-axios-private'
import { getBlobApiErrorReason } from 'src/utils/apiError'

export const handleDownload = async (
  filePath: string,
  axiosPrivate: ReturnType<typeof useAxiosPrivate>
) => {
  try {
    const response = await axiosPrivate.get(`/files/download/${filePath}`, {
      responseType: 'blob'
    })

    if (response.status === 200) {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filePath.split('-').slice(1).join('-'))
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    }
  } catch (error) {
    await handleDownloadError(error as AxiosError)
  }
}

const handleDownloadError = async (error: AxiosError) => {
  const reason = await getBlobApiErrorReason(error)
  if (reason) {
    toast.error(reason)
  } else if (axios.isAxiosError(error)) {
    toast.error(
      error.response
        ? `Error: ${error.response.statusText}`
        : `Error de red: ${error.message}`
    )
  } else {
    toast.error('Error desconocido al descargar el archivo')
  }
}
