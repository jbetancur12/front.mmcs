import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Link,
  Stack,
  Typography
} from '@mui/material'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { useNavigate } from 'react-router-dom'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import { PERMISSIONS, PermissionKey } from 'src/constants/permissions'
import { PERMISSION_HELP } from 'src/constants/permissionHelp'
import { useCan } from '@utils/functions'
import CalibrationBillingGuide from '../CalibrationBillingGuide'
import {
  GUIDE_SECTIONS,
  GUIDE_TROUBLESHOOTING,
  GuideSection
} from './calibrationFlowGuideContent'

const TEAL = '#00BFA5'

/**
 * Aviso de qué permiso habilita una etapa. Quien administra los roles ve el nombre exacto de
 * la capacidad; el resto, un texto genérico, y si ya la tiene se lo dice.
 */
const PermissionNote = ({ needs }: { needs: PermissionKey[] }) => {
  const isAdmin = useCan(PERMISSIONS.RBAC_VIEW)
  const canDoIt = useCan(needs)

  return (
    <Alert
      severity={canDoIt ? 'success' : 'info'}
      icon={canDoIt ? <CheckCircleOutlineIcon /> : <LockOutlinedIcon />}
      sx={{ borderRadius: 2, '& b': { fontWeight: 700 } }}
    >
      {canDoIt ? (
        <>
          <b>Tú puedes hacer esto.</b>{' '}
        </>
      ) : null}
      {isAdmin ? (
        <>
          Se habilita con{' '}
          {needs.length > 1 ? 'alguno de estos permisos' : 'el permiso'}:{' '}
          {needs.map((key, index) => (
            <span key={key}>
              {index > 0 ? ', ' : ''}
              <b>{PERMISSION_HELP[key]?.[0] ?? key}</b>
            </span>
          ))}
          . Se concede en{' '}
          <Link href='/settings/roles' underline='hover'>
            Roles y permisos
          </Link>
          .
        </>
      ) : (
        <>
          Esta parte solo la ve y la hace quien tenga un permiso especial para
          ella. Si la necesitas y no aparece, pídesela a quien administra los
          roles.
        </>
      )}
    </Alert>
  )
}

const GuideImages = ({ section }: { section: GuideSection }) =>
  section.images?.length ? (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: 'minmax(0, 1fr)',
        justifyItems: 'center'
      }}
    >
      {section.images.map((image) => (
        <Box
          key={image.src}
          component='figure'
          sx={{ m: 0, width: '100%', maxWidth: image.mobile ? 280 : '100%' }}
        >
          <Box
            component='img'
            src={image.src}
            alt={image.caption}
            loading='lazy'
            sx={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}
          />
          <Typography
            component='figcaption'
            variant='caption'
            color='text.secondary'
          >
            {image.caption}
          </Typography>
        </Box>
      ))}
    </Box>
  ) : null

const SectionCard = ({
  section,
  index
}: {
  section: GuideSection
  index: number
}) => (
  <Card
    id={section.id}
    elevation={0}
    sx={{
      p: { xs: 2, md: 3 },
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      scrollMarginTop: 80
    }}
  >
    <Stack spacing={2}>
      <Stack direction='row' spacing={2} alignItems='center'>
        <Box
          aria-hidden
          sx={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: TEAL,
            color: '#fff',
            fontWeight: 700,
            display: 'grid',
            placeItems: 'center'
          }}
        >
          {index + 1}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='h6' fontWeight={700}>
            {section.title}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {section.summary}
          </Typography>
        </Box>
      </Stack>

      {section.where ? (
        <Chip
          size='small'
          variant='outlined'
          label={`Dónde: ${section.where}`}
          sx={{ alignSelf: 'flex-start' }}
        />
      ) : null}

      {section.steps?.length ? (
        <Box
          component='ol'
          sx={{
            m: 0,
            pl: 3,
            listStyle: 'decimal',
            '& li': { mb: 1 },
            '& li::marker': { color: TEAL, fontWeight: 700 }
          }}
        >
          {section.steps.map((step, stepIndex) => (
            <Typography key={stepIndex} component='li' variant='body2'>
              {step}
            </Typography>
          ))}
        </Box>
      ) : null}

      <GuideImages section={section} />

      {section.variants?.length ? (
        <Stack spacing={1}>
          {section.variants.map((variant) => (
            <Box
              key={variant.title}
              sx={{
                p: 1.5,
                bgcolor: '#f9fafb',
                borderRadius: 2,
                border: '1px solid #f3f4f6'
              }}
            >
              <Typography variant='subtitle2' fontWeight={700}>
                {variant.title}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {variant.text}
              </Typography>
            </Box>
          ))}
        </Stack>
      ) : null}

      {section.tips?.map((tip, tipIndex) => (
        <Typography key={tipIndex} variant='body2' color='text.secondary'>
          {tip}
        </Typography>
      ))}

      {section.billingGuide ? (
        <Box>
          <CalibrationBillingGuide />
        </Box>
      ) : null}

      {section.needs?.length ? <PermissionNote needs={section.needs} /> : null}
    </Stack>
  </Card>
)

