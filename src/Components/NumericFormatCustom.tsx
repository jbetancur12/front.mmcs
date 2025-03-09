import { NumericFormat, NumericFormatProps } from 'react-number-format'
import { IMaskInput } from 'react-imask'

import * as React from 'react'
interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void
  name: string
}

export const TextMaskCustom = React.forwardRef<HTMLInputElement, CustomProps>(
  function TextMaskCustom(props, ref) {
    const { onChange, ...other } = props

    return (
      <IMaskInput
        {...other}
        // mask="(#00) 000-0000"
        // definitions={{
        //   "#": /[1-9]/,
        // }}
        inputRef={ref}
        onAccept={(value: any) =>
          onChange({ target: { name: props.name, value } })
        }
        overwrite
      />
    )
  }
)

export const NumericFormatCustom = React.forwardRef<
  NumericFormatProps,
  CustomProps
>(function NumericFormatCustom(props, ref) {
  const { onChange, ...other } = props

  return (
    <NumericFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => {
        onChange?.({
          target: {
            name: props.name,
            value: values.value
          }
        })
      }}
      thousandSeparator='.'
      decimalSeparator=','
      valueIsNumericString
      suffix={props.name?.includes('Ratio') ? '%' : ''} // Agregar sufijo %
    />
  )
})
