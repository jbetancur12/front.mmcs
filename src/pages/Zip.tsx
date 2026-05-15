import { Suspense, lazy, useState } from 'react'
import {
  Box,
  IconButton,
  Typography,
  Divider
} from '@mui/material'
import { Settings } from '@mui/icons-material'

import ModalPasswordForm from '../Components/ModalPasswordForm'

const AnalyzeExcelComponent = lazy(() => import('./AnalyzeExcelComponent'))

const Zip = () => {
  const [openModalSettings, setOpenModalSettings] = useState(false)
  const [wbPasswords, setWbPasswords] = useState<string[]>([])

  const handleOpenModalSettings = () => {
    setOpenModalSettings(true)
  }

  const handleCloseModalSettings = () => {
    setOpenModalSettings(false)
  }

  return (
    <Box height={'100vh'}>
      <ModalPasswordForm
        open={openModalSettings}
        onClose={handleCloseModalSettings}
        wbPasswords={wbPasswords}
        setWbPasswords={setWbPasswords}
      />
      <Box
        display={'flex'}
        justifyContent={'space-between'}
        alignItems={'center'}
        px={3}
        py={2}
      >
        <Box>
          <Typography variant='h6'>Subir Excel</Typography>
          <Typography variant='body2' color='text.secondary'>
            Flujo activo: carga por archivo Excel y PDF asociado.
          </Typography>
        </Box>
        <IconButton onClick={handleOpenModalSettings}>
          <Settings />
        </IconButton>
      </Box>
      <Divider />
      <Suspense fallback={<Box py={4}>Cargando analizador...</Box>}>
        <AnalyzeExcelComponent
          hideUpload={false}
          isFile={true}
          wbPasswords={wbPasswords}
        />
      </Suspense>
    </Box>
  )
}

export default Zip
