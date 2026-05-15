import useAxiosPrivate from '@utils/use-axios-private'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import React, { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

interface Device {
  id: number
  equipmentName: string
  internalCode: string
  equipmentInOuts: EquipmentInOut[]
  observationsOut?: string | null // Add this to store the observation
}

interface EquipmentInOut {
  id: number
  outReason: string
  outDate: string
  inDate: string
  visualOutInspection: string
  visualInInspection: string
  operationalOutTest: string
  operationalInTest: string
  observationsIn: string | null
  observationsOut: string | null
  registeredBy: string
}

const DevicesOnLoan = () => {
  const [data, setData] = React.useState<Device[]>([])
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()

  const getDevicesOnLoan = async () => {
    const response = await axiosPrivate.get(`/reports/devices-on-loan`)
    // Extract observationsOut from equipmentInOuts
    const devicesWithObservations = response.data.map((device: Device) => ({
      ...device,
      observationsOut:
        device.equipmentInOuts.length > 0
          ? device.equipmentInOuts[0].observationsOut
          : null
    }))
    setData(devicesWithObservations)
  }

  useEffect(() => {
    getDevicesOnLoan()
  }, [])

  const columns = useMemo<MRT_ColumnDef<Device>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 10,
        enableEditing: false
      },
      {
        accessorKey: 'equipmentName',
        header: 'Nombre del Equipo',
        size: 150
      },
      {
        accessorKey: 'internalCode',
        header: 'Código Interno',
        size: 150
      },
      {
        accessorKey: 'observationsOut', // Access the new field
        header: 'Observaciones Salida',
        size: 200 // Adjust size as needed
      }
    ],
    []
  )

  const handleRowClick = (row: Device) => {
    navigate(`/datasheets/${row.id}/in-out`) // Navigate to a details page, using row.id
  }

  return (
    <MaterialReactTable
      displayColumnDefOptions={{
        'mrt-row-actions': {
          muiTableHeadCellProps: {
            align: 'center'
          },
          size: 120
        }
      }}
      columns={columns}
      data={data}
      enableColumnOrdering
      enableHiding={false}
      initialState={{
        columnVisibility: {
          id: false
        }
      }}
      muiTableBodyRowProps={({ row }) => ({
        onClick: () => handleRowClick(row.original), // Navigate on row click
        sx: { cursor: 'pointer' } // Change cursor to pointer for visual feedback
      })}
    />
  )
}

export default DevicesOnLoan
