import type { CSSObjectWithLabel, StylesConfig } from 'react-select'

export {
  limitArraySize,
  limitArraySizeDevice,
  limitArraySizeCustomer
} from '../TableFiles/utils/limitArraySizes'

/** Estilos compartidos de los selectores con búsqueda. */
export const styles = (error: boolean): StylesConfig => ({
  container: (provided) =>
    ({
      ...provided,
      width: '100%',
      marginRight: 10,
      height: 50
    }) as CSSObjectWithLabel,
  control: (provided) =>
    ({
      ...provided,
      border: error ? '1px solid #ccc' : '2px solid #d32f2f',
      borderRadius: 5,
      height: 55
    }) as CSSObjectWithLabel,
  option: (provided, state) =>
    ({
      ...provided,
      color: state.isSelected ? 'white' : 'black',
      backgroundColor: state.isSelected ? 'blue' : 'white'
    }) as CSSObjectWithLabel,
  menu: (provided) => ({ ...provided }) as CSSObjectWithLabel,
  placeholder: (provided) =>
    ({ ...provided, color: error ? 'gray' : '#d32f2f' }) as CSSObjectWithLabel
})
