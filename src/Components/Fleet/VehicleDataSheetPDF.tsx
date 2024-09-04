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

import { MaintenanceRecord, Document as DocumentType } from './types'
import useAxiosPrivate from '@utils/use-axios-private'

const minioClient = new minioExports.Client({
  endPoint: import.meta.env.VITE_MINIO_ENDPOINT || 'localhost',
  port: import.meta.env.VITE_ENV === 'development' ? 9000 : undefined,
  useSSL: import.meta.env.VITE_MINIO_USESSL === 'true',
  accessKey: import.meta.env.VITE_MINIO_ACCESSKEY,
  secretKey: import.meta.env.VITE_MINIO_SECRETKEY
})

const VehicleDataSheetPDF = () => {
  const axiosPrivate = useAxiosPrivate()
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

  const styles3 = StyleSheet.create({
    page: {
      //padding: 20
    },
    table: {
      width: 'auto'
      //margin: '10px 0'
    },
    tableRow: {
      flexDirection: 'row'
    },
    tableCol: {
      width: '50%',
      //   borderBottomWidth: 1,
      borderBottomColor: '#000'
    },
    tableCol3: {
      width: '1/100%',
      //   borderBottomWidth: 1,
      borderBottomColor: '#000'
    },
    tableCell: {
      paddingHorizontal: 10,

      alignContent: 'center'
    },
    tableCell0: {
      //margin: 1,
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
      //   backgroundColor: '#e0e0e0',
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
      //   borderRadius: 8,
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
      //   fontSize: 12
    }
  })

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
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  )

  //   const MainData = () => (
  //     <View style={tw('p-4 border border-black rounded-lg mt-8')}>
  //       <View style={tw('flex-row justify-between')}>
  //         <View style={tw('flex-1 pr-2')}>
  //           <Text style={tw('font-bold')}>Placa: {vehicleData.licensePlate}</Text>
  //           <Text>Nº de Licencia de Transito: {vehicleData.transitLicense}</Text>
  //           <Text>Marca: {vehicleData.make}</Text>
  //           <Text>Modelo: {vehicleData.model}</Text>
  //           <Text>Año: {vehicleData.year}</Text>
  //           <Text>Cilindraje: {vehicleData.displacement} cc</Text>
  //           <Text>Color: {vehicleData.color}</Text>
  //           <Text>Tipo de Servicio: {vehicleData.serviceType}</Text>
  //           <Text>Clase: {vehicleData.vehicleClass}</Text>
  //           <Text>Tipo de Carroceria: {vehicleData.bodyType}</Text>
  //           <Text>Capacidad: {vehicleData.capacity} pasajeros</Text>
  //         </View>
  //         <View style={tw('flex-1 pl-2')}>
  //           <Text>Nº de Motor: {vehicleData.engineNumber}</Text>
  //           <Text>Vin: {vehicleData.vin}</Text>
  //           <Text>Nº de Chasis: {vehicleData.chasisNumber}</Text>
  //           <Text>Potencia: {vehicleData.power} hp</Text>
  //           <Text>
  //             Declaración de Importación: {vehicleData.declarationImportation}
  //           </Text>
  //           <Text>Numero de Puertas: {vehicleData.doors}</Text>
  //           <Text>Autoridad de Tráfico: {vehicleData.trafficAuthority}</Text>
  //           <Text>
  //             Fecha de Importación:{' '}
  //             {format(new Date(vehicleData.importationDate), 'yyyy-MM-dd')}
  //           </Text>
  //           <Text>
  //             Fecha de Registro:{' '}
  //             {format(new Date(vehicleData.registrationDate), 'yyyy-MM-dd')}
  //           </Text>
  //           <Text>
  //             Fecha de Expedición:{' '}
  //             {format(new Date(vehicleData.expeditionDate), 'yyyy-MM-dd')}
  //           </Text>
  //           <Text>
  //             Kilometraje Actual:{' '}
  //             {vehicleData.currentMileage.toLocaleString('es-CO', {
  //               style: 'unit',
  //               unit: 'kilometer'
  //             })}
  //           </Text>
  //         </View>
  //       </View>
  //     </View>
  //   )

  //   const Documents = () => (
  //     <View style={tw('p-4 border border-black rounded-lg mt-5')}>
  //       <View style={styles.container}>
  //         <View style={styles.column}>
  //           <Text style={styles.header}>Documento</Text>
  //           <Text style={styles.item}>{soat ? soat.documentType : 'SOAT'}</Text>
  //           <Text style={styles.item}>{rtm ? rtm.documentType : 'RTM'}</Text>
  //         </View>
  //         <View style={styles.column}>
  //           <Text style={styles.header}>Número de Documento</Text>
  //           <Text style={styles.item}>
  //             {soat ? soat.documentNumber : 'SIN DOCUMENTO'}
  //           </Text>
  //           <Text style={styles.item}>
  //             {rtm ? rtm.documentNumber : 'SIN DOCUMENTO'}
  //           </Text>
  //         </View>
  //         <View style={styles.column}>
  //           <Text style={styles.header}>Fecha de Vencimiento</Text>
  //           <Text style={styles.item}>
  //             {soat ? format(new Date(soat.expirationDate), 'yyyy-MM-dd') : ''}
  //           </Text>
  //           <Text style={styles.item}>
  //             {rtm ? format(new Date(rtm.expirationDate), 'yyyy-MM-dd') : ''}
  //           </Text>
  //         </View>
  //       </View>
  //       {filteredDocuments.map((doc: DocumentType, index: number) => (
  //         <View key={index} style={styles.container}>
  //           <View style={styles.column}>
  //             <Text style={styles.item}>{doc.documentType}</Text>
  //           </View>
  //           <View style={styles.column}>
  //             <Text style={styles.item}>{doc.documentNumber}</Text>
  //           </View>
  //           <View style={styles.column}>
  //             <Text style={styles.item}>
  //               {format(new Date(doc.expirationDate as string), 'yyyy-MM-dd')}
  //             </Text>
  //           </View>
  //         </View>
  //       ))}
  //     </View>
  //   )
  //   const Data = () => {
  //     return (
  //       <View style={styles2.table}>
  //         <View style={styles2.tableHeader}>
  //           <Text style={styles2.headerItem}>Fecha</Text>
  //         </View>
  //       </View>
  //     )
  //   }

  //   const Documents2 = () => {
  //     return (
  //       <View
  //         style={{
  //           marginVertical: 10
  //           //   paddingHorizontal: 30
  //         }}
  //       >
  //         <View>
  //           <Text style={tw('text-center text-[16px] font-bold')}>
  //             DOCUMENTOS
  //           </Text>
  //         </View>
  //         <View style={styles.table}>
  //           <View style={styles.tableHeader}>
  //             <Text style={[styles.headerItem]}>Documento</Text>

  //             <Text style={styles.headerItem}>N° de Documento</Text>

  //             <Text style={styles.headerItem}>Fecha de Vencimiento</Text>
  //           </View>
  //           <View style={styles.tableRow}>
  //             <Text style={styles.rowItem}>
  //               {soat ? soat.documentType : 'SOAT'}
  //             </Text>

  //             <Text style={styles.rowItem}>
  //               {soat ? soat.documentNumber : 'SIN DOCUMENTO'}
  //             </Text>

  //             <Text style={styles.rowItem}>
  //               {soat
  //                 ? format(new Date(soat.expirationDate as string), 'yyyy-MM-dd')
  //                 : 'SIN DOCUMENTO'}
  //             </Text>
  //           </View>
  //           <View style={styles.tableRow}>
  //             <Text style={styles.rowItem}>{rtm ? rtm.documentType : 'RTM'}</Text>

  //             <Text style={styles.rowItem}>
  //               {rtm ? rtm.documentNumber : 'SIN DOCUMENTO'}
  //             </Text>

  //             <Text style={styles.rowItem}>
  //               {rtm
  //                 ? format(new Date(rtm.expirationDate as string), 'yyyy-MM-dd')
  //                 : 'SIN DOCUMENTO'}
  //             </Text>
  //           </View>
  //           {filteredDocuments.map((doc: DocumentType, index: number) => (
  //             <View key={index} style={styles3.tableRow}>
  //               <View
  //                 style={[
  //                   styles3.tableCol3,
  //                   {
  //                     borderBottomWidth: 1
  //                   }
  //                 ]}
  //               >
  //                 <Text style={styles3.tableCell0}>{doc.documentType}</Text>
  //               </View>
  //               <View style={[styles3.tableCol3, { borderBottomWidth: 1 }]}>
  //                 <Text style={styles3.tableCell0}>{doc.documentNumber}</Text>
  //               </View>
  //               <View
  //                 style={[
  //                   styles3.tableCol3,
  //                   {
  //                     borderBottomWidth: 1
  //                   }
  //                 ]}
  //               >
  //                 <Text style={styles3.tableCell}>
  //                   {doc.expirationDate
  //                     ? format(new Date(doc.expirationDate), 'yyyy-MM-dd')
  //                     : 'SIN DOCUMENTO'}
  //                 </Text>
  //               </View>
  //             </View>
  //           ))}
  //         </View>
  //       </View>
  //     )
  //   }

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
          <Text style={styles3.headerTitle}>Datos del Vehículo</Text>
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
              <Text style={styles3.tableCell0}>Declaración de Importación</Text>
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
              <Text style={styles3.tableCell0}>Fecha de Importación</Text>
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
              <Text style={styles3.tableCell0}>Fecha de Expedición</Text>
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
                {soat
                  ? `Vencimiento: ${format(new Date(soat.expirationDate as string), 'yyyy-MM-dd')}`
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
                {rtm
                  ? `Vencimiento: ${format(new Date(rtm.expirationDate as string), 'yyyy-MM-dd')}`
                  : 'SIN DOCUMENTO'}
              </Text>
            </View>
          </View>

          {filteredDocuments.map((doc: DocumentType) => (
            <View style={styles3.tableRow}>
              <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
                <Text style={styles3.tableCell0}>{doc.documentType}</Text>
              </View>
              <View style={[styles3.tableCol, { borderBottomWidth: 1 }]}>
                <Text style={styles3.tableCell}>
                  {`Vencimiento: ${format(new Date(doc.expirationDate as string), 'yyyy-MM-dd')}`}
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
            <View
              style={{
                marginTop: 20
              }}
            >
              <Text
                style={[
                  tw('text-center text-[20px] font-bold '),
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
              {imageUrl ? (
                <Image src={imageUrl} />
              ) : (
                <Image src={'/images/no-img.jpg'} />
              )}
            </View>
            {/* <MainData /> */}
            {/* <Documents /> */}
            <Data2 />
            <Footer />
          </Page>
          <Page size='A4' style={styles.page} wrap={true}>
            {/* <Documents2 /> */}
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
    </div>
  )
}

export default VehicleDataSheetPDF
