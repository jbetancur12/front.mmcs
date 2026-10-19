import { useDevicesOnLoan } from '@hooks/dataSheets/useDataSheets'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

interface Device {
  id: number
  equipmentName: string
  internalCode: string
  equipmentInOuts: EquipmentInOut[]
  observationsOut?: string | null // Add this to store the observation
  loanCustomer?: string | null // Cliente al que se le prestó (desde logística)
  loanService?: string | null // Servicio de calibración del préstamo
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
  customer?: { id: number; nombre: string } | null
  service?: { id: number; serviceCode: string } | null
}

const DevicesOnLoan: React.FC = () => {
  const { data: devicesOnLoan } = useDevicesOnLoan<Device>()
  const navigate = useNavigate()

  // Extract observationsOut from equipmentInOuts
  const data = useMemo<Device[]>(
    () =>
      (devicesOnLoan ?? []).map((device: Device) => ({
        ...device,
        observationsOut:
          device.equipmentInOuts.length > 0
            ? device.equipmentInOuts[0].observationsOut
            : null,
        loanCustomer: device.equipmentInOuts[0]?.customer?.nombre ?? null,
        loanService: device.equipmentInOuts[0]?.service?.serviceCode ?? null
      })),
    [devicesOnLoan]
  )

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
        accessorKey: 'loanCustomer',
        header: 'Cliente',
        size: 180,
        Cell: ({ cell }) => cell.getValue<string | null>() || 'Sin registrar'
      },
      {
        accessorKey: 'loanService',
        header: 'Servicio',
        size: 120,
        Cell: ({ cell }) => cell.getValue<string | null>() || '—'
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
