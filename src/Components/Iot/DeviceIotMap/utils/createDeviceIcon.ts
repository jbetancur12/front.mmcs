// components/DeviceIotMap/utils/createDeviceIcon.ts
import L from 'leaflet'

const createSvgIcon = (color: string, isInAlarm: boolean) => {
  const alarmDot = isInAlarm
    ? `<circle cx="12.5" cy="12.5" r="5" fill="#FF0000" class="alarm-dot"/>`
    : ''

  const svg = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.59644 0 0 5.59644 0 12.5C0 22.5 12.5 41 12.5 41C12.5 41 25 22.5 25 12.5C25 5.59644 19.4036 0 12.5 0Z" fill="currentColor"/>
      ${alarmDot}
    </svg>
  `

  return L.divIcon({
    className: `custom-marker-icon ${isInAlarm ? 'blinking' : ''}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    html: `<div style="color: ${color}; position: relative;">${svg}</div>`
  })
}

export const createDeviceIcon = (
  powerSource: 'main' | 'bat',
  isOnline: boolean,
  isInAlarm: boolean // Nuevo parámetro
) => {
  if (!isOnline) return createSvgIcon('#9E9E9E', false)

  if (isInAlarm) return createSvgIcon('#FF0000', true) // Prioridad a la alarma

  const colorMap = {
    main: '#4CAF50',
    bat: '#2196F3'
  }

  return createSvgIcon(colorMap[powerSource], false)
}
