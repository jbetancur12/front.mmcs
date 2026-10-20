import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'

/** Pasos del formulario de cotización, en orden. */
export const WORKSPACE_SECTIONS = [
  { key: 'customer', label: 'Cliente y alcance', icon: <GroupOutlinedIcon sx={{ fontSize: 18 }} />, fields: ['customerId', 'requestChannel'] as const },
  { key: 'contact', label: 'Contacto y destino', icon: <Inventory2OutlinedIcon sx={{ fontSize: 18 }} />, fields: ['contactName', 'contactEmail', 'city'] as const },
  { key: 'terms', label: 'Términos', icon: <UploadFileOutlinedIcon sx={{ fontSize: 18 }} />, fields: [] as const },
  { key: 'items', label: 'Ítems cotizados', icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 18 }} />, fields: ['items'] as const },
  { key: 'commercial', label: 'Condiciones', icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} />, fields: ['paymentMethod', 'validityDays', 'instrumentDeliveryTime', 'certificateDeliveryTime'] as const },
] as const

// Pasos con obligatorios: allí se muestra el avance; los demás (contacto, términos) son opcionales
export const TRACKED_SECTIONS = [0, 3, 4]
