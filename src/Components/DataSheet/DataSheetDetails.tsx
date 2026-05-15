import { Suspense, lazy, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'

import { DataSheetData } from './ListDataSheet'
import useAxiosPrivate from '@utils/use-axios-private'

const DataSheetPDF = lazy(() => import('./DataSheetPDF'))

const DataSheetDetail: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [dataSheet, setDataSheet] = useState<DataSheetData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
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
    <>
      {!showPreview ? (
        <Box
          display='flex'
          flexDirection='column'
          alignItems='center'
          justifyContent='center'
          py={10}
        >
          <Typography variant='h6' gutterBottom>
            La vista previa de la hoja de vida se carga bajo demanda.
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            El detalle del equipo ya esta disponible y el render PDF solo se monta cuando lo solicitas.
          </Typography>
          <Button variant='contained' onClick={() => setShowPreview(true)}>
            Ver PDF
          </Button>
        </Box>
      ) : (
        <>
          <Stack direction='row' spacing={2} sx={{ mb: 2 }}>
            <Button variant='outlined' onClick={() => setShowPreview(false)}>
              Ocultar vista previa
            </Button>
          </Stack>
          <Suspense
            fallback={
              <Box display='flex' justifyContent='center' py={6}>
                <CircularProgress />
              </Box>
            }
          >
            <DataSheetPDF dataSheet={dataSheet} />
          </Suspense>
        </>
      )}
    </>
  )
}

export default DataSheetDetail
