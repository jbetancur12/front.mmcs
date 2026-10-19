import { useMemo, useState } from 'react'

import { Role, UserFormField, UserFormValues } from './types'
import {
  validateEmail,
  validateName,
  validatePhone,
  validateRoles
} from './userValidation'

/**
 * Estado y validación compartidos por los diálogos de crear y editar usuario.
 */
export const useUserForm = <T extends UserFormValues>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const handleFieldChange = (
    fieldName: UserFormField,
    value: string | Role[]
  ) => {
    const nextValues = {
      ...values,
      [fieldName]: value
    }

    setValues((prev) => ({
      ...prev,
      [fieldName]: value
    }))

    setTouched((prev) => ({
      ...prev,
      [fieldName]: true
    }))

    setHasUnsavedChanges(true)

    // Validate field immediately
    let error = ''
    switch (fieldName) {
      case 'nombre':
        error = validateName(value as string)
        break
      case 'email':
        error = validateEmail(value as string)
        break
      case 'phone':
        error = validatePhone(value as string, nextValues.roles)
        break
      case 'roles':
        error = validateRoles(value as Role[])
        break
    }

    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
      phone:
        fieldName === 'phone'
          ? error
          : validatePhone(nextValues.phone || '', nextValues.roles || [])
    }))
  }

  const markTouched = (fieldName: UserFormField) =>
    setTouched((prev) => ({ ...prev, [fieldName]: true }))

  const isFormValid = useMemo(() => {
    const nameError = validateName(values.nombre || '')
    const emailError = validateEmail(values.email || '')
    const phoneError = validatePhone(values.phone || '', values.roles || [])
    const rolesError = validateRoles(values.roles || [])

    return !nameError && !emailError && !phoneError && !rolesError
  }, [values.nombre, values.email, values.phone, values.roles])

  // Mark all fields as touched to show validation errors
  const touchAll = () =>
    setTouched({
      nombre: true,
      email: true,
      phone: true,
      roles: true
    })

  const resetState = () => {
    setErrors({})
    setTouched({})
    setHasUnsavedChanges(false)
  }

  const hasErrors =
    Object.keys(errors).some((key) => errors[key]) &&
    Object.keys(touched).length > 0

  return {
    values,
    setValues,
    errors,
    touched,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleFieldChange,
    markTouched,
    isFormValid,
    touchAll,
    resetState,
    hasErrors
  }
}

export type UserForm = ReturnType<typeof useUserForm>
