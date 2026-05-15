export const getGaugeConfig = (deviceConfigs: any[], sensorType: string) => {
  const config = deviceConfigs?.find((c) => c.sensorType === sensorType)
  if (!config) return null

  // Función para procesar los umbrales
  const processThresholds = (thresholds: any[]) => {
    return thresholds
      .filter((t: any) => t.enabled)
      .map((t: any) => ({
        type: t.type,
        enabled: t.enabled,
        min:
          t.type === 'BELOW'
            ? undefined
            : parseFloat(t.min || config.absoluteMin),
        max:
          t.type === 'ABOVE'
            ? undefined
            : parseFloat(t.max || config.absoluteMax)
      }))
  }

  return {
    absoluteMin: parseFloat(config.absoluteMin),
    absoluteMax: parseFloat(config.absoluteMax),
    okMin: parseFloat(config.okMin),
    okMax: parseFloat(config.okMax),
    alarmThresholds: processThresholds(config.alarmThresholds),
    warningThresholds: processThresholds(config.warningThresholds),
    sensorType: config.sensorType
  }
}

export const calculateRanges = (config: any) => {
  if (!config) return { okRange: [0, 0], warningRange: [], alarmRange: [] }

  // Rango OK (verde)
  const okRange = [config.okMin, config.okMax]

  // Alarmas (rojo)
  const alarmRanges = config.alarms.map((alarm: any) => {
    return alarm.type === 'BELOW'
      ? [config.absoluteMin, alarm.value, config.absoluteMin, alarm.value]
      : [alarm.value, config.absoluteMax, alarm.value, config.absoluteMax]
  })

  return {
    okRange,
    alarmRange: alarmRanges.flat()
  }
}
