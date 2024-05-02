import React, { useState } from 'react'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import {
  TextField,
  Select,
  MenuItem,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  IconButton,
  Button,
  Tooltip
} from '@mui/material'
import AnalyzeExcelComponent from './AnalyzeExcelComponent'

import { Check, Close, CloudUpload, Search } from '@mui/icons-material'

const Zip = () => {
  const [file, setFile] = useState<File | null>(null)
  const [fileNames, setFileNames] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [value, setValue] = React.useState('file')
  const [data, setData] = useState<any[]>([])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue((event.target as HTMLInputElement).value)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const uploadedFile = event.target.files[0]

      setFile(uploadedFile)
    }
  }

  const handleFileUnzip = async () => {
    try {
      const zip = new JSZip()
      if (file) {
        await zip.loadAsync(file)

        setFileNames(Object.keys(zip.files))
      } else {
        throw new Error('No file selected')
      }
    } catch (error) {
      console.error('Error unzipping file:', error)
      // Display error message using Material-UI Snackbar or Alert
    }
  }

  const handleDeleteFileUploaded = () => {
    setFile(null)
  }

  const handleFileProcess = async () => {
    try {
      const zip = new JSZip()
      if (file && selectedFile) {
        await zip.loadAsync(file)

        const zipObject = zip.file(selectedFile)
        if (zipObject) {
          zipObject.async('binarystring').then((data) => {
            const workbook = XLSX.read(data, { type: 'binary' })
            const worksheet = workbook.Sheets['CC']
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              raw: false,
              dateNF: 'yyyy-mm-dd'
            })
            console.log('🚀 ~ zipObject.async ~ jsonData:', jsonData)
            setData(jsonData)

            // Remove processed file from list
            // setFileNames(fileNames.filter((name) => name !== selectedFile));
          })
        }
      } else {
        throw new Error('No file selected')
      }
    } catch (error) {
      console.error('Error processing file:', error)
      // Display error message using Material-UI Snackbar or Alert
    }
  }

  return (
    <Box height={'100vh'}>
      <FormControl>
        <FormLabel id='demo-radio-buttons-group-label'>Procesar</FormLabel>
        <RadioGroup
          aria-labelledby='demo-radio-buttons-group-label'
          defaultValue='female'
          name='radio-buttons-group'
          value={value}
          onChange={handleChange}
        >
          <FormControlLabel
            value='directory'
            control={<Radio />}
            label='Directorio'
          />
          <FormControlLabel value='file' control={<Radio />} label='Archivo' />
        </RadioGroup>
      </FormControl>
      {value === 'directory' && (
        <Box
          sx={{
            maxWidth: 400,
            margin: '0 auto'
          }}
        >
          <Stack spacing={2}>
            <div className='flex justify-evenly gap-6'>
              {!file && (
                <Button
                  variant='contained'
                  component='label'
                  color='primary'
                  startIcon={<Search />}
                >
                  Buscar
                  <input
                    type='file'
                    hidden
                    onChange={handleFileUpload}
                    accept='.zip'
                  />
                </Button>
              )}
              {file && (
                <Tooltip title={file.name} arrow>
                  <TextField
                    variant='outlined'
                    disabled
                    value={file.name}
                    fullWidth
                  />
                </Tooltip>
              )}
              {file && (
                <div className='flex'>
                  <IconButton
                    onClick={handleDeleteFileUploaded}
                    color='error'
                    size='large'
                  >
                    <Close />
                  </IconButton>

                  <IconButton
                    onClick={handleFileUnzip}
                    color='primary'
                    size='large'
                  >
                    <CloudUpload />
                  </IconButton>
                </div>
              )}
            </div>
            {fileNames.length > 0 && (
              <div className='flex justify-evenly gap-6'>
                <Select
                  label='Archivo'
                  value={selectedFile || ''}
                  onChange={(event) =>
                    setSelectedFile(event.target.value as string)
                  }
                  sx={{ width: '100%' }}
                >
                  {fileNames.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
                <IconButton color='primary' onClick={handleFileProcess}>
                  <Check />
                </IconButton>
              </div>
            )}
            {data.length > 0 && (
              <AnalyzeExcelComponent
                dataReceived={data}
                hideUpload={fileNames.length > 0}
                fileNames={fileNames}
                selectedFile={selectedFile}
                setFileNames={setFileNames}
                isFile={false}
              />
            )}
          </Stack>
        </Box>
      )}
      {value === 'file' && (
        <AnalyzeExcelComponent
          hideUpload={fileNames.length > 0}
          isFile={true}
        />
      )}
    </Box>
  )
}

export default Zip