/** Guía general del flujo de servicios de calibración, de la cotización al cierre. */
const CalibrationFlowGuidePage = () => {
  const navigate = useNavigate()
  const [active, setActive] = useState(GUIDE_SECTIONS[0].id)
  const navRef = useRef<HTMLElement | null>(null)

  // El layout envuelve las páginas en contenedores con overflow (auto/hidden) que no son los que
  // se desplazan; atrapan el `sticky` del índice. Mientras la guía está abierta se pasan a `clip`,
  // que recorta igual pero no crea un contenedor de scroll, y al salir se restauran.
  useEffect(() => {
    const changed: Array<[HTMLElement, string]> = []
    let element = navRef.current?.parentElement ?? null
    while (element && element !== document.body) {
      const { overflowY } = getComputedStyle(element)
      if (
        overflowY === 'auto' ||
        overflowY === 'hidden' ||
        overflowY === 'scroll'
      ) {
        changed.push([element, element.style.overflow])
        element.style.overflow = 'clip'
      }
      element = element.parentElement
    }
    return () =>
      changed.forEach(([node, value]) => (node.style.overflow = value))
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) {
          setActive(visible.target.id)
        }
      },
      { rootMargin: '-80px 0px -70% 0px' }
    )
    GUIDE_SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Guía del flujo de servicios'
        subtitle='De la cotización al cierre: qué se hace en cada etapa, dónde y quién puede hacerlo.'
        icon={<MenuBookOutlinedIcon />}
        actions={
          <Button
            variant='outlined'
            onClick={() => navigate('/calibration-services')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: '#00897B',
              borderColor: TEAL,
              '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
            }}
          >
            Volver a la bandeja
          </Button>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'start',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: '240px minmax(0, 1fr)'
          }
        }}
      >
        <Box
          component='nav'
          ref={navRef}
          aria-label='Índice de la guía'
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'sticky',
            top: 80,
            p: 1.5,
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            bgcolor: '#fff'
          }}
        >
          {GUIDE_SECTIONS.map((section, index) => (
            <Link
              key={section.id}
              href={`#${section.id}`}
              underline='none'
              sx={{
                display: 'block',
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                fontSize: 14,
                color: active === section.id ? '#00695C' : 'text.secondary',
                fontWeight: active === section.id ? 700 : 500,
                bgcolor: active === section.id ? '#E0F7F4' : 'transparent',
                '&:hover': { bgcolor: '#f3f4f6' }
              }}
            >
              {index + 1}. {section.title}
            </Link>
          ))}
        </Box>

        <Stack spacing={3}>
          {GUIDE_SECTIONS.map((section, index) => (
            <SectionCard key={section.id} section={section} index={index} />
          ))}

          <Card
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              border: '1px solid #e5e7eb',
              borderRadius: '16px'
            }}
          >
            <Typography variant='h6' fontWeight={700} sx={{ mb: 1.5 }}>
              Si algo no sale como esperabas
            </Typography>
            <Stack spacing={1.5}>
              {GUIDE_TROUBLESHOOTING.map((item) => (
                <Box key={item.problem}>
                  <Typography variant='subtitle2' fontWeight={700}>
                    {item.problem}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {item.answer}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Card>
        </Stack>
      </Box>
    </Container>
  )
}

export default CalibrationFlowGuidePage
