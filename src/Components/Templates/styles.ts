// Styled Components for Enhanced Templates System
import { styled } from '@mui/material/styles'
import {
  Button,
  IconButton,
  Box,
  Card,
  TableContainer,
  TableRow,
  Dialog,
  TextField
} from '@mui/material'
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  transitions
} from '../../theme/designSystem'

// Enhanced Create Button with gradient styling
export const CreateButton = styled(Button)(() => ({
  background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
  borderRadius: borderRadius.xl,
  textTransform: 'none',
  fontWeight: 600,
  padding: `${spacing[3]} ${spacing[6]}`,
  color: '#ffffff',
  boxShadow: shadows.sm,
  transition: `all ${transitions.duration.normal} ${transitions.easing.easeInOut}`,

  '&:hover': {
    background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)`,
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px rgba(16, 185, 129, 0.3)`
  },

  '&:active': {
    transform: 'translateY(0)'
  }
}))

// Secondary button for form actions
export const SecondaryButton = styled(Button)(() => ({
  borderRadius: borderRadius.xl,
  textTransform: 'none',
  fontWeight: 600,
  padding: `${spacing[3]} ${spacing[6]}`,
  backgroundColor: colors.gray[100],
  color: colors.gray[700],
  border: `1px solid ${colors.gray[300]}`,
  boxShadow: shadows.sm,
  transition: `all ${transitions.duration.normal} ${transitions.easing.easeInOut}`,

  '&:hover': {
    backgroundColor: colors.gray[200],
    borderColor: colors.gray[400],
    transform: 'translateY(-1px)',
    boxShadow: shadows.md
  },

  '&:active': {
    transform: 'translateY(0)'
  }
}))

// Primary form button (for submit actions)
export const PrimaryFormButton = styled(Button)(() => ({
  background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
  borderRadius: borderRadius.xl,
  textTransform: 'none',
  fontWeight: 600,
  padding: `${spacing[3]} ${spacing[6]}`,
  color: '#ffffff',
  boxShadow: shadows.sm,
  transition: `all ${transitions.duration.normal} ${transitions.easing.easeInOut}`,
  minWidth: '120px',

  '&:hover': {
    background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)`,
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px rgba(16, 185, 129, 0.3)`
  },

  '&:active': {
    transform: 'translateY(0)'
  },

  '&:disabled': {
    background: colors.gray[300],
    color: colors.gray[500],
    transform: 'none',
    boxShadow: 'none'
  }
}))

// Action buttons for table rows with touch-friendly design
export const ActionButton = styled(IconButton)(() => ({
  borderRadius: borderRadius.lg,
  padding: spacing[2],
  margin: `0 ${spacing[1]}`,
  transition: `all ${transitions.duration.normal} ${transitions.easing.easeInOut}`,
  minWidth: '40px',
  minHeight: '40px',

  '&:hover': {
    transform: 'scale(1.1)'
  },

  // Touch-friendly sizing on mobile
  '@media (max-width: 768px)': {
    padding: spacing[3],
    minWidth: '44px',
    minHeight: '44px',
    margin: `0 ${spacing[1]}`
  },

  // Larger touch targets on small screens
  '@media (hover: none)': {
    minWidth: '48px',
    minHeight: '48px'
  }
}))

// Duplicate button with specific styling
export const DuplicateButton = styled(ActionButton)(() => ({
  color: colors.info[500],

  '&:hover': {
    backgroundColor: colors.info[50],
    color: colors.info[600]
  }
}))

// Edit button styling
export const EditButton = styled(ActionButton)(() => ({
  color: colors.gray[600],

  '&:hover': {
    backgroundColor: colors.gray[100],
    color: colors.gray[700]
  }
}))

// Delete button styling
export const DeleteButton = styled(ActionButton)(() => ({
  color: colors.error[500],

  '&:hover': {
    backgroundColor: colors.error[50],
    color: colors.error[600]
  }
}))

