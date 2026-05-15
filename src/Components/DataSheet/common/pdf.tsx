import { Image, Text, View } from '@react-pdf/renderer'
import { styles, tw } from './styles'

interface HeaderProps {
  code: string
  version: string
  date: string
}

export const Header: React.FC<HeaderProps> = ({ code, version, date }) => (
  <View style={tw('border border-black flex  flex-row mb-10	')} fixed>
    <View style={[styles.width25, tw('border-r'), styles.bold]}>
      <Text style={[tw('border-b px-1 text-xs py-1')]}>CÓDIGO: {code}</Text>
      <Text style={[tw('border-b  px-1 py-1 text-xs ')]}>
        VERSIÓN: {version}
      </Text>
      <Text style={[tw('border-b  px-1 text-xs py-1')]}>FECHA: {date}</Text>
      <Text
        style={[tw(' px-1 text-xs py-1')]}
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
    <View
      style={[styles.width50, tw('border-r flex justify-center'), styles.bold]}
    >
      <Text style={[tw('text-center top-1')]}>METROMEDICS</Text>
      <Text style={tw('border-b mt-2')}></Text>
      <Text style={[tw('text-center text-sm top-1'), styles.bold]}>
        RETIRO E INGRESO DE EQUIPOS
      </Text>
    </View>
    <View style={styles.width25}>
      <Image
        style={[tw('top-2 p-2'), styles.widthLogo]}
        src='/images/logo2.png'
      ></Image>
    </View>
  </View>
)
export const Footer = () => (
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
