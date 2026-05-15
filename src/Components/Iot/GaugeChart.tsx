import React from 'react'
import { RadialBarChart, RadialBar } from 'recharts'

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
  width?: number
  height?: number
}

const SingleArcGauge: React.FC<SingleArcGaugeProps> = ({
  value,
  config,
  width = 400,
  height = 250
}) => {
  const generateGradientStops = () => {
    const {
      absoluteMin,
      absoluteMax,
      okMin,
      okMax,
      alarmThresholds,
      warningThresholds
    } = config

    const totalRange = absoluteMax - absoluteMin
    const stops: { offset: number; color: string }[] = []

    // Función para agregar segmentos de color
    const addSegment = (start: number, end: number, color: string) => {
      stops.push(
        { offset: ((start - absoluteMin) / totalRange) * 100, color },
        { offset: ((end - absoluteMin) / totalRange) * 100, color }
      )
    }

    // Procesar alarmas (rojo)
    alarmThresholds.forEach((t) => {
      if (t.enabled) {
        if (t.type === 'BELOW' && t.max)
          addSegment(absoluteMin, t.max, '#F44336')
        if (t.type === 'ABOVE' && t.min)
          addSegment(t.min, absoluteMax, '#F44336')
      }
    })

    // Procesar advertencias (naranja)
    warningThresholds.forEach((t) => {
      if (t.enabled) {
        if (t.type === 'BELOW' && t.max)
          addSegment(absoluteMin, t.max, '#FF9800')
        if (t.type === 'ABOVE' && t.min)
          addSegment(t.min, absoluteMax, '#FF9800')
      }
    })

    // Rango OK (verde)
    addSegment(okMin, okMax, '#4CAF50')

    // Ordenar y eliminar duplicados
    return stops
      .sort((a, b) => a.offset - b.offset)
      .filter(
        (stop, index, self) =>
          index === self.findIndex((s) => s.offset === stop.offset)
      )
  }

  // Configuración del gráfico
  const totalRange = config.absoluteMax - config.absoluteMin
  const gradientStops = generateGradientStops()

  // Cálculo de la aguja
  const fraction = (value - config.absoluteMin) / totalRange
  const pointerAngle = 180 - fraction * 180
  const cx = width / 2
  const cy = height * 0.8
  const pointerLength = Math.min(width, height) / 2.3
  const rad = (pointerAngle * Math.PI) / 180
  const x2 = cx + pointerLength * Math.cos(rad)
  const y2 = cy - pointerLength * Math.sin(rad)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <RadialBarChart
        width={width}
        height={height}
        cx={cx}
        cy={cy}
        innerRadius='80%'
        outerRadius='100%'
        barSize={20}
        data={[{ value: totalRange }]}
        startAngle={180}
        endAngle={0}
      >
        <defs>
          <linearGradient id='customGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
            {gradientStops.map((stop, i) => (
              <stop key={i} offset={`${stop.offset}%`} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>
        <RadialBar
          dataKey='value'
          fill='url(#customGradient)'
          background={false}
          cornerRadius={0}
        />
      </RadialBarChart>

      {/* Aguja y etiquetas */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        width={width}
        height={height}
      >
        <line
          x1={cx}
          y1={cy}
          x2={x2}
          y2={y2}
          stroke='black'
          strokeWidth={3}
          strokeLinecap='round'
        />
        <circle cx={cx} cy={cy} r={5} fill='black' />
      </svg>

      {/* Valor central */}
      <div
        style={{
          position: 'absolute',
          top: `${cy - 60}px`,
          left: `${cx}px`,
          transform: 'translateX(-50%)',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          textAlign: 'center'
        }}
      >
        <div>{value}</div>
        <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
          {config.sensorType === 'TEMPERATURA'
            ? '°C'
            : config.sensorType === 'HUMEDAD'
              ? '%'
              : config.sensorType === 'PRESION'
                ? 'hPa'
                : ''}
        </div>
      </div>
    </div>
  )
}

export default SingleArcGauge

// const SingleArcGauge: React.FC<SingleArcGaugeProps> = ({
//   value,
//   config,
//   width = 400,
//   height = 250
// }) => {
//   // 1. Generar rangos dinámicamente
//   const generateRanges = () => {
//     const ranges: Array<{ start: number; end: number; color: string }> = []
//     const {
//       absoluteMin,
//       absoluteMax,
//       okMin,
//       okMax,
//       alarmThresholds,
//       warningThresholds
//     } = config

//     // Procesar alarmas (rojo)
//     alarmThresholds.forEach((threshold) => {
//       if (!threshold.enabled) return

//       if (threshold.type === 'BELOW' && threshold.max !== undefined) {
//         ranges.push({
//           start: absoluteMin,
//           end: threshold.max,
//           color: '#F44336'
//         })
//       }

//       if (threshold.type === 'ABOVE' && threshold.min !== undefined) {
//         ranges.push({
//           start: threshold.min,
//           end: absoluteMax,
//           color: '#F44336'
//         })
//       }

//       if (
//         threshold.type === 'RANGE' &&
//         threshold.min !== undefined &&
//         threshold.max !== undefined
//       ) {
//         ranges.push({
//           start: threshold.min,
//           end: threshold.max,
//           color: '#F44336'
//         })
//       }
//     })

//     // Procesar advertencias (amarillo)
//     warningThresholds.forEach((threshold) => {
//       if (!threshold.enabled) return

//       if (threshold.type === 'BELOW' && threshold.max !== undefined) {
//         ranges.push({
//           start: absoluteMin,
//           end: threshold.max,
//           color: '#FFC107'
//         })
//       }

//       if (threshold.type === 'ABOVE' && threshold.min !== undefined) {
//         ranges.push({
//           start: threshold.min,
//           end: absoluteMax,
//           color: '#FFC107'
//         })
//       }

//       if (
//         threshold.type === 'RANGE' &&
//         threshold.min !== undefined &&
//         threshold.max !== undefined
//       ) {
//         ranges.push({
//           start: threshold.min,
//           end: threshold.max,
//           color: '#FFC107'
//         })
//       }
//     })

//     // Agregar rango OK (verde) al final para prioridad visual
//     ranges.push({
//       start: okMin,
//       end: okMax,
//       color: '#4CAF50'
//     })

//     return ranges.sort((a, b) => a.start - b.start)
//   }

//   // 2. Configuración derivada
//   const totalRange = config.absoluteMax - config.absoluteMin
//   const subRanges = generateRanges()

//   // 3. Preparar gradiente
//   const gradientStops = subRanges.flatMap(({ start, end, color }) => [
//     { offset: ((start - config.absoluteMin) / totalRange) * 100, color },
//     { offset: ((end - config.absoluteMin) / totalRange) * 100, color }
//   ])

//   // 4. Calcular ángulo de la aguja
//   const fraction = (value - config.absoluteMin) / totalRange
//   const pointerAngle = 180 - fraction * 180

//   // 5. Configuración visual
//   const cx = width / 2
//   const cy = height * 0.8
//   const pointerLength = Math.min(width, height) / 2.3
//   const rad = (pointerAngle * Math.PI) / 180
//   const x2 = cx + pointerLength * Math.cos(rad)
//   const y2 = cy - pointerLength * Math.sin(rad)

//   // 6. Generar límites para etiquetas
//   const boundaries = Array.from(
//     new Set([
//       config.absoluteMin,
//       ...subRanges.flatMap((r) => [r.start, r.end]),
//       config.absoluteMax
//     ])
//   ).sort((a, b) => a - b)

//   return (
//     <div style={{ position: 'relative', width, height }}>
//       <RadialBarChart
//         width={width}
//         height={height}
//         cx={cx}
//         cy={cy}
//         innerRadius='80%'
//         outerRadius='100%'
//         barSize={20}
//         data={[{ value: totalRange }]}
//         startAngle={180}
//         endAngle={0}
//       >
//         <defs>
//           <linearGradient id='rangeGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
//             {gradientStops.map((stop, idx) => (
//               <stop
//                 key={idx}
//                 offset={`${stop.offset}%`}
//                 stopColor={stop.color}
//               />
//             ))}
//           </linearGradient>
//         </defs>
//         <PolarAngleAxis type='number' domain={[0, totalRange]} tick={false} />
//         <RadialBar
//           dataKey='value'
//           fill='url(#rangeGradient)'
//           background={false}
//           cornerRadius={0}
//         />
//       </RadialBarChart>

//       {/* Aguja y etiquetas */}
//       <svg
//         style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
//         width={width}
//         height={height}
//       >
//         <line
//           x1={cx}
//           y1={cy}
//           x2={x2}
//           y2={y2}
//           stroke='black'
//           strokeWidth={3}
//           strokeLinecap='round'
//         />
//         <circle cx={cx} cy={cy} r={5} fill='black' />

//         {boundaries.map((b, idx) => {
//           const angle = 180 - ((b - config.absoluteMin) / totalRange) * 180
//           const radLabel = (angle * Math.PI) / 180
//           const labelRadius = pointerLength + 20
//           const xLabel = cx + labelRadius * Math.cos(radLabel)
//           const yLabel = cy - labelRadius * Math.sin(radLabel)

//           return (
//             <text
//               key={idx}
//               x={xLabel}
//               y={yLabel}
//               textAnchor='middle'
//               dominantBaseline='middle'
//               fontSize={12}
//               fill='#000'
//             >
//               {b}
//             </text>
//           )
//         })}
//       </svg>

//       {/* Valor central */}
//       <div
//         style={{
//           position: 'absolute',
//           top: `${cy - 60}px`,
//           left: `${cx}px`,
//           transform: 'translateX(-50%)',
//           fontSize: '1.2rem',
//           fontWeight: 'bold',
//           textAlign: 'center'
//         }}
//       >
//         <div>{value}</div>
//         <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
//           {config.sensorType === 'TEMPERATURA'
//             ? '°C'
//             : config.sensorType === 'HUMEDAD'
//               ? '%'
//               : config.sensorType === 'PRESION'
//                 ? 'hPa'
//                 : ''}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default SingleArcGauge

// import React from 'react'
// import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'

// type SingleArcGaugeProps = {
//   value: number
//   min: number
//   max: number
//   okRange: [number, number] // ej: [0, 5]
//   warningRange: [number, number, number, number] // ej: [-2, 0, 5, 7]
//   alarmRange: [number, number, number, number] // ej: [-15, -2, 7, 15]
//   width?: number
//   height?: number
// }

// const SingleArcGauge: React.FC<SingleArcGaugeProps> = ({
//   value,
//   min,
//   max,
//   okRange,
//   warningRange,
//   alarmRange,
//   width = 400,
//   height = 250
// }) => {
//   // 1) Rango total
//   const totalRange = max - min

//   // 2) Definimos los sub-rangos para el gradiente
//   const subRanges = [
//     { start: alarmRange[0], end: warningRange[0], color: '#F44336' },
//     { start: warningRange[0], end: warningRange[1], color: '#FFC107' },
//     { start: okRange[0], end: okRange[1], color: '#4CAF50' },
//     { start: warningRange[2], end: warningRange[3], color: '#FFC107' },
//     { start: alarmRange[2], end: alarmRange[3], color: '#F44336' }
//   ]

//   // 3) Creamos los stops del gradiente
//   const gradientStops: Array<{ offset: number; color: string }> = []
//   subRanges.forEach(({ start, end, color }) => {
//     const offsetStart = ((start - min) / totalRange) * 100
//     const offsetEnd = ((end - min) / totalRange) * 100
//     gradientStops.push({ offset: offsetStart, color })
//     gradientStops.push({ offset: offsetEnd, color })
//   })

//   // 4) Data para un solo arco
//   const chartData = [{ name: 'FullArc', value: totalRange }]

//   // 5) Cálculo del ángulo de la aguja
//   const fraction = (value - min) / (max - min)
//   const pointerAngle = 180 - fraction * 180

//   // 6) Centro y longitud de la aguja
//   const cx = width / 2
//   const cy = height * 0.8
//   const pointerLength = Math.min(width, height) / 2.3 // Ajusta este divisor para acortar la aguja
//   const rad = (pointerAngle * Math.PI) / 180
//   const x2 = cx + pointerLength * Math.cos(rad)
//   const y2 = cy - pointerLength * Math.sin(rad)

//   // 7) Límites a mostrar (para los colores)
//   // En este ejemplo se muestran: min, warningRange[0], warningRange[1], okRange[1], warningRange[3] y max
//   const boundaries = [
//     min,
//     warningRange[0],
//     warningRange[1],
//     okRange[1],
//     warningRange[3],
//     max
//   ]

//   // Distancia para posicionar las etiquetas (puedes ajustar este valor)
//   const labelRadius = pointerLength + 20

//   return (
//     <div style={{ position: 'relative', width, height }}>
//       <RadialBarChart
//         width={width}
//         height={height}
//         cx={cx}
//         cy={cy}
//         innerRadius='80%'
//         outerRadius='100%'
//         barSize={20}
//         data={chartData}
//         startAngle={180}
//         endAngle={0}
//       >
//         <defs>
//           <linearGradient id='rangeGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
//             {gradientStops.map((stop, idx) => (
//               <stop
//                 key={idx}
//                 offset={`${stop.offset}%`}
//                 stopColor={stop.color}
//               />
//             ))}
//           </linearGradient>
//         </defs>
//         <PolarAngleAxis
//           type='number'
//           domain={[0, totalRange]}
//           angleAxisId={0}
//           tick={false}
//         />
//         <RadialBar
//           dataKey='value'
//           fill='url(#rangeGradient)'
//           background={false}
//           cornerRadius={0}
//         />
//       </RadialBarChart>

//       {/* Aguja (indicador) */}
//       <svg
//         style={{
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           pointerEvents: 'none'
//         }}
//         width={width}
//         height={height}
//       >
//         {/* Línea de la aguja */}
//         <line
//           x1={cx}
//           y1={cy}
//           x2={x2}
//           y2={y2}
//           stroke='black'
//           strokeWidth={3}
//           strokeLinecap='round'
//         />
//         {/* Centro del gauge */}
//         <circle cx={cx} cy={cy} r={5} fill='black' />

//         {/* Etiquetas para los límites de color */}
//         {boundaries.map((b, idx) => {
//           const angle = 180 - ((b - min) / totalRange) * 180
//           const radLabel = (angle * Math.PI) / 180
//           const xLabel = cx + labelRadius * Math.cos(radLabel)
//           const yLabel = cy - labelRadius * Math.sin(radLabel)
//           return (
//             <text
//               key={idx}
//               x={xLabel}
//               y={yLabel}
//               textAnchor='middle'
//               dominantBaseline='middle'
//               fontSize={12}
//               fill='#000'
//             >
//               {b}°
//             </text>
//           )
//         })}
//       </svg>

//       {/* Valor numérico en el centro */}
//       <div
//         style={{
//           position: 'absolute',
//           top: `${cy - 60}px`,
//           left: `${cx}px`,
//           transform: 'translateX(-50%)',
//           fontSize: '1.2rem',
//           fontWeight: 'bold'
//         }}
//       >
//         {value}°
//       </div>
//     </div>
//   )
// }

// export default SingleArcGauge
