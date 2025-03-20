// components/DeviceGraphs/GraphDrawer/parts/RangeSelector.tsx
import { Button, Box } from '@mui/material'
import { RangeOption } from '../types'

interface RangeSelectorProps {
  selectedRange: RangeOption
  onSelect: (range: RangeOption) => void
  options: RangeOption[]
}

export const RangeSelector = ({
  selectedRange,
  onSelect,
  options
}: RangeSelectorProps) => (
  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
    {options.map((rangeOption) => (
      <Button
        key={rangeOption.label}
        variant={
          rangeOption.label === selectedRange.label ? 'contained' : 'outlined'
        }
        onClick={() => onSelect(rangeOption)}
      >
        {rangeOption.label}
      </Button>
    ))}
  </Box>
)
