import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

import { api } from '../../config'

import { DataSheetData } from './ListDataSheet'
import DataSheetPDF from './DataSheetPDF'

const apiUrl = api()

const DataSheetDetail: React.FC = () => {
  const [dataSheet, setDataSheet] = useState<DataSheetData | null>(null)
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    const fetchDataSheet = async () => {
      try {
        const response = await axios.get<DataSheetData>(
          `${apiUrl}/dataSheet/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        )

        if (response.statusText === 'OK') {
          setDataSheet(response.data)
        }
      } catch (error) {
        console.error('Error fetching dataSheet data:', error)
      }
    }

    fetchDataSheet()
  }, [id])

  if (!dataSheet) return <div>Loading...</div>

  return <DataSheetPDF dataSheet={dataSheet} />
}

export default DataSheetDetail
