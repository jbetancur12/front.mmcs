import { MRT_ColumnDef, MRT_Cell } from 'material-react-table'
import { FileData } from '../types/fileTypes'
import { CheckCircle, Warning, Cancel } from '@mui/icons-material'
import { format, differenceInDays } from 'date-fns'
import { Box, Chip, Typography } from '@mui/material'

type EditTextFieldProps = (
  cell: MRT_Cell<FileData>
) => MRT_ColumnDef<FileData>['muiTableBodyCellEditTextFieldProps']

export const createTableColumns = (
  getCommonEditTextFieldProps: EditTextFieldProps
): MRT_ColumnDef<FileData>[] => {
  return [
    {
      id: '12',
      accessorKey: 'nextCalibrationDate',
      header: 'Próxima Calibración',
      size: 200,
      minSize: 180,
      maxSize: 250,
      Cell: ({ row }) => {
        const nextCalibrationDate = new Date(row.original.nextCalibrationDate)
        const daysRemaining = differenceInDays(nextCalibrationDate, new Date())
        const formattedDate = format(nextCalibrationDate, 'dd/MM/yyyy')

        let chipIcon: JSX.Element
        let chipLabel: string
        let bgColor: string
        let textColor: string

        if (daysRemaining < 0) {
          chipIcon = <Cancel sx={{ fontSize: 18 }} />
          chipLabel = 'VENCIDO'
          bgColor = '#fee2e2'
          textColor = '#dc2626'
        } else if (daysRemaining <= 15) {
          chipIcon = <Cancel sx={{ fontSize: 18 }} />
          chipLabel = `${daysRemaining} días`
          bgColor = '#fef3c7'
          textColor = '#f59e0b'
        } else if (daysRemaining <= 45) {
          chipIcon = <Warning sx={{ fontSize: 18 }} />
          chipLabel = `${daysRemaining} días`
          bgColor = '#fef3c7'
          textColor = '#f59e0b'
        } else {
          chipIcon = <CheckCircle sx={{ fontSize: 18 }} />
          chipLabel = `${daysRemaining} días`
          bgColor = '#d1fae5'
          textColor = '#059669'
        }

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography
              variant='body2'
              sx={{
                fontWeight: 600,
                color: '#374151',
                fontSize: '0.875rem'
              }}
            >
              {formattedDate}
            </Typography>
            <Chip
              icon={chipIcon}
              label={chipLabel}
              size='small'
              sx={{
                backgroundColor: bgColor,
                color: textColor,
                fontWeight: 600,
                fontSize: '0.75rem',
                height: '24px',
                '& .MuiChip-icon': {
                  color: textColor
                }
              }}
            />
          </Box>
        )
      }
    },
    {
      accessorKey: 'customer.nombre',
      header: 'Compañía',
      size: 200,
      minSize: 150,
      maxSize: 300,
      enableEditing: false,
      id: '2'
    },
    {
      accessorKey: 'device.name',
      header: 'Equipo',
      size: 180,
      minSize: 150,
      maxSize: 250,
      enableEditing: false,
      id: '3'
    },
    {
      accessorKey: 'certificateType.name',
      header: 'Tipo de Certificado',
      size: 160,
      minSize: 140,
      maxSize: 200,
      enableEditing: false,
      id: '4'
    },
    {
      accessorKey: 'name',
      header: 'Nombre Archivo',
      size: 250,
      minSize: 200,
      maxSize: 350,
      enableEditing: false,
      id: '5'
    },
    {
      accessorKey: 'city',
      header: 'Ciudad',
      size: 140,
      minSize: 120,
      maxSize: 180,
      id: '6'
    },
    {
      accessorKey: 'location',
      header: 'Ubicación',
      size: 140,
      minSize: 120,
      maxSize: 180,
      id: '7'
    },
    {
      accessorKey: 'sede',
      header: 'Sede',
      size: 160,
      minSize: 120,
      maxSize: 200,
      id: '8'
    },
    {
      accessorKey: 'activoFijo',
      header: 'Activo Fijo',
      size: 130,
      minSize: 110,
      maxSize: 160,
      id: '9'
    },
    {
      accessorKey: 'serie',
      header: 'Serie',
      size: 140,
      minSize: 120,
      maxSize: 180,
      id: '10'
    },
    {
      accessorKey: 'calibrationDate',
      header: 'Fecha Calibración',
      size: 150,
      minSize: 130,
      maxSize: 180,
      id: '11',
      Cell: ({ cell }) => {
        const dateValue = new Date(cell.getValue() as string)
        const formattedDate = format(dateValue, 'dd/MM/yyyy')

        return (
          <Typography
            variant='body2'
            sx={{
              fontWeight: 600,
              color: '#374151',
              fontSize: '0.875rem'
            }}
          >
            {formattedDate}
          </Typography>
        )
      },
      muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
        ...getCommonEditTextFieldProps(cell),
        type: 'date'
      })
    },
    {
      accessorKey: 'filePath',
      header: 'filePath',
      size: 150,
      enableEditing: false,
      enableHiding: true,
      id: '13',
      enableColumnActions: false,
      muiTableHeadCellProps: {
        sx: {
          display: 'none'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          display: 'none'
        }
      }
    }
  ]
}
