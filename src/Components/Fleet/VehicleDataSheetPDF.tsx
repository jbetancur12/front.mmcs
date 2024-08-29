import { ArrowBack } from '@mui/icons-material'
import { IconButton } from '@mui/material'
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
import { useLocation, useNavigate } from 'react-router-dom'
import * as minioExports from 'minio'
import { api } from '../../config'
import axios from 'axios'
import { MaintenanceRecord, Document as DocumentType } from './types'

const minioClient = new minioExports.Client({
  endPoint: import.meta.env.VITE_MINIO_ENDPOINT || 'localhost',
  port: import.meta.env.VITE_ENV === 'development' ? 9000 : undefined,
  useSSL: import.meta.env.VITE_MINIO_USESSL === 'true',
  accessKey: import.meta.env.VITE_MINIO_ACCESSKEY,
  secretKey: import.meta.env.VITE_MINIO_SECRETKEY
})

const apiUrl = api()

const VehicleDataSheetPDF = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [imageUrl, setImageUrl] = useState<string>('')
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecord[]
  >([])

  const { vehicleData, documents } = state

  const soat = documents.find((doc: any) => doc.documentType === 'SOAT')
  const rtm = documents.find((doc: any) => doc.documentType === 'RTM')

  const filteredDocuments = documents.filter(
    (doc: any) => doc.documentType !== 'SOAT' && doc.documentType !== 'RTM'
  )

  const tw = createTw({
    theme: {
      // fontFamily: {
      //   sans: ['Comic Sans', 'Comic Sans Bold']
      // },
      extend: {
        colors: {
          custom: '#bada55'
        }
      }
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
    container: {
      flexDirection: 'row',
      marginBottom: 1,
      paddingBottom: 1
    },
    column: {
      flex: 1,
      padding: 1
    },
    header: {
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 1
    },
    item: {
      fontSize: 10
    },
    label: {
      fontWeight: 'bold',
      fontSize: 12
    },
    value: {
      fontSize: 12
    },
    table: {
      borderWidth: 1,
      borderColor: '#000',
      borderRadius: 8,
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
      paddingVertical: 8,
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
      textAlign: 'center',
      fontSize: 12
    }
  })

  const getMaintenanceRecords = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/maintenanceRecord?vehicleId=${vehicleData.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      )
      if (response.status === 200) {
        setMaintenanceRecords(response.data)
      }
    } catch (error) {
      console.error('Error fetching maintenance records:', error)
    }
  }

  useEffect(() => {
    getMaintenanceRecords()
  }, [vehicleData.id])

  useEffect(() => {
    // Nombre de tu archivo de imagen en el bucket

    const getImageFromBucket = async (picture: any) => {
      try {
        const objectStream = await minioClient.getObject('images', picture)
        const chunks: Uint8Array[] = []

        objectStream.on('data', (chunk: Uint8Array) => chunks.push(chunk))
        objectStream.on('end', () => {
          const imageBlob = new Blob(chunks, { type: 'image/jpeg' }) // Cambia el tipo de imagen según corresponda (jpeg, png, etc.)
          const imageUrl = URL.createObjectURL(imageBlob)
          setImageUrl(imageUrl)
        })
      } catch (error) {
        console.error('Error al obtener la imagen del bucket:', error)
      }
    }
    if (vehicleData?.pictureUrl) {
      getImageFromBucket(vehicleData.pictureUrl)
    }
  }, [vehicleData?.pictureUrl])

  const MainData = () => (
    <View style={tw('p-4 border border-black rounded-lg mt-8')}>
      <View style={tw('flex-row justify-between')}>
        <View style={tw('flex-1 pr-2')}>
          <Text style={tw('font-bold')}>Placa: {vehicleData.licensePlate}</Text>
          <Text>Nº de Licencia de Transito: {vehicleData.transitLicense}</Text>
          <Text>Marca: {vehicleData.make}</Text>
          <Text>Modelo: {vehicleData.model}</Text>
          <Text>Año: {vehicleData.year}</Text>
          <Text>Cilindraje: {vehicleData.displacement} cc</Text>
          <Text>Color: {vehicleData.color}</Text>
          <Text>Tipo de Servicio: {vehicleData.serviceType}</Text>
          <Text>Clase: {vehicleData.vehicleClass}</Text>
          <Text>Tipo de Carroceria: {vehicleData.bodyType}</Text>
          <Text>Capacidad: {vehicleData.capacity} pasajeros</Text>
        </View>
        <View style={tw('flex-1 pl-2')}>
          <Text>Nº de Motor: {vehicleData.engineNumber}</Text>
          <Text>Vin: {vehicleData.vin}</Text>
          <Text>Nº de Chasis: {vehicleData.chasisNumber}</Text>
          <Text>Potencia: {vehicleData.power} hp</Text>
          <Text>
            Declaración de Importación: {vehicleData.declarationImportation}
          </Text>
          <Text>Numero de Puertas: {vehicleData.doors}</Text>
          <Text>Autoridad de Tráfico: {vehicleData.trafficAuthority}</Text>
          <Text>
            Fecha de Importación:{' '}
            {format(new Date(vehicleData.importationDate), 'yyyy-MM-dd')}
          </Text>
          <Text>
            Fecha de Registro:{' '}
            {format(new Date(vehicleData.registrationDate), 'yyyy-MM-dd')}
          </Text>
          <Text>
            Fecha de Expedición:{' '}
            {format(new Date(vehicleData.expeditionDate), 'yyyy-MM-dd')}
          </Text>
          <Text>
            Kilometraje Actual:{' '}
            {vehicleData.currentMileage.toLocaleString('es-CO', {
              style: 'unit',
              unit: 'kilometer'
            })}
          </Text>
        </View>
      </View>
    </View>
  )

  const Documents = () => (
    <View style={tw('p-4 border border-black rounded-lg mt-5')}>
      <View style={styles.container}>
        <View style={styles.column}>
          <Text style={styles.header}>Documento</Text>
          <Text style={styles.item}>{soat ? soat.documentType : 'SOAT'}</Text>
          <Text style={styles.item}>{rtm ? rtm.documentType : 'RTM'}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.header}>Número de Documento</Text>
          <Text style={styles.item}>
            {soat ? soat.documentNumber : 'SIN DOCUMENTO'}
          </Text>
          <Text style={styles.item}>
            {rtm ? rtm.documentNumber : 'SIN DOCUMENTO'}
          </Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.header}>Fecha de Vencimiento</Text>
          <Text style={styles.item}>
            {soat ? format(new Date(soat.expirationDate), 'yyyy-MM-dd') : ''}
          </Text>
          <Text style={styles.item}>
            {rtm ? format(new Date(rtm.expirationDate), 'yyyy-MM-dd') : ''}
          </Text>
        </View>
      </View>
      {filteredDocuments.map((doc: DocumentType, index: number) => (
        <View key={index} style={styles.container}>
          <View style={styles.column}>
            <Text style={styles.item}>{doc.documentType}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.item}>{doc.documentNumber}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.item}>
              {format(new Date(doc.expirationDate as string), 'yyyy-MM-dd')}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )

  const MaintenanceTable = () => {
    return (
      <View style={styles.table}>
        {/* Encabezados de la tabla */}
        <View style={styles.tableHeader}>
          <Text style={styles.headerItem}>Fecha</Text>
          <Text style={styles.headerItem}>Intervención</Text>
          <Text style={styles.headerItem}>Proveedor de Servicio</Text>

          <Text style={styles.headerItem}>Kilometraje</Text>
        </View>

        {/* Filas de la tabla */}
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
    <div>
      <IconButton
        onClick={() => navigate(`/fleet/${vehicleData.id}/documents`)}
        sx={{ mb: 2 }}
      >
        <ArrowBack />
      </IconButton>

      <PDFViewer width='100%' height='1000' className='app'>
        <Document>
          <Page size='A4' style={styles.page} wrap={true}>
            <View>
              <Text style={tw('text-center text-[20px] font-bold')}>
                HOJA DE VIDA DEL VEHICULO
              </Text>
            </View>
            <View
              style={[
                {
                  marginLeft: 10,
                  width: '150px',
                  marginTop: '30px',
                  marginRight: 'auto',
                  marginHorizontal: 'auto'
                }
              ]}
            >
              {imageUrl ? (
                <Image src={imageUrl} />
              ) : (
                <Image src={'/images/no-img.jpg'} />
              )}
            </View>
            <MainData />
            <Documents />
          </Page>
          <Page size='A4' style={styles.page} wrap={true}>
            <View>
              <Text style={tw('text-center text-[16px] font-bold')}>
                INTERVENCIONES
              </Text>
            </View>
            <MaintenanceTable />
          </Page>
        </Document>
      </PDFViewer>
    </div>
  )
}

export default VehicleDataSheetPDF
