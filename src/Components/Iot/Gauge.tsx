// SingleArcGauge.tsx
import { useEffect, useRef, useState } from 'react'
import { GaugeComponent } from 'react-gauge-component'

type AlarmThreshold = {
  type: 'BELOW' | 'ABOVE'
  enabled: boolean
  min?: number
  max?: number
}

type SingleArcGaugeProps = {
  value: number
  config: {
    absoluteMin: number
    absoluteMax: number
    okMin: number
    okMax: number
    alarmThresholds: AlarmThreshold[]
    warningThresholds: AlarmThreshold[]
    sensorType: 'TEMPERATURA' | 'HUMEDAD' | 'PRESION' | 'OTRO'
  }
}

const SingleArcGauge: React.FC<SingleArcGaugeProps> = ({ value, config }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const generateSubArcs = () => {
    const {
      absoluteMin,
      absoluteMax,
      okMin,
      okMax,
      alarmThresholds,
      warningThresholds
    } = config

    const criticalPoints = new Set<number>([
      absoluteMin,
      absoluteMax,
      okMin,
      okMax
    ])

    alarmThresholds.forEach((t) => {
      if (t.enabled) {
        if (t.type === 'BELOW' && t.max) criticalPoints.add(t.max)
        if (t.type === 'ABOVE' && t.min) criticalPoints.add(t.min)
      }
    })

    warningThresholds.forEach((t) => {
      if (t.enabled) {
        if (t.type === 'BELOW' && t.max) criticalPoints.add(t.max)
        if (t.type === 'ABOVE' && t.min) criticalPoints.add(t.min)
      }
    })

    const sortedPoints = Array.from(criticalPoints).sort((a, b) => a - b)
    const subArcs: Array<{
      limit: number
      color: string
      tooltip: { text: string }
    }> = []

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const start = sortedPoints[i]
      const end = sortedPoints[i + 1]

      let color = '#4CAF50'
      let status = 'Normal'

      if (
        alarmThresholds.some(
          (t) =>
            (t.type === 'BELOW' && end <= (t.max ?? Infinity)) ||
            (t.type === 'ABOVE' && start >= (t.min ?? -Infinity))
        )
      ) {
        color = '#F44336'
        status = end <= config.okMin ? 'Muy bajo' : 'Muy alto'
      } else if (
        warningThresholds.some(
          (t) =>
            (t.type === 'BELOW' && end <= (t.max ?? Infinity)) ||
            (t.type === 'ABOVE' && start >= (t.min ?? -Infinity))
        )
      ) {
        color = '#FF9800'
        status = end <= config.okMin ? 'Bajo' : 'Alto'
      }

      subArcs.push({
        limit: end,
        color,
        tooltip: {
          text: `${status}: ${start}${getUnit()} - ${end}${getUnit()}`
        }
      })
    }

    return subArcs
  }

  const getUnit = () => {
    switch (config.sensorType) {
      case 'TEMPERATURA':
        return '°C'
      case 'HUMEDAD':
        return '%'
      case 'PRESION':
        return 'hPa'
      default:
        return ''
    }
  }

  if (!mounted) return null

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minWidth: 300,
        minHeight: 200,
        position: 'relative'
      }}
    >
      <GaugeComponent
        type='semicircle'
        arc={{
          width: 0.2,
          padding: 0,
          cornerRadius: 1,
          subArcs: generateSubArcs()
        }}
        pointer={{
          color: '#2A2A2A',
          length: 0.8,
          width: 15,
          elastic: false
        }}
        labels={{
          valueLabel: {
            formatTextValue: (value) => `${value}${getUnit()}`,
            style: {
              fontSize: '24px',
              fontWeight: 'bold',
              fill: '#333'
            }
          },
          tickLabels: {
            type: 'outer',
            defaultTickValueConfig: {
              formatTextValue: (value) => `${value}${getUnit()}`,
              style: {
                fontSize: '12px',
                fill: '#666'
              }
            }
          }
        }}
        value={value}
        minValue={config.absoluteMin}
        maxValue={config.absoluteMax}
      />
    </div>
  )
}
//

export default SingleArcGauge