// Enhanced table container with modern styling and responsive design
export const ModernTableContainer = styled(TableContainer)(() => ({
  borderRadius: borderRadius.xl,
  border: `1px solid ${colors.gray[200]}`,
  boxShadow: shadows.base,
  overflow: 'hidden',

  '& .MuiTableHead-root': {
    backgroundColor: colors.gray[50]
  },

  '& .MuiTableCell-root': {
    borderBottom: `1px solid ${colors.gray[100]}`,
    padding: spacing[4],
    fontSize: '0.875rem',

    // Responsive padding
    '@media (max-width: 768px)': {
      padding: spacing[2],
      fontSize: '0.8rem'
    },

    '@media (max-width: 480px)': {
      padding: spacing[1],
      fontSize: '0.75rem'
    }
  },

  '& .MuiTableCell-head': {
    fontWeight: 600,
    color: colors.gray[700],
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',

    '@media (max-width: 768px)': {
      fontSize: '0.7rem'
    }
  },

  // Hide less important columns on smaller screens
  '& .hide-mobile': {
    '@media (max-width: 768px)': {
      display: 'none'
    }
  },

  '& .hide-tablet': {
    '@media (max-width: 1024px)': {
      display: 'none'
    }
  },

  // Horizontal scroll on mobile
  '@media (max-width: 768px)': {
    overflowX: 'auto'
  }
}))

// Enhanced table row with hover effects
export const ModernTableRow = styled(TableRow)(() => ({
  transition: `background-color ${transitions.duration.normal} ${transitions.easing.easeInOut}`,

  '&:hover': {
    backgroundColor: colors.primary[50],

    '& .MuiTableCell-root': {
      borderBottomColor: colors.primary[100]
    }
  },

  '&:last-child .MuiTableCell-root': {
    borderBottom: 'none'
  }
}))

// Modern card component with elevation effects
export const ModernCard = styled(Card)(() => ({
  borderRadius: borderRadius.xl,
  padding: spacing[6],
  border: `1px solid ${colors.gray[200]}`,
  boxShadow: shadows.base,
  transition: `all ${transitions.duration.normal} ${transitions.easing.easeInOut}`,

  '&:hover': {
    borderColor: colors.primary[200],
    transform: 'translateY(-2px)',
    boxShadow: shadows.lg
  }
}))

// Enhanced modal dialog styling
export const ModernDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    borderRadius: borderRadius['2xl'],
    padding: spacing[2],
    minWidth: '500px',
    maxWidth: '600px',
    boxShadow: shadows.xl
  },

  '& .MuiDialogTitle-root': {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: colors.gray[900],
    textAlign: 'center',
    paddingBottom: spacing[4],
    borderBottom: `1px solid ${colors.gray[200]}`,
    marginBottom: spacing[6]
  },

  '& .MuiDialogContent-root': {
    padding: spacing[6],
    paddingTop: '0 !important'
  },

  '& .MuiDialogActions-root': {
    padding: spacing[6],
    paddingTop: spacing[4],
    borderTop: `1px solid ${colors.gray[200]}`,
    gap: spacing[3]
  }
}))

// Form section container
export const FormSection = styled(Box)(() => ({
  marginBottom: spacing[6],

  '& .MuiTextField-root': {
    marginBottom: spacing[4]
  }
}))

// Field group for visual organization
export const FieldGroup = styled(Box)(() => ({
  padding: spacing[6],
  backgroundColor: colors.gray[50],
  borderRadius: borderRadius.lg,
  marginBottom: spacing[6],
  border: `1px solid ${colors.gray[200]}`,

  '& .MuiTypography-root': {
    marginBottom: spacing[4],
    fontWeight: 600,
    color: colors.gray[700]
  }
}))

// Enhanced text field styling
export const ModernTextField = styled(TextField)(() => ({
  marginBottom: spacing[3],

  '& .MuiOutlinedInput-root': {
    borderRadius: borderRadius.lg,
    transition: `all ${transitions.duration.normal} ${transitions.easing.easeInOut}`,

    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: colors.primary[300]
    },

    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: colors.primary[500],
      borderWidth: '2px'
    }
  },

  '& .MuiInputLabel-root': {
    color: colors.gray[600],

    '&.Mui-focused': {
      color: colors.primary[500]
    }
  }
}))

