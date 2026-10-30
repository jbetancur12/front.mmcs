import { notify } from 'src/utils/notify'

import { Certificate, CustomerProfileData, CustomerStats } from './types'

import { logger } from 'src/utils/logger'
// Función para exportar a Excel
export const exportToExcel = async (
  data: Certificate[],
  customerName: string = ''
) => {
  if (data.length === 0) {
    notify.info('No hay datos para exportar')
    return
  }

  const XLSX = await import('xlsx')

  const excelData = data.map((cert) => ({
    Sede: cert.headquarter || '',
    'Nombre del Equipo': cert.device?.name || '',
    'Activo Fijo': cert.activoFijo || '',
    Serie: cert.serie || '',
    Ubicación: cert.location || '',
    'Fecha de Calibración': cert.calibrationDate
      ? new Date(cert.calibrationDate).toLocaleDateString('es-ES')
      : '',
    'Próxima Calibración': cert.nextCalibrationDate
      ? new Date(cert.nextCalibrationDate).toLocaleDateString('es-ES')
      : ''
  }))

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(excelData)

  const columnWidths = [
    { wch: 20 },
    { wch: 35 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 18 },
    { wch: 20 }
  ]
  worksheet['!cols'] = columnWidths

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario Equipos')

  const fileName = `inventario_equipos_${customerName || 'cliente'}_${new Date().toISOString().split('T')[0]}.xlsx`

  try {
    XLSX.writeFile(workbook, fileName)
    notify.success('Archivo Excel descargado exitosamente')
  } catch (error) {
    logger.error('Error al generar archivo Excel:', error)
    notify.error('Error al generar el archivo Excel')
  }
}

