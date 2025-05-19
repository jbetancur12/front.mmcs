import { useState } from 'react'
import { FileData } from '../types/fileTypes'
import useAxiosPrivate from '@utils/use-axios-private'

export const useFileData = () => {
  const [tableData, setTableData] = useState<FileData[]>([])
  const [loading, setLoading] = useState(false) // 🔹 Ahora se actualizará correctamente
  const axiosPrivate = useAxiosPrivate()

  const fetchFiles = async () => {
    setLoading(true) // 🔹 Indicar que la carga comenzó
    try {
      const response = await axiosPrivate.get('/files')
      if (response.status === 200 && Array.isArray(response.data)) {
        setTableData(response.data)
      } else {
        console.error('Unexpected response:', response)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false) // 🔹 Asegurar que loading se desactiva
    }
  }

  return { tableData, loading, fetchFiles }
}
