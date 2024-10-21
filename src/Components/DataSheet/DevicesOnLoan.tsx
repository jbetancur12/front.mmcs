import useAxiosPrivate from '@utils/use-axios-private'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import React, { useEffect, useMemo } from 'react'

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
          filePath: false,
          id: false,
          'certificateType.name': false,
          name: false,
          activoFijo: false
        }
      }}
    />
  )
}

export default DevicesOnLoan
