import axios from 'axios'
import { api } from '../../config'
import { Document } from './types'
// Adjust path as needed

const apiUrl = api()

// Fetch Documents
export const fetchDocuments = async (
  vehicleId: number | string | undefined
) => {
  const { data } = await axios.get(
    `${apiUrl}/vehicles/${vehicleId}/documents`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    }
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
  document: Document
) => {
  await axios.post(`${apiUrl}/vehicles/${vehicleId}/documents`, document, {
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  })
}

// Update Document
export const updateDocument = async (document: Document) => {
  await axios.put(`${apiUrl}/document/${document.id}`, document, {
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  })
}

// Delete Document
export const deleteDocument = async (
  vehicleId: number | string | undefined,
  documentId: number
) => {
  await axios.delete(
    `${apiUrl}/vehicles/${vehicleId}/documents/${documentId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    }
  )
}
