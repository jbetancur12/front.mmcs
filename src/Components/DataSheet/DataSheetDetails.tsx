import SignalLoader from 'src/Components/Common/SignalLoader'
import { Suspense, lazy, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, Stack, Typography } from '@mui/material'

import { DataSheetData } from './ListDataSheet'
import { useDataSheet } from '@hooks/dataSheets/useDataSheets'

const DataSheetPDF = lazy(() => import('./DataSheetPDF'))

const DataSheetDetail: React.FC = () => {
  const [showPreview, setShowPreview] = useState(false)
  const { id } = useParams<{ id: string }>()
  const { data } = useDataSheet<DataSheetData>(id)
  const dataSheet = data ?? null

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
                <SignalLoader />
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
