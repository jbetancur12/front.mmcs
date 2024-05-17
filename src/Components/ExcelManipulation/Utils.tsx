import XlsxPopulate from 'xlsx-populate'
import { RepositoryData, ResourceOption } from './Types'
import { api } from '../../config'
import axios from 'axios'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { certificateTypeStore } from '../../store/certificateTypeStore'
import { deviceStore } from '../../store/deviceStore'
import { customerStore } from '../../store/customerStore'

export const apiUrl = api()

export const limitArraySize = (arra: any, newItem: any) => {
  // Verificar si el nuevo item ya existe en el array
  const isDuplicate = arra.some(
    (item: any) => item.value === newItem.value && item.label === newItem.label
  )

  let arr
  if (!isDuplicate) {
    if (arra.length < 2) {
      arr = [...arra, newItem]
    } else {
      arr = [...arra.slice(1), newItem]
    }
  } else {
    arr = arra // No se agrega el nuevo elemento si ya existe
  }

  certificateTypeStore.set(arr)
}

export const limitArraySizeDevice = (arra: any, newItem: any) => {
  // Verificar si el nuevo item ya existe en el array
  const isDuplicate = arra.some(
    (item: any) => item.value === newItem.value && item.label === newItem.label
  )

  let arr
  if (!isDuplicate) {
    if (arra.length < 2) {
      arr = [...arra, newItem]
    } else {
      arr = [...arra.slice(1), newItem]
    }
  } else {
    arr = arra // No se agrega el nuevo elemento si ya existe
  }

  deviceStore.set(arr)
}

export const limitArraySizeCustomer = (arra: any, newItem: any) => {
  // Verificar si el nuevo item ya existe en el array
  const isDuplicate = arra.some(
    (item: any) => item.value === newItem.value && item.label === newItem.label
  )

  let arr
  if (!isDuplicate) {
    if (arra.length < 2) {
      arr = [...arra, newItem]
    } else {
      arr = [...arra.slice(1), newItem]
    }
  } else {
    arr = arra // No se agrega el nuevo elemento si ya existe
  }

  customerStore.set(arr)
}

export const decimalPlaces = (num: number) => {
  const decimalPart = num.toString().split('.')[1]
  return decimalPart ? decimalPart.length : 0
}

export const numberFormat = (value: number) =>
  decimalPlaces(value) > 0 ? '0.' + '0'.repeat(decimalPlaces(value)) : '0'

export const populateCell = (
  sheet: XlsxPopulate.Sheet,
  cell: string,
  value: number | string | undefined,
  isNumberFormat: boolean,
  referenceNumber: number
) => {
  sheet.cell(cell).value(value)
  if (isNumberFormat && typeof value === 'number') {
    console.log('Format', numberFormat(referenceNumber))
    sheet.cell(cell).style('numberFormat', numberFormat(referenceNumber))
  }
}

export const mask = (num: number) =>
  decimalPlaces(num) > 0
    ? '0[00000].' + '0'.repeat(decimalPlaces(num))
    : '0[00000]'

export const loadOptions = async (
  inputValue: string,
  resource: string,
  mapFunction: (item: any) => ResourceOption
): Promise<ResourceOption[]> => {
  return new Promise((resolve, reject) => {
    let timer
    const endpoint = `${apiUrl}/${resource}` // Construye la URL del endpoint
    const fetchData = async () => {
      try {
        const response = await axios.get(endpoint, {
          params: { q: inputValue },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
        const data = response.data
        const options = data.map((item: any) => mapFunction(item))

        resolve(options) // Aplica la función de mapeo
      } catch (error) {
        console.error('Error al cargar opciones:', error)
        reject(error)
      }
    }
    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(fetchData, 1000) // Establecer el debounce en 1000ms
  })
}

export const validarCamposLlenos = (formData: any) => {
  let camposValidos = true

  for (const key in formData) {
    if (
      formData[key] === '' ||
      formData[key] === null ||
      formData[key] == '(0 - 0)'
    ) {
      camposValidos = false
    }
  }

  return camposValidos
}

export const initialFormData = {
  decimalPlaces: 1,
  city: '',
  location: 'Bodega',
  inventory: '123456',
  sede: 'Principal',
  activoFijo: '123456',
  serie: 'sx1236',
  brand: 'C4',
  model: 'Explosive',
  maxWeight: '0.0',
  name: 'CC-MMCS-',
  calibrationDate: new Date().toISOString().split('T')[0],
  receptionDate: new Date().toISOString().split('T')[0],
  verificationDate: new Date().toISOString().split('T')[0],
  measurementOperation: '0-0',
  measurementRange: '0-0',
  department: '',
  address: '',
  exactitudValue: 0,
  exactitudUnitValue: 0,
  decimalPlacesPatron: 0.05,
  exactitudPatron: 0,
  exactitudUnitPatron: 0,
  initialTemperature: '',
  initialHumidity: '',
  finalTemperature: '',
  finalHumidity: '',
  unit: '',
  device: null as ResourceOption | null,
  format: null as RepositoryData | null,
  customer: null as ResourceOption | null,
  magnitude: '',
  typeOfCertificate: {
    value: '3',
    label: 'Calibración'
  }
}

export const initialRows = [
  {
    id: 1,
    point: 50,
    first: 0,
    second: 0,
    third: 0,
    fourth: 0,
    fifth: 0,
    sixth: 0,
    average: 0
  },
  {
    id: 2,
    point: 50,
    first: 0,
    second: 0,
    third: 0,
    fourth: 0,
    fifth: 0,
    sixth: 0,
    average: 0
  },
  {
    id: 3,
    point: 50,
    first: 0,
    second: 0,
    third: 0,
    fourth: 0,
    fifth: 0,
    sixth: 0,
    average: 0
  }
]

export const styles = (error: boolean) => {
  return {
    container: (provided: any) => ({
      ...provided,
      width: '100%',
      marginRight: 10,
      height: 50
    }),
    control: (provided: any) => ({
      ...provided,
      border: error ? '1px solid #ccc' : '2px solid #d32f2f',
      borderRadius: 5,
      height: 55
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      color: state.isSelected ? 'white' : 'black',
      backgroundColor: state.isSelected ? 'blue' : 'white'
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 1000
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: error ? 'gray' : '#d32f2f'
    })
  }
}

export const MySwal = withReactContent(Swal)

export const Toast = MySwal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer
    toast.onmouseleave = Swal.resumeTimer
  }
})

export const bigToast = (
  title: string,
  icon: 'success' | 'error' | 'question' | 'warning' | 'info'
) =>
  MySwal.fire({
    icon,
    title,
    timer: 1500,
    showConfirmButton: false,
    timerProgressBar: true
  })
