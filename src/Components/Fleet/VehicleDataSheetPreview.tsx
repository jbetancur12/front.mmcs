import {
  Document,
  Image,
  Page,
  PDFViewer,
  StyleSheet,
  Text,
  View
} from '@react-pdf/renderer'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { createTw } from 'react-pdf-tailwind'

import useAxiosPrivate from '@utils/use-axios-private'
import { buildMinioObjectUrl } from '@utils/minio'

import { Document as DocumentType, MaintenanceRecord } from './types'

type VehicleDocument = DocumentType & {
  documentType: string
  documentNumber?: string
  expirationDate?: string
}

type VehicleData = {
  id: number
  pictureUrl?: string
  licensePlate: string
  transitLicense: string
  make: string
  model: string
  year: string | number
  displacement: string | number
  color: string
  serviceType: string
  vehicleClass: string
  bodyType: string
  capacity: string | number
  engineNumber: string
  vin: string
  chasisNumber: string
  power: string | number
  declarationImportation: string
  doors: string | number
  trafficAuthority: string
  importationDate: string
  registrationDate: string
  expeditionDate: string
  currentMileage: number
}

interface VehicleDataSheetPreviewProps {
  vehicleData: VehicleData
  documents: VehicleDocument[]
}

const VehicleDataSheetPreview = ({
  vehicleData,
  documents
}: VehicleDataSheetPreviewProps) => {
  const axiosPrivate = useAxiosPrivate()
  const imageUrl = vehicleData?.pictureUrl
    ? buildMinioObjectUrl('images', vehicleData.pictureUrl)
    : ''
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecord[]
  >([])

  const soat = documents.find((doc) => doc.documentType === 'SOAT')
  const rtm = documents.find((doc) => doc.documentType === 'RTM')

  const filteredDocuments = documents.filter(
    (doc) => doc.documentType !== 'SOAT' && doc.documentType !== 'RTM'
  )

  const tw = createTw({
    theme: {
      extend: {
        colors: {
          custom: '#bada55'
        }
      }
    }
  })

  const styles3 = StyleSheet.create({
    page: {},
    table: {
      width: 'auto'
    },
    tableRow: {
      flexDirection: 'row'
    },
    tableCol: {
      width: '50%',
      borderBottomColor: '#000'
    },
    tableCell: {
      paddingHorizontal: 10,
      alignContent: 'center'
    },
    tableCell0: {
      borderRightWidth: 1,
      paddingHorizontal: 10
    },
    header: {
      textAlign: 'center',
      backgroundColor: '#e0e0e0',
      border: 1,
      borderColor: '#000'
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: 'bold'
    }
  })

  const styles = StyleSheet.create({
    page: {
      fontSize: 11,
      paddingTop: 20,
      paddingLeft: 20,
      paddingRight: 20,
      lineHeight: 1.5,
      flexDirection: 'column'
    },
    table: {
      borderWidth: 1,
      borderColor: '#000',
      overflow: 'hidden',
      marginTop: 10
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#e0e0e0',
      paddingVertical: 8,
      paddingHorizontal: 4,
      justifyContent: 'space-between'
    },
    tableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd'
    },
    headerItem: {
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'center',
      fontSize: 12
    },
    rowItem: {
      flex: 1,
      textAlign: 'center'
    }
  })

  useEffect(() => {
    const getMaintenanceRecords = async () => {
      try {
        const response = await axiosPrivate.get(
          `/maintenanceRecord?vehicleId=${vehicleData.id}`,
          {}
        )

        if (response.status === 200) {
          setMaintenanceRecords(response.data)
        }
      } catch (error) {
        console.error('Error fetching maintenance records:', error)
      }
    }

    getMaintenanceRecords()
  }, [axiosPrivate, vehicleData.id])

  const Footer = () => (
    <View
      style={{
        marginBottom: 20,
        marginTop: 20,
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 8,
        position: 'absolute'
      }}
      fixed
    >
      <Text
        style={tw('text-center')}
        render={({ pageNumber, totalPages }) =>
          `Pagina ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  )

  const Data2 = () => {
    return (
      <View
        style={{
          marginTop: 10,
          width: '100%',
          paddingHorizontal: 30
        }}
      >
        <View style={styles3.header}>
          <Text style={styles3.headerTitle}>Datos del Vehiculo</Text>
        </View>
        <View style={styles3.table}>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Placa</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.licensePlate}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Nº de Licencia de Transito</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>
                {vehicleData.transitLicense}
              </Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Marca</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.make}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Modelo</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.model}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Año</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.year}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Cilindraje</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>
                {vehicleData.displacement} cc
              </Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Color</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.color}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Tipo de Servicio</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.serviceType}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Clase</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.vehicleClass}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Tipo de Carroceria</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.bodyType}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Capacidad</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.capacity}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Nº de Motor</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.engineNumber}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Vin</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.vin}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Nº de Chasis</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.chasisNumber}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Potencia</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.power}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Declaracion de Importacion</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>
                {vehicleData.declarationImportation}
              </Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Nº de Puertas</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>{vehicleData.doors}</Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Autoridad de Transito</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>
                {vehicleData.trafficAuthority}
              </Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Fecha de Importacion</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>
                {vehicleData.importationDate}
              </Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Fecha de Registro</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>
                {vehicleData.registrationDate}
              </Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Fecha de Expedicion</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>
                {vehicleData.expeditionDate}
              </Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>Kilometraje</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>
                {vehicleData.currentMileage.toLocaleString('es-CO', {
                  style: 'unit',
                  unit: 'kilometer'
                })}
              </Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>SOAT</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>
                {soat?.expirationDate
                  ? `Vencimiento: ${format(new Date(soat.expirationDate), 'yyyy-MM-dd')}`
                  : 'SIN DOCUMENTO'}
              </Text>
            </View>
          </View>
          <View style={styles3.tableRow}>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell0}>RTM</Text>
            </View>
            <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
              <Text style={styles3.tableCell}>
                {rtm?.expirationDate
                  ? `Vencimiento: ${format(new Date(rtm.expirationDate), 'yyyy-MM-dd')}`
                  : 'SIN DOCUMENTO'}
              </Text>
            </View>
          </View>
          {filteredDocuments.map((doc, index) => (
            <View key={`${doc.documentType}-${index}`} style={styles3.tableRow}>
              <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
                <Text style={styles3.tableCell0}>{doc.documentType}</Text>
              </View>
              <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
                <Text style={styles3.tableCell}>
                  {doc.expirationDate
                    ? `Vencimiento: ${format(new Date(doc.expirationDate), 'yyyy-MM-dd')}`
                    : 'SIN DOCUMENTO'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const MaintenanceTable = () => {
    return (
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerItem}>Fecha</Text>
          <Text style={styles.headerItem}>Intervencion</Text>
          <Text style={styles.headerItem}>Proveedor de Servicio</Text>
          <Text style={styles.headerItem}>Kilometraje</Text>
        </View>
        {maintenanceRecords.map((maintenance, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.rowItem}>
              {format(new Date(maintenance.date), 'yyyy-MM-dd')}
            </Text>
            <Text style={styles.rowItem}>
              {maintenance.interventionType.name}
            </Text>
            <Text style={styles.rowItem}>{maintenance.serviceProvider}</Text>
            <Text style={styles.rowItem}>
              {maintenance.mileage.toLocaleString('es-CO', {
                style: 'unit',
                unit: 'kilometer'
              })}
            </Text>
          </View>
        ))}
      </View>
    )
  }

  return (
    <PDFViewer width='100%' height='1000' className='app'>
      <Document>
        <Page size='A4' style={styles.page} wrap>
          <View
            style={{
              marginTop: 20
            }}
          >
            <Text
              style={[
                tw('text-center text-[20px] font-bold'),
                {
                  border: '1px solid black',
                  backgroundColor: '#e0e0e0',
                  paddingTop: 10
                }
              ]}
            >
              HOJA DE VIDA DEL VEHICULO
            </Text>
          </View>
          <View
            style={[
              {
                marginLeft: 10,
                width: '150px',
                marginTop: '20px',
                marginBottom: '20px',
                marginRight: 'auto',
                marginHorizontal: 'auto',
                border: '2px solid black'
              }
            ]}
          >
            {imageUrl ? <Image src={imageUrl} /> : <Image src='/images/no-img.jpg' />}
          </View>
          <Data2 />
          <Footer />
        </Page>
        <Page size='A4' style={styles.page} wrap>
          <View>
            <Text style={tw('text-center text-[16px] font-bold')}>
              INTERVENCIONES
            </Text>
          </View>
          <MaintenanceTable />
          <Footer />
        </Page>
      </Document>
    </PDFViewer>
  )
}

export default VehicleDataSheetPreview
