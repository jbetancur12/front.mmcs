import {
  Document,
  Image,
  Page,
  PDFViewer,
  StyleSheet,
  Text,
  View
} from '@react-pdf/renderer'
import { createTw } from 'react-pdf-tailwind'
import {
  EquipmentInfo,
  InspectionMaintenanceData
} from './InspectionMaintenanceForm'

const mainColor = '#9CF08B'

interface ExtendedInspectionMaintenanceData extends InspectionMaintenanceData {
  dataSheet: EquipmentInfo // Nuevo campo
  id: string // Nuevo campo
}

interface Props {
  data: ExtendedInspectionMaintenanceData | null
}

const InspectionMaintenancePDF: React.FC<Props> = ({ data }) => {
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

  const fieldLabels: { [key in keyof InspectionMaintenanceData]: string } = {
    equipmentId: 'ID del equipo',
    date: 'Fecha',
    estadoCondicionesAmbientales: 'Condiciones Ambientales',
    estadoSuperficieExterna: 'Superficie Externa',
    estadoConexionElectrica: 'Conexión Eléctrica',
    estadoCambioDePoder: 'Cambio de Poder',
    voltaje: 'Voltaje',
    verificarFusibles: 'Verificar Fusibles',
    tarjetasElectronicas: 'Tarjetas Electrónicas',
    conexionesYSoldaduras: 'Conexiones y Soldaduras',
    estadoValvulaAireComprimido: 'Estado Válvula Aire Comprimido',
    limpiezaFiltros: 'Limpieza de Filtros',
    lubricacionRodamientos: 'Lubricación de Rodamientos',
    sujecionTornillos: 'Sujeción de Tornillos',
    limpiezaSensoresOLentes: 'Limpieza de Sensores o Lentes',
    bandasDeTraccionOMovimiento: 'Bandas de Tracción o Movimiento',
    estadoManguerasDeAire: 'Mangueras de Aire',
    funcionamientoSensores: 'Funcionamiento de Sensores',
    comprobacionOperacion: 'Comprobación de Operación',
    conclusion: 'Conclusión',
    comentarios: 'Comentarios',
    elaboradoPor: 'Elaborado Por'
  }

  const styles = StyleSheet.create({
    names: {
      fontFamily: 'Helvetica-Bold',
      fontWeight: 900,
      textTransform: 'uppercase'
    },
    cell: {
      border: '1px solid black',
      padding: ' 3 1 0 4',
      margin: 2,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%'
    },
    cellStatus: {
      border: '1px solid black',
      padding: ' 3 1 0 4',
      margin: 2,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '50%'
    },
    page: {
      fontSize: 11,
      paddingTop: 20,
      paddingLeft: 20,
      paddingRight: 20,
      lineHeight: 1.5,
      flexDirection: 'column'
    },
    header: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#000',
      paddingBottom: 10
    },
    headerLeft: {
      width: '25%',
      borderRightWidth: 1,
      borderRightColor: '#000',
      paddingRight: 5
    },
    headerCenter: {
      width: '50%',
      alignItems: 'center'
    },
    headerRight: {
      width: '25%',
      paddingLeft: 5
    },
    sectionTitle: {
      backgroundColor: mainColor,
      color: '#fff',
      textAlign: 'center',
      padding: 5,
      marginTop: 10
    },
    bold: {
      fontFamily: 'Helvetica-Bold',
      fontWeight: 900
    },
    sectionContent: {
      padding: 5,
      marginTop: 5,
      marginBottom: 10
    },
    row: {
      flexDirection: 'row',
      marginBottom: 5,
      justifyContent: 'space-between',
      gap: 20
    },
    columnL: {
      flex: 1,
      flexDirection: 'column'
    },
    columnR: {
      flex: 1,
      flexDirection: 'column'
    },
    label: {
      fontFamily: 'Helvetica-Bold',
      fontWeight: 900,
      padding: '5 4 0 5',
      width: '60%',
      fontSize: 10
    },
    flexLabel: {
      flex: 1
    },
    flexValue: {
      flex: 4.3
    },
    value: {
      borderWidth: 1,
      borderColor: 'black',
      padding: '4 5 0 5',
      width: '80%',
      fontWeight: 'normal',
      fontSize: 9
    },
    width25: {
      width: '25%'
    },
    width50: {
      width: '50%'
    },
    widthLogo: {
      width: 130,
      marginLeft: 0
    },
    footer: {
      marginBottom: 20,
      marginTop: 20,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 8
    },
    content: {
      flexGrow: 1,
      marginBottom: 20
    }
  })

  const Header = () => (
    <View style={tw('border border-black flex  flex-row mb-10	')} fixed>
      <View style={[styles.width25, tw('border-r'), styles.bold]}>
        <Text style={[tw('border-b px-1 text-xs py-1')]}>
          CÓDIGO: FOT-MMCS-17
        </Text>
        <Text style={[tw('border-b  px-1 py-1 text-xs ')]}>VERSIÓN: 02</Text>
        <Text style={[tw('border-b  px-1 text-xs py-1')]}>
          FECHA: 2017-12-05
        </Text>
        <Text
          style={[tw(' px-1 text-xs py-1')]}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
        />
      </View>
      <View
        style={[
          styles.width50,
          tw('border-r flex justify-center'),
          styles.bold
        ]}
      >
        <Text style={[tw('text-center top-1')]}>METROMEDICS</Text>
        <Text style={tw('border-b mt-2')}></Text>
        {/* <Text style={[tw("text-center text-sm top-1"), styles.fontBold]}>
              OFERTA COMERCIAL Y CONDICIONES DE {"\n"} SERVICIO DE VENTA DE EQUIPOS
              E INSUMOS
            </Text> */}
        <Text style={[tw('text-center text-sm top-1'), styles.bold]}>
          REPORTE DE MANTENIMINETO PREVENTIVO DE EQUIPOS
        </Text>
      </View>
      <View style={styles.width25}>
        <Image
          style={[tw('top-2  p-2'), styles.widthLogo]}
          src='/images/logo2.png'
        ></Image>
      </View>
    </View>
  )

  const EqipmentIdentification = () => (
    <View style={tw('text-sm')}>
      <Text
        style={[
          tw(`px-1 py-1 font-semibold bg-[${mainColor}] text-center font-bold`),
          styles.bold
        ]}
      >
        1. IDENTIFICACIÓN DEL EQUIPO
      </Text>
      <View style={styles.sectionContent}>
        <View style={styles.row}>
          <View style={styles.columnL}>
            <View style={styles.row}>
              <Text style={styles.label}>N°:</Text>
              <Text style={styles.value}>{data?.id}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Nombre de Equipo:</Text>
              <Text style={styles.value}>{data?.dataSheet.equipmentName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Marca:</Text>
              <Text style={styles.value}>{data?.dataSheet.brand}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Modelo:</Text>
              <Text style={styles.value}>{data?.dataSheet.model}</Text>
            </View>
          </View>
          <View style={styles.columnR}>
            <View style={styles.row}>
              <Text style={styles.label}>Fecha:</Text>
              <Text style={styles.value}>{data?.date}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Serie:</Text>
              <Text style={styles.value}>{data?.dataSheet.serialNumber}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Codigó Interno:</Text>
              <Text style={styles.value}>{data?.dataSheet.internalCode}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tipo de Equipo:</Text>
              <Text style={styles.value}>{data?.dataSheet.serviceType}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )

  const Brief = () => {
    if (!data) {
      return null
    }

    return (
      <View style={styles.sectionContent}>
        <View style={styles.row}>
          <View style={styles.columnL}>
            <View style={styles.row}>
              <Text style={styles.label}>Conclusión:</Text>
              <Text style={styles.value}>{data?.conclusion}</Text>
            </View>
          </View>
          <View style={styles.columnR}>
            <View style={styles.row}>
              <Text style={styles.label}>Elaboró:</Text>
              <Text style={styles.value}>{data?.elaboradoPor}</Text>
            </View>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, styles.flexLabel]}>Comentarios:</Text>
          <Text style={[styles.value, styles.flexValue]}>
            {data?.comentarios}
          </Text>
        </View>
      </View>
    )

    // Define un conjunto de claves que deseas excluir
  }

  const Inspection = () => {
    if (!data) {
      return null
    }

    // Define un conjunto de claves que deseas excluir
    const excludeKeys = new Set([
      'dataSheet',
      'updatedAt',
      'createdAt',
      'conclusion',
      'comentarios',
      'elaboradoPor',
      'name',
      'equipmentId',
      'date',
      'id'
    ])

    // Filtra las claves del objeto `data` para excluir las claves especificadas
    const filteredKeys = Object.keys(data).filter(
      (key) => !excludeKeys.has(key)
    )

    return (
      <View style={tw('text-sm')}>
        <Text
          style={[
            tw(
              `px-1 py-1 font-semibold bg-[${mainColor}] text-center font-bold`
            ),
            styles.bold
          ]}
        >
          2. PUNTOS DE INSPECCIÓN Y MANTENIMIENTO
        </Text>
        <View style={tw('flex-row mb-2 mt-2')}>
          <Text style={[styles.cell, styles.names]}>DESCRIPCIÓN</Text>
          <Text style={[styles.cell, styles.names]}>ESTADO</Text>
          <Text style={[styles.cell, styles.names]}>INTERVENCIÓN</Text>
        </View>
        {filteredKeys.map((item, index) => {
          const value = data[item as keyof ExtendedInspectionMaintenanceData]

          return (
            <View key={index} style={tw('flex-row')}>
              <Text style={[styles.cell]}>
                {fieldLabels[item as keyof InspectionMaintenanceData]}
              </Text>
              <Text style={[styles.cell]}>{value as string}</Text>
              <Text style={[styles.cell]}></Text>
            </View>
          )
        })}
      </View>
    )
  }

  const Footer = () => (
    <View style={[styles.footer, styles.bold]} fixed>
      <Text style={tw('text-center')}>
        Metromedics S.A.S Nit. 900.816.433-3 Dosquebradas - Risaralda
      </Text>
      <Text style={tw('text-center')}>
        Contáctenos: 3113441682 - (606) 3256584 comercial@metromedicslab.com.co
      </Text>
      <Text style={tw('text-center')}>www.metromedics.co</Text>
    </View>
  )

  if (!data) return <div>Loading...</div>

  return (
    <PDFViewer width='100%' height='1000' className='app'>
      <Document>
        <Page size='A4' style={styles.page} wrap={true}>
          <Header />
          <View style={styles.content}>
            <EqipmentIdentification />
            <Inspection />
            <Brief />
          </View>
          <Footer />
        </Page>
      </Document>
    </PDFViewer>
  )
}

export default InspectionMaintenancePDF
