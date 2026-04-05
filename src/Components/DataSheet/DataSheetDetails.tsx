import { Suspense, lazy, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

import { DataSheetData } from './ListDataSheet'
import useAxiosPrivate from '@utils/use-axios-private'

const DataSheetPDF = lazy(() => import('./DataSheetPDF'))

const DataSheetDetail: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [dataSheet, setDataSheet] = useState<DataSheetData | null>(null)
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    const fetchDataSheet = async () => {
      try {
        const response = await axiosPrivate.get<DataSheetData>(
          `/dataSheet/${id}`,
          {}
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

  return (
    <Suspense
      fallback={
        <Box display='flex' justifyContent='center' py={6}>
          <CircularProgress />
        </Box>
      }
    >
      <DataSheetPDF dataSheet={dataSheet} />
    </Suspense>
  )
}

export default DataSheetDetail
