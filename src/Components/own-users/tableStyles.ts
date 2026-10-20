// Enhanced table styling with modern design system
export const modernTableStyles = {
  // Container styling with modern appearance
  '& .MuiPaper-root': {
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #e0e0e0',
    overflow: 'hidden'
  },

  // Header styling with modern colors and typography
  '& .MuiTableHead-root': {
    backgroundColor: '#f8fafc',
    '& .MuiTableCell-head': {
      fontWeight: 600,
      color: '#374151',
      borderBottom: '2px solid #e5e7eb',
      fontSize: '0.875rem',
      letterSpacing: '0.025em',
      textTransform: 'uppercase' as const
    }
  },

  // Row hover effects - simplified without extra animations
  '& .MuiTableBody-root .MuiTableRow-root': {
    transition: 'background-color 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: 'rgba(0, 191, 165, 0.04)'
    }
  },

  // Cell styling improvements
  '& .MuiTableCell-root': {
    borderBottom: '1px solid #f0f0f0',
    padding: '16px',
    '&:first-of-type': {
      paddingLeft: '24px'
    },
    '&:last-of-type': {
      paddingRight: '24px'
    }
  },

  // Action buttons container styling
  '& .action-buttons': {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: '4px',
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Enhanced button styling with micro-interactions
  '& .MuiIconButton-root': {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '12px',
    padding: '10px',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-3px) scale(1.05)',
      boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
    },
    '&:active': {
      transform: 'translateY(-1px) scale(0.98)',
      transition: 'all 0.1s ease-out'
    },
    '&.edit-button': {
      color: '#1976d2',
      '&:hover': {
        backgroundColor: '#e3f2fd',
        color: '#1565c0',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '0',
          height: '0',
          borderRadius: '50%',
          backgroundColor: 'rgba(25, 118, 210, 0.3)',
          transform: 'translate(-50%, -50%)',
          animation: 'ripple 0.6s ease-out',
          '@keyframes ripple': {
            '0%': {
              width: '0',
              height: '0',
              opacity: 1
            },
            '100%': {
              width: '40px',
              height: '40px',
              opacity: 0
            }
          }
        }
      }
    },
    '&.delete-button': {
      color: '#d32f2f',
      '&:hover': {
        backgroundColor: '#ffebee',
        color: '#c62828',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '0',
          height: '0',
          borderRadius: '50%',
          backgroundColor: 'rgba(211, 47, 47, 0.3)',
          transform: 'translate(-50%, -50%)',
          animation: 'ripple 0.6s ease-out'
        }
      }
    }
  }
}