// Función para exportar reporte completo del cliente (Overview)
export const exportOverviewReport = async (
  customerData: CustomerProfileData,
  allEquipment: Certificate[],
  stats: CustomerStats
) => {
  if (!customerData) {
    notify.error('No hay datos del cliente para exportar')
    return
  }

  const XLSX = await import('xlsx')

  const workbook = XLSX.utils.book_new()
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // 1. Hoja de Información del Cliente
  const customerInfo = [
    ['REPORTE GENERAL DEL CLIENTE'],
    [''],
    ['Información del Cliente'],
    ['Nombre:', customerData.nombre],
    ['Email:', customerData.email],
    ['Teléfono:', customerData.telefono],
    [''],
    ['Sedes'],
    ...(customerData.sede?.map((sede) => ['', sede]) || []),
    [''],
    ['Estadísticas Generales'],
    ['Total de Equipos:', stats.total],
    ['Equipos Activos:', stats.active],
    ['Próximos a Vencer (30 días):', stats.upcoming],
    ['Equipos Vencidos:', stats.expired],
    [''],
    ['Fecha de Generación:', new Date().toLocaleDateString('es-ES')]
  ]

  const wsCustomer = XLSX.utils.aoa_to_sheet(customerInfo)
  wsCustomer['!cols'] = [{ wch: 30 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, wsCustomer, 'Resumen Cliente')

  // 2. Hoja de Equipos Vencidos
  const expiredEquipment = allEquipment.filter((cert) => {
    if (!cert.nextCalibrationDate) return false
    return new Date(cert.nextCalibrationDate) < now
  })

  if (expiredEquipment.length > 0) {
    const expiredData = expiredEquipment.map((cert) => ({
      Sede: cert.headquarter || '',
      'Nombre del Equipo': cert.device?.name || '',
      'Activo Fijo': cert.activoFijo || '',
      Serie: cert.serie || '',
      Ubicación: cert.location || '',
      'Última Calibración': cert.calibrationDate
        ? new Date(cert.calibrationDate).toLocaleDateString('es-ES')
        : '',
      'Fecha de Vencimiento': cert.nextCalibrationDate
        ? new Date(cert.nextCalibrationDate).toLocaleDateString('es-ES')
        : '',
      'Días Vencido': cert.nextCalibrationDate
        ? Math.floor(
            (now.getTime() - new Date(cert.nextCalibrationDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : ''
    }))

    const wsExpired = XLSX.utils.json_to_sheet(expiredData)
    wsExpired['!cols'] = [
      { wch: 20 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 }
    ]
    XLSX.utils.book_append_sheet(workbook, wsExpired, 'Equipos Vencidos')
  }

  // 3. Hoja de Equipos Próximos a Vencer
  const upcomingEquipment = allEquipment.filter((cert) => {
    if (!cert.nextCalibrationDate) return false
    const nextDate = new Date(cert.nextCalibrationDate)
    return nextDate >= now && nextDate <= thirtyDaysFromNow
  })

  if (upcomingEquipment.length > 0) {
    const upcomingData = upcomingEquipment.map((cert) => ({
      Sede: cert.headquarter || '',
      'Nombre del Equipo': cert.device?.name || '',
      'Activo Fijo': cert.activoFijo || '',
      Serie: cert.serie || '',
      Ubicación: cert.location || '',
      'Última Calibración': cert.calibrationDate
        ? new Date(cert.calibrationDate).toLocaleDateString('es-ES')
        : '',
      'Próxima Calibración': cert.nextCalibrationDate
        ? new Date(cert.nextCalibrationDate).toLocaleDateString('es-ES')
        : '',
      'Días Restantes': cert.nextCalibrationDate
        ? Math.floor(
            (new Date(cert.nextCalibrationDate).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : ''
    }))

    const wsUpcoming = XLSX.utils.json_to_sheet(upcomingData)
    wsUpcoming['!cols'] = [
      { wch: 20 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 }
    ]
    XLSX.utils.book_append_sheet(workbook, wsUpcoming, 'Próximos a Vencer')
  }

  // 4. Hoja de Todos los Equipos
  if (allEquipment.length > 0) {
    const allEquipmentData = allEquipment.map((cert) => {
      const getStatus = () => {
        if (!cert.nextCalibrationDate) return 'Sin fecha'
        const nextDate = new Date(cert.nextCalibrationDate)
        if (nextDate < now) return 'Vencido'
        if (nextDate <= thirtyDaysFromNow) return 'Próximo a vencer'
        return 'Activo'
      }

      return {
        Sede: cert.headquarter || '',
        'Nombre del Equipo': cert.device?.name || '',
        'Activo Fijo': cert.activoFijo || '',
        Serie: cert.serie || '',
        Ubicación: cert.location || '',
        'Última Calibración': cert.calibrationDate
          ? new Date(cert.calibrationDate).toLocaleDateString('es-ES')
          : '',
        'Próxima Calibración': cert.nextCalibrationDate
          ? new Date(cert.nextCalibrationDate).toLocaleDateString('es-ES')
          : '',
        Estado: getStatus()
      }
    })

    const wsAll = XLSX.utils.json_to_sheet(allEquipmentData)
    wsAll['!cols'] = [
      { wch: 20 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 18 },
      { wch: 20 },
      { wch: 15 }
    ]
    wsAll['!autofilter'] = { ref: wsAll['!ref'] || 'A1' }
    XLSX.utils.book_append_sheet(workbook, wsAll, 'Todos los Equipos')
  }

  // Configurar propiedades del archivo
  workbook.Props = {
    Title: `Reporte General - ${customerData.nombre}`,
    Subject: 'Reporte completo del cliente',
    Author: 'Sistema de Gestión MetroMedics',
    CreatedDate: new Date()
  }

  // Generar el archivo
  const fileName = `reporte_completo_${customerData.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`

  try {
    XLSX.writeFile(workbook, fileName)
    notify.success('Reporte completo descargado exitosamente')
  } catch (error) {
    logger.error('Error al generar reporte completo:', error)
    notify.error('Error al generar el reporte completo')
  }
}

const MATCHED_FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  serie: 'Serie',
  location: 'Ubicación',
  activoFijo: 'Activo Fijo',
  deviceName: 'Nombre del Dispositivo'
}

/** Campos (en español) donde la búsqueda encontró coincidencias. */
export const getMatchedFields = (files: Certificate[]) => {
  if (!files || files.length === 0) return []

  const allMatchedFields = files.flatMap(
    (file) => file.searchMatches?.map((match) => match.field) || []
  )

  const uniqueFields = [...new Set(allMatchedFields)]
  return uniqueFields.map((field) => MATCHED_FIELD_LABELS[field] || field)
}
