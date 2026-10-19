import { TextFieldProps } from '@mui/material'
import {
  type MRT_Cell,
  type MRT_Column,
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_TableInstance
} from 'material-react-table'
import React, { useCallback, useMemo, useState } from 'react'

import {
  InvoiceCell,
  ManualEdit,
  ServiceTypeEdit,
  StatusCell
} from './DataSheetCells'
import { DataSheetData } from './types'
import { currencyFormatter, toDateInputValue, validateRequired } from './utils'

interface EditTextFieldArgs {
  cell: MRT_Cell<DataSheetData>
  row: MRT_Row<DataSheetData>
  column: MRT_Column<DataSheetData>
  table: MRT_TableInstance<DataSheetData>
}

// Input de fecha que guarda "YYYY-MM-DD" en el cache de edición de la fila
const dateEditTextFieldProps = ({
  cell,
  row,
  column,
  table
}: EditTextFieldArgs) => ({
  type: 'date',
  InputLabelProps: { shrink: true },
  value: toDateInputValue(cell.getValue() as string),
  // Actualizamos el cache de edición y el estado de la fila al cambiar el valor
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
    // El nuevo valor ya vendrá en formato "YYYY-MM-DD"
    row._valuesCache[column.id] = event.target.value
    table.setEditingRow({ ...row })
  }
})

// Input de moneda: muestra COP y guarda el número puro
const currencyEditTextFieldProps = ({
  cell,
  row,
  column,
  table
}: EditTextFieldArgs): TextFieldProps => {
  // Se obtiene el valor original (se espera que sea un número)
  const rawValue = cell.getValue() as number | null | undefined
  // Se formatea el valor a moneda colombiana (ejemplo: $1.234.567)
  const formattedValue =
    typeof rawValue === 'number' ? currencyFormatter.format(rawValue) : ''

  return {
    // Usamos type 'text' para permitir mostrar el formato de moneda
    type: 'text',
    value: formattedValue,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      // Se remueven los caracteres que no son dígitos para obtener el número puro
      const numericString = event.target.value.replace(/[^0-9]/g, '')
      const numericValue = numericString ? parseInt(numericString, 10) : 0
      // Actualizar el cache de edición de la fila
      row._valuesCache[column.id] = numericValue

      // Notificar a la tabla el cambio en la fila en edición
      table.setEditingRow({ ...row })
    },
    onBlur: () => {
      // Asegurar que al perder el foco, el valor enviado sea un número puro
      const cleanedValue = parseInt(row._valuesCache[column.id] as string, 10)

      row._valuesCache[column.id] = cleanedValue || 0
    }
  }
}

/**
 * Columnas de la tabla de hojas de vida y el estado de validación de la
 * edición en modal.
 */
export const useDataSheetColumns = () => {
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string
  }>({})

  const getCommonEditTextFieldProps = useCallback(
    ({ cell }: { cell: MRT_Cell<DataSheetData> }): TextFieldProps => ({
      error: !!validationErrors[cell.id],
      helperText: validationErrors[cell.id],
      onBlur: (event) => {
        const isValid = validateRequired(event.target.value)
        if (!isValid) {
          setValidationErrors({
            ...validationErrors,
            [cell.id]: `${cell.column.columnDef.header} es obligatorio`
          })
        } else {
          delete validationErrors[cell.id]
          setValidationErrors({
            ...validationErrors
          })
        }
      }
    }),
    [validationErrors]
  )

  const columns = useMemo<MRT_ColumnDef<DataSheetData>[]>(() => {
    const text = (
      accessorKey: keyof DataSheetData,
      header: string
    ): MRT_ColumnDef<DataSheetData> => ({
      accessorKey,
      header,
      size: 150,
      muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps
    })

    return [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 10,
        enableEditing: false,
        Edit: () => null
      },
      {
        accessorKey: 'pictureUrl',
        header: 'URL de la Imagen',
        enableEditing: false,
        size: 150,
        Edit: () => null
      },
      {
        accessorKey: 'invoiceUrl',
        header: 'Factura',
        size: 20,
        enableEditing: false,
        enableColumnDragging: false,
        enableGlobalFilter: false,
        enableColumnActions: false,
        Edit: () => null,
        Cell: InvoiceCell
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        enableEditing: false,
        enableColumnDragging: false,
        enableGlobalFilter: false,
        enableColumnActions: false,
        size: 150,
        Edit: () => null,
        Cell: StatusCell
      },
      {
        ...text('internalCode', 'Código Interno'),
        enableEditing: false
      },
      text('equipmentName', 'Nombre del Equipo'),
      text('brand', 'Marca'),
      text('model', 'Modelo'),
      text('serialNumber', 'Número de Serie'),
      text('supplier', 'Proveedor'),
      {
        accessorKey: 'manual',
        header: 'Manual',
        size: 150,
        Edit: ManualEdit
      },
      text('magnitude', 'Magnitud'),
      text('units', 'Unidades'),
      {
        accessorKey: 'receivedDate',
        header: 'Fecha de Recepción',
        size: 150,
        muiTableBodyCellEditTextFieldProps: dateEditTextFieldProps
      },
      {
        accessorKey: 'inServiceDate',
        header: 'Fecha en Servicio',
        size: 150,
        muiTableBodyCellEditTextFieldProps: dateEditTextFieldProps
      },
      text('location', 'Ubicación'),
      {
        accessorKey: 'serviceType',
        header: 'Tipo de Servicio',
        size: 150,
        Edit: ServiceTypeEdit
      },
      text('equipmentStatus', 'Estado del Equipo'),
      text('operationRange', 'Rango de Operación'),
      text('accuracy', 'Exactitud'),
      text('resolution', 'Resolución'),
      text('softwareFirmware', 'Software/Firmware'),
      text('storageTemperature', 'Temperatura de Almacenamiento'),
      text('storageHumidity', 'Humedad de Almacenamiento'),
      text('operationTemperature', 'Temperatura de Operación'),
      text('operationHumidity', 'Humedad de Operación'),
      text('storageOperationComment', 'Comentario de Almacenamiento/Operación'),
      text(
        'transportConditionsComment',
        'Comentario de Condiciones de Transporte'
      ),
      {
        accessorKey: 'insuredValue',
        header: 'Valor Asegurado',
        size: 150,
        muiTableBodyCellEditTextFieldProps: currencyEditTextFieldProps
      },
      text('maintenanceProvider', 'Proveedor de Mantenimiento'),
      text('maintenanceCycle', 'Ciclo de Mantenimiento'),
      text('calibrationProvider', 'Proveedor de Calibración'),
      text('calibrationCycle', 'Ciclo de Calibración')
    ]
  }, [getCommonEditTextFieldProps])

  return { columns, validationErrors, setValidationErrors }
}
