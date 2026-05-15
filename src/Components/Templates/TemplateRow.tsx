// Memoized Template Row Component for Performance
import React, { memo } from 'react'
import { TableCell, Typography, Chip } from '@mui/material'
import { TemplatesData } from './types'
import TemplateActions from './TemplateActions'
import { ModernTableRow } from './styles'
import { colors } from '../../theme/designSystem'

interface TemplateRowProps {
  template: TemplatesData
  index: number
  focusedIndex: number
  onEdit: (template: TemplatesData) => void
  onDelete: (id: number) => void
  onDuplicate: (template: TemplatesData) => void
}

const TemplateRow: React.FC<TemplateRowProps> = memo(
  ({ template, index, focusedIndex, onEdit, onDelete, onDuplicate }) => {
    return (
      <ModernTableRow
        role='row'
        aria-rowindex={index + 2}
        tabIndex={focusedIndex === index ? 0 : -1}
        data-keyboard-nav-item
        aria-label={`Plantilla ${template.name}, ID ${template.id}`}
        sx={{
          '&:focus': {
            outline: `2px solid ${colors.primary[500]}`,
            outlineOffset: '-2px'
          }
        }}
      >
        <TableCell role='gridcell'>{template.id}</TableCell>
        <TableCell role='gridcell'>
          <Typography variant='body2' fontWeight={600}>
            {template.name}
          </Typography>
        </TableCell>
        <TableCell role='gridcell' className='hide-mobile'>
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {template.description || 'Sin descripción'}
          </Typography>
        </TableCell>
        <TableCell role='gridcell'>
          <Chip
            label={template.city || 'No definido'}
            size='small'
            variant='outlined'
            sx={{
              backgroundColor: template.city
                ? colors.primary[50]
                : colors.gray[100],
              borderColor: template.city
                ? colors.primary[200]
                : colors.gray[300],
              color: template.city ? colors.primary[700] : colors.gray[600],
              fontSize: '0.75rem'
            }}
          />
        </TableCell>
        <TableCell role='gridcell' className='hide-tablet'>
          <Chip
            label={template.location || 'No definido'}
            size='small'
            variant='outlined'
            sx={{
              backgroundColor: template.location
                ? colors.success[50]
                : colors.gray[100],
              borderColor: template.location
                ? colors.primary[200]
                : colors.gray[300],
              color: template.location ? colors.success[600] : colors.gray[600],
              fontSize: '0.75rem'
            }}
          />
        </TableCell>
        <TableCell role='gridcell' className='hide-tablet'>
          <Chip
            label={template.sede || 'No definido'}
            size='small'
            variant='outlined'
            sx={{
              backgroundColor: template.sede
                ? colors.info[50]
                : colors.gray[100],
              borderColor: template.sede ? colors.info[400] : colors.gray[300],
              color: template.sede ? colors.info[600] : colors.gray[600],
              fontSize: '0.75rem'
            }}
          />
        </TableCell>
        <TableCell role='gridcell' className='hide-mobile'>
          <Chip
            label={template.instrumento || 'No definido'}
            size='small'
            variant='outlined'
            sx={{
              backgroundColor: template.instrumento
                ? colors.warning[50]
                : colors.gray[100],
              borderColor: template.instrumento
                ? colors.warning[400]
                : colors.gray[300],
              color: template.instrumento
                ? colors.warning[600]
                : colors.gray[600],
              fontSize: '0.75rem'
            }}
          />
        </TableCell>
        <TableCell role='gridcell' className='hide-mobile'>
          <Chip
            label={template.calibrationDate || 'No definido'}
            size='small'
            variant='outlined'
            sx={{
              backgroundColor: template.calibrationDate
                ? colors.primary[50]
                : colors.gray[100],
              borderColor: template.calibrationDate
                ? colors.primary[200]
                : colors.gray[300],
              color: template.calibrationDate
                ? colors.primary[600]
                : colors.gray[600],
              fontSize: '0.75rem'
            }}
          />
        </TableCell>
        <TableCell role='gridcell'>
          <TemplateActions
            template={template}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        </TableCell>
      </ModernTableRow>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo
    return (
      prevProps.template.id === nextProps.template.id &&
      prevProps.template.name === nextProps.template.name &&
      prevProps.template.description === nextProps.template.description &&
      prevProps.template.city === nextProps.template.city &&
      prevProps.template.location === nextProps.template.location &&
      prevProps.template.sede === nextProps.template.sede &&
      prevProps.template.instrumento === nextProps.template.instrumento &&
      prevProps.template.calibrationDate ===
        nextProps.template.calibrationDate &&
      prevProps.focusedIndex === nextProps.focusedIndex &&
      prevProps.index === nextProps.index
    )
  }
)

TemplateRow.displayName = 'TemplateRow'

export default TemplateRow