// Loading skeleton container
export const SkeletonContainer = styled(Box)(() => ({
  padding: spacing[4],

  '& .MuiSkeleton-root': {
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2]
  }
}))

// Empty state container
export const EmptyStateContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing[12],
  textAlign: 'center',

  '& .MuiSvgIcon-root': {
    fontSize: '4rem',
    color: colors.gray[400],
    marginBottom: spacing[4]
  },

  '& .MuiTypography-h5': {
    color: colors.gray[700],
    marginBottom: spacing[2]
  },

  '& .MuiTypography-body1': {
    color: colors.gray[500],
    marginBottom: spacing[6]
  }
}))

// Action buttons container
export const ActionButtonsContainer = styled(Box)(() => ({
  display: 'flex',
  gap: spacing[2],
  justifyContent: 'center',
  alignItems: 'center'
}))

// Page header container
export const PageHeader = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing[6],
  padding: spacing[6],
  backgroundColor: '#ffffff',
  borderRadius: borderRadius.xl,
  border: `1px solid ${colors.gray[200]}`,
  boxShadow: shadows.sm
}))

// Content container with proper spacing
export const ContentContainer = styled(Box)(() => ({
  padding: spacing[6],
  backgroundColor: colors.gray[50],
  minHeight: '100vh'
}))

// CSS Animations with Reduced Motion Support
export const globalAnimations = `
  /* Fade In Animation */
  @keyframes fadeIn {
    from { 
      opacity: 0; 
    }
    to { 
      opacity: 1; 
    }
  }

  /* Slide Up Animation */
  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }

  /* Slide Down Animation */
  @keyframes slideDown {
    from { 
      opacity: 0; 
      transform: translateY(-20px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }

  /* Scale In Animation */
  @keyframes scaleIn {
    from { 
      opacity: 0; 
      transform: scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: scale(1); 
    }
  }

  /* Pulse Animation */
  @keyframes pulse {
    0%, 100% { 
      opacity: 1; 
    }
    50% { 
      opacity: 0.7; 
    }
  }

  /* Pulse Low Intensity */
  @keyframes pulse-low {
    0%, 100% { 
      opacity: 1; 
    }
    50% { 
      opacity: 0.9; 
    }
  }

  /* Pulse High Intensity */
  @keyframes pulse-high {
    0%, 100% { 
      opacity: 1; 
    }
    50% { 
      opacity: 0.5; 
    }
  }

  /* Shimmer Loading Animation */
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }

  /* Bounce Animation */
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0, 0, 0);
    }
    40%, 43% {
      transform: translate3d(0, -8px, 0);
    }
    70% {
      transform: translate3d(0, -4px, 0);
    }
    90% {
      transform: translate3d(0, -2px, 0);
    }
  }

  /* Shake Animation */
  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: translateX(-2px);
    }
    20%, 40%, 60%, 80% {
      transform: translateX(2px);
    }
  }

  /* Respect reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Focus visible styles for better accessibility */
  .focus-visible {
    outline: 2px solid ${colors.primary[500]};
    outline-offset: 2px;
  }

  /* Screen reader only class */
  .sr-only {
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
`

// Animated styled components
export const AnimatedCard = styled(ModernCard)(() => ({
  animation: 'fadeIn 300ms ease-out',
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none'
  }
}))

export const AnimatedButton = styled(CreateButton)(() => ({
  transition: `all ${transitions.duration.fast} ${transitions.easing.easeInOut}`,
  '&:hover': {
    transform: 'translateY(-1px)',
    '@media (prefers-reduced-motion: reduce)': {
      transform: 'none'
    }
  },
  '&:active': {
    transform: 'translateY(0)',
    '@media (prefers-reduced-motion: reduce)': {
      transform: 'none'
    }
  }
}))

export const AnimatedTableRow = styled(ModernTableRow)(() => ({
  animation: 'slideUp 200ms ease-out',
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none'
  }
}))
