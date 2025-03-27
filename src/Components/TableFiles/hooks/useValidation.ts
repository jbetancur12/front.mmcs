import { useCallback } from 'react'
import { MRT_Cell, MRT_ColumnDef } from 'material-react-table'
import { FileData } from '../types/fileTypes'
import {
  validateEmail,
  validateAge,
  validateRequired
} from '../utils/validation'

export const useValidation = (
  validationErrors: { [key: string]: string },
  setValidationErrors: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >
) => {
  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<FileData>
    ): MRT_ColumnDef<FileData>['muiTableBodyCellEditTextFieldProps'] => ({
      error: !!validationErrors[cell.id],
      helperText: validationErrors[cell.id],
      onBlur: (event) => {
        const value = event.target.value
        let isValid = true

        switch (cell.column.id) {
          case 'email':
            isValid = validateEmail(value)
            break
          case 'age':
            isValid = validateAge(Number(value))
            break
          default:
            isValid = validateRequired(value)
            break
        }

        if (!isValid) {
          setValidationErrors((prev) => ({
            ...prev,
            [cell.id]: `${cell.column.columnDef.header} es requerido`
          }))
        } else {
          setValidationErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors[cell.id]
            return newErrors
          })
        }
      }
    }),
    [validationErrors, setValidationErrors]
  )

  return { getCommonEditTextFieldProps }
}
