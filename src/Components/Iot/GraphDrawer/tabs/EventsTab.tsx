// components/DeviceGraphs/GraphDrawer/tabs/EventsTab.tsx

import EventHistory from 'src/Components/Iot/EventHistory'

interface EventsTabProps {
  deviceId: string
}

export const EventsTab = ({ deviceId }: EventsTabProps) => (
  <EventHistory deviceId={deviceId} />
)
