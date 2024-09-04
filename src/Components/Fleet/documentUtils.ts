import useAxiosPrivate from '@utils/use-axios-private'
import { Document } from './types'
// Adjust path as needed

// Fetch Documents
export const fetchDocuments = async (
  vehicleId: number | string | undefined
) => {
  const axiosPrivate = useAxiosPrivate()
  const { data } = await axiosPrivate.get(
    `/vehicles/${vehicleId}/documents`,
    {}
  )
  return {
    documents: data.documents,
    reminders: data.reminders,
    currentMileage: data.currentMileage,
    vehicleData: data.vehicleData
  }
}

// Add Document
export const addDocument = async (
  vehicleId: number | string | undefined,
  document: FormData
) => {
  const axiosPrivate = useAxiosPrivate()
  await axiosPrivate.post(`/vehicles/${vehicleId}/documents`, document, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// Update Document
export const updateDocument = async (document: Document) => {
  const axiosPrivate = useAxiosPrivate()
  await axiosPrivate.put(`/document/${document.id}`, document, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// Delete Document
export const deleteDocument = async (
  vehicleId: number | string | undefined,
  documentId: number
) => {
  const axiosPrivate = useAxiosPrivate()
  await axiosPrivate.delete(
    `/vehicles/${vehicleId}/documents/${documentId}`,
    {}
  )
}
