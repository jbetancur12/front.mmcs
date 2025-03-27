import { MRT_ColumnDef, MRT_Cell } from 'material-react-table'
import { FileData } from '../types/fileTypes'
import { CheckCircle, Warning, Cancel } from '@mui/icons-material'
import { format, differenceInDays } from 'date-fns'

type EditTextFieldProps = (
  cell: MRT_Cell<FileData>
) => MRT_ColumnDef<FileData>['muiTableBodyCellEditTextFieldProps']

export const createTableColumns = (
  getCommonEditTextFieldProps: EditTextFieldProps
): MRT_ColumnDef<FileData>[] => {
  return [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 10,
      enableEditing: false,
      id: '1'
    },
    {
      id: '12',
      accessorKey: 'nextCalibrationDate',
      header: 'Próxima Fecha de Calibración',
      size: 350,
      Cell: ({ row }) => {
        const nextCalibrationDate = new Date(row.original.nextCalibrationDate)
        const daysRemaining = differenceInDays(nextCalibrationDate, new Date())
        const formattedDate = format(nextCalibrationDate, 'yyyy-MM-dd')

        let icon: JSX.Element
        if (daysRemaining > 45) {
          icon = <CheckCircle sx={{ color: 'green' }} />
        } else if (daysRemaining > 15) {
          icon = <Warning sx={{ color: 'orange' }} />
        } else {
          icon = <Cancel sx={{ color: 'red' }} />
        }

        return (
          <div className='flex flex-col'>
            <div className='flex items-center'>
              {icon}
              <span className='ml-2'>{formattedDate}</span>
            </div>
            <span
              className={`mt-2 ${daysRemaining < 0 ? 'text-red-500 font-bold' : ''}`}
            >
              {daysRemaining < 0
                ? 'VENCIDO'
                : `Días restantes: ${daysRemaining}`}
            </span>
          </div>
        )
      }
    },
    {
      accessorKey: 'customer.nombre',
      header: 'Compañía',
      size: 150,
      enableEditing: false,
      id: '2'
    },
    {
      accessorKey: 'device.name',
      header: 'Equipo',
      size: 150,
      enableEditing: false,
      id: '3'
    },
    {
      accessorKey: 'certificateType.name',
      header: 'Tipo de Certificado',
      size: 150,
      enableEditing: false,
      id: '4'
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
      size: 150,
      enableEditing: false,
      id: '5'
    },
    {
      accessorKey: 'city',
      header: 'Ciudad',
      size: 150,
      id: '6'
    },
    {
      accessorKey: 'location',
      header: 'Ubicación',
      size: 150,
      id: '7'
    },
    {
      accessorKey: 'sede',
      header: 'Sede',
      size: 150,
      id: '8'
    },
    {
      accessorKey: 'activoFijo',
      header: 'Activo Fijo',
      size: 150,
      id: '9'
    },
    {
      accessorKey: 'serie',
      header: 'Serie',
      size: 150,
      id: '10'
    },
    {
      accessorKey: 'calibrationDate',
      header: 'Fecha de Calibración',
      size: 250,
      id: '11',
      Cell: ({ cell }) => {
        const dateValue = new Date(cell.getValue() as string)

        return <span>{dateValue.toISOString().substring(0, 10)}</span>
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
      id: '13'
    }
  ]
}
