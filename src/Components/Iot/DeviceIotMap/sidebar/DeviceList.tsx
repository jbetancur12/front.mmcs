import {
  FixedSizeList as VirtualList,
  ListChildComponentProps
} from 'react-window'
import { DeviceIot } from '../../types'
import DeviceListItem from './DeviceListItem'
import { Box } from '@mui/material'

type Props = {
  devices: DeviceIot[]
  onSelectDevice: (device: DeviceIot) => void
  onViewDetails: (device: DeviceIot) => void
}

export const DeviceList = ({
  devices,
  onSelectDevice,
  onViewDetails
}: Props) => {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const device = devices[index]
    return (
      <Box style={style} key={device.id}>
        <DeviceListItem
          device={device}
          onSelect={onSelectDevice}
          onViewDetails={onViewDetails}
        />
      </Box>
    )
  }

  return (
    <VirtualList
      height={600}
      width='100%'
      itemCount={devices.length}
      itemSize={150} // Ajusta según la altura de cada ítem
    >
      {Row}
    </VirtualList>
  )
}
