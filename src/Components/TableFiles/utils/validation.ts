export const validateRequired = (value: string) => !!value.length

export const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const validateAge = (age: number) => age >= 18 && age <= 100

export const validateDate = (date: Date) => !isNaN(date.getTime())
