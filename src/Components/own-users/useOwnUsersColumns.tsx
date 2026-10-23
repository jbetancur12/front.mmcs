import { type MRT_Cell, type MRT_ColumnDef } from 'material-react-table'
import React from 'react'

import { RolesCell, RolesEditCell, StatusCell } from './OwnUsersCells'
import { Role, UserData } from './types'
import { validateRequired } from './userValidation'

/** Columnas de la tabla de usuarios y validación de la edición en línea. */
export const useOwnUsersColumns = (
  roles: Role[] | undefined,
  loadingRoles: boolean
) => {
  const [validationErrors, setValidationErrors] = React.useState<{
    [cellId: string]: string
  }>({})

  const getCommonEditTextFieldProps = React.useCallback(
    (
      cell: MRT_Cell<UserData>
    ): MRT_ColumnDef<UserData>['muiTableBodyCellEditTextFieldProps'] => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid = validateRequired(event.target.value)
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors((prev) => ({
              ...prev,
              [cell.id]: `${cell.column.columnDef.header} is required`
            }))
          } else {
            //remove validation error for cell if valid
            setValidationErrors((prev) => {
              const newErrors = { ...prev }
              delete newErrors[cell.id]
              return newErrors
            })
          }
        }
      }
    },
    [validationErrors]
  )

  //should be memoized or stable
  const columns = React.useMemo<MRT_ColumnDef<UserData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        enableEditing: false
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        size: 220,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'email',
        header: 'Correo',
        size: 280,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell)
        })
      },
      {
        accessorKey: 'phone',
        header: 'Teléfono',
        size: 150,
        Cell: ({ cell }: { cell: MRT_Cell<UserData> }) =>
          cell.getValue<string>() || 'Sin teléfono'
      },
      {
        accessorKey: 'roles',
        header: 'Rol',
        size: 300,
        Cell: RolesCell,
        Edit: ({ cell }: { cell: MRT_Cell<UserData> }) => (
          <RolesEditCell
            cell={cell}
            roles={roles}
            loadingRoles={loadingRoles}
          />
        )
      },
      {
        id: 'estado',
        header: 'Estado',
        accessorFn: (user) => (user.active === true ? 'Activo' : 'Pendiente'),
        enableEditing: false,
        size: 150,
        Cell: StatusCell
      }
    ],
    [getCommonEditTextFieldProps, roles, loadingRoles]
  )

  return { columns, validationErrors, setValidationErrors }
}
