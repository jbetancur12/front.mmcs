// Enhanced Templates Table Component with Modern Styling, Accessibility and Performance
import React, { useState, useMemo, memo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  InputAdornment,
  Box,
  Typography,
  Chip,
  Skeleton
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { TemplatesData, TemplateData } from './types'
import TemplateActions from './TemplateActions'
import EditTemplateModal from './EditTemplateModal'
import AdvancedFilters, { FilterOptions } from './AdvancedFilters'
import useDebounce from './hooks/useDebounce'
import TablePagination from './TablePagination'
// import TemplateRow from './TemplateRow'
import {
  useAccessibility,
  useKeyboardNavigation
} from './hooks/useAccessibility'
import {
  useStableCallback,
  usePerformanceMonitor
} from './hooks/usePerformance'
import { ModernTableContainer, ModernTableRow, ModernTextField } from './styles'

interface TemplatesTableProps {
  templates: TemplatesData[]
  loading: boolean
  onUpdate: (id: number, templateData: TemplateData) => Promise<boolean>
  onDelete: (id: number) => void
  onDuplicate: (template: TemplatesData) => void
}

type SortField = keyof TemplatesData
type SortDirection = 'asc' | 'desc'

const TemplatesTable: React.FC<TemplatesTableProps> = ({
  templates,
  loading,
  onUpdate,
  onDelete,
  onDuplicate
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [templateToEdit, setTemplateToEdit] = useState<TemplatesData | null>(
    null
  )
  const [filters, setFilters] = useState<FilterOptions>({
    searchFields: [
      'name',
      'description',
      'city',
      'location',
      'sede',
      'instrumento'
    ],
    sortBy: 'all',
    hasDescription: 'all',
    hasPassword: 'all'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Accessibility hooks
  const { announce } = useAccessibility({ announceChanges: true })
  const { containerRef, focusedIndex } = useKeyboardNavigation(
    templates.length,
    (index) => {
      const template = templates[index]
      if (template) {
        announce(`Plantilla seleccionada: ${template.name}`)
      }
    }
  )

  // Performance monitoring
  usePerformanceMonitor('TemplatesTable')

  // Debounced search term for performance optimization
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Advanced filter, sort, and paginate templates
  const { filteredTemplates, paginatedTemplates } = useMemo(() => {
    let filtered = templates.filter((template) => {
      // Text search filter
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase()
        const matchesSearch = filters.searchFields.some((field) => {
          const value = template[field as keyof TemplatesData]
          return value?.toString().toLowerCase().includes(searchLower)
        })
        if (!matchesSearch) return false
      }

      // Description filter
      if (filters.hasDescription !== 'all') {
        const hasDesc =
          template.description && template.description.trim().length > 0
        if (filters.hasDescription === 'yes' && !hasDesc) return false
        if (filters.hasDescription === 'no' && hasDesc) return false
      }

      // Password filter
      if (filters.hasPassword !== 'all') {
        const hasPass = template.password && template.password.trim().length > 0
        if (filters.hasPassword === 'yes' && !hasPass) return false
        if (filters.hasPassword === 'no' && hasPass) return false
      }

      return true
    })

    // Sort templates
    filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0
      if (aValue === undefined) return sortDirection === 'asc' ? 1 : -1
      if (bValue === undefined) return sortDirection === 'asc' ? -1 : 1

      // Handle date sorting
      if (sortField === 'created_at') {
        const aDate = new Date(aValue as string).getTime()
        const bDate = new Date(bValue as string).getTime()
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate
      }

      // Handle string/number sorting
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    // Paginate results
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginated = filtered.slice(startIndex, endIndex)

    return {
      filteredTemplates: filtered,
      paginatedTemplates: paginated
    }
  }, [
    templates,
    debouncedSearchTerm,
    filters,
    sortField,
    sortDirection,
    currentPage,
    pageSize
  ])

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, filters])

  const handleSort = useStableCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        announce(
          `Tabla ordenada por ${field} ${sortDirection === 'asc' ? 'descendente' : 'ascendente'}`
        )
      } else {
        setSortField(field)
        setSortDirection('asc')
        announce(`Tabla ordenada por ${field} ascendente`)
      }
      setCurrentPage(1) // Reset to first page when sorting
    },
    [sortField, sortDirection, announce]
  )

  const handleEdit = useStableCallback((template: TemplatesData) => {
    setTemplateToEdit(template)
    setEditModalOpen(true)
  }, [])

  const handleEditSubmit = async (
    templateData: TemplateData
  ): Promise<boolean> => {
    if (templateToEdit) {
      const success = await onUpdate(templateToEdit.id, templateData)
      if (success) {
        setEditModalOpen(false)
        setTemplateToEdit(null)
      }
      return success
    }
    return false
  }

  // const formatDate = (dateString: string | Date) => {
  //   const date = new Date(dateString)
  //   return date.toLocaleDateString('es-ES', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric',
  //   })
  // }

  return (
    <Box
      ref={containerRef}
      role='region'
      aria-label='Tabla de plantillas de mapeo Excel'
      id='templates-table'
    >
      {/* Search Bar */}
      <Box sx={{ marginBottom: 3 }} id='search-filters'>
        <ModernTextField
          fullWidth
          placeholder='Buscar plantillas por nombre, descripción, referencias de celdas...'
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            announce(`Buscando: ${e.target.value}`, 'polite')
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon color='action' />
              </InputAdornment>
            )
          }}
          sx={{ maxWidth: 500 }}
          aria-label='Buscar plantillas'
          aria-describedby='search-help'
        />
        <Typography
          id='search-help'
          variant='body2'
          color='text.secondary'
          sx={{ mt: 1, fontSize: '0.875rem' }}
        >
          Busca por nombre, descripción, ciudad, ubicación, sede, instrumento o
          referencias de celdas Excel
        </Typography>
      </Box>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        templates={templates}
      />

      {/* Table Description for Screen Readers */}
      <Typography
        id='table-description'
        variant='body2'
        sx={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        Tabla con {filteredTemplates.length} plantillas de mapeo Excel. Usa las
        flechas del teclado para navegar y Enter para seleccionar. Cada fila
        contiene información de la plantilla y botones de acción.
      </Typography>

      {/* Table */}
      <ModernTableContainer>
        <Table
          aria-label='Tabla de plantillas de mapeo Excel'
          aria-describedby='table-description'
          role='table'
          aria-rowcount={filteredTemplates.length + 1}
        >
          <TableHead role='rowgroup'>
            <TableRow role='row' aria-rowindex={1}>
              <TableCell
                role='columnheader'
                scope='col'
                aria-sort={
                  sortField === 'id'
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <TableSortLabel
                  active={sortField === 'id'}
                  direction={sortField === 'id' ? sortDirection : 'asc'}
                  onClick={() => handleSort('id')}
                  aria-label={`Ordenar por ID ${sortField === 'id' ? (sortDirection === 'asc' ? 'descendente' : 'ascendente') : 'ascendente'}`}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell
                role='columnheader'
                scope='col'
                aria-sort={
                  sortField === 'name'
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <TableSortLabel
                  active={sortField === 'name'}
                  direction={sortField === 'name' ? sortDirection : 'asc'}
                  onClick={() => handleSort('name')}
                  aria-label={`Ordenar por nombre ${sortField === 'name' ? (sortDirection === 'asc' ? 'descendente' : 'ascendente') : 'ascendente'}`}
                >
                  Nombre
                </TableSortLabel>
              </TableCell>
              <TableCell
                role='columnheader'
                scope='col'
                className='hide-mobile'
              >
                Descripción
              </TableCell>
              <TableCell
                role='columnheader'
                scope='col'
                aria-sort={
                  sortField === 'city'
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <TableSortLabel
                  active={sortField === 'city'}
                  direction={sortField === 'city' ? sortDirection : 'asc'}
                  onClick={() => handleSort('city')}
                  aria-label={`Ordenar por ciudad ${sortField === 'city' ? (sortDirection === 'asc' ? 'descendente' : 'ascendente') : 'ascendente'}`}
                >
                  Ciudad (Celda)
                </TableSortLabel>
              </TableCell>
              <TableCell className='hide-tablet'>Ubicación (Celda)</TableCell>
              <TableCell className='hide-tablet'>Sede (Celda)</TableCell>
              <TableCell className='hide-mobile'>Instrumento (Celda)</TableCell>
              <TableCell className='hide-mobile'>
                <TableSortLabel
                  active={sortField === 'calibrationDate'}
                  direction={
                    sortField === 'calibrationDate' ? sortDirection : 'asc'
                  }
                  onClick={() => handleSort('calibrationDate')}
                >
                  Fecha Calibración (Celda)
                </TableSortLabel>
              </TableCell>
              <TableCell align='center'>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody role='rowgroup'>
            {loading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, index) => (
                <ModernTableRow key={index}>
                  <TableCell>
                    <Skeleton width={40} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={120} />
                  </TableCell>
                  <TableCell className='hide-mobile'>
                    <Skeleton width={200} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={100} />
                  </TableCell>
                  <TableCell className='hide-tablet'>
                    <Skeleton width={100} />
                  </TableCell>
                  <TableCell className='hide-tablet'>
                    <Skeleton width={80} />
                  </TableCell>
                  <TableCell className='hide-mobile'>
                    <Skeleton width={120} />
                  </TableCell>
                  <TableCell className='hide-mobile'>
                    <Skeleton width={100} />
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}
                    >
                      <Skeleton variant='circular' width={32} height={32} />
                      <Skeleton variant='circular' width={32} height={32} />
                      <Skeleton variant='circular' width={32} height={32} />
                    </Box>
                  </TableCell>
                </ModernTableRow>
              ))
            ) : paginatedTemplates.length === 0 ? (
              <ModernTableRow>
                <TableCell colSpan={9} align='center' sx={{ padding: 6 }}>
                  <Typography variant='body1' color='text.secondary'>
                    {debouncedSearchTerm
                      ? 'No se encontraron plantillas que coincidan con la búsqueda'
                      : 'No hay plantillas disponibles'}
                  </Typography>
                </TableCell>
              </ModernTableRow>
            ) : (
              paginatedTemplates.map((template, index) => (
                <ModernTableRow
                  key={template.id}
                  role='row'
                  aria-rowindex={index + 2}
                  tabIndex={focusedIndex === index ? 0 : -1}
                  data-keyboard-nav-item
                  aria-label={`Plantilla ${template.name}, ID ${template.id}`}
                  sx={{
                    '&:focus': {
                      outline: `2px solid #10b981`,
                      outlineOffset: '-2px'
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant='body2' fontWeight='medium'>
                      #{template.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant='body2' fontWeight='medium'>
                        {template.name}
                      </Typography>
                      {template.duplicated_from && (
                        <Chip
                          label='Duplicada'
                          size='small'
                          color='info'
                          sx={{ marginTop: 0.5, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell className='hide-mobile'>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={template.description}
                    >
                      {template.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>{template.city}</Typography>
                  </TableCell>
                  <TableCell className='hide-tablet'>
                    <Typography variant='body2' color='text.secondary'>
                      {template.location}
                    </Typography>
                  </TableCell>
                  <TableCell className='hide-tablet'>
                    <Typography variant='body2' color='text.secondary'>
                      {template.sede}
                    </Typography>
                  </TableCell>
                  <TableCell className='hide-mobile'>
                    <Typography variant='body2' color='text.secondary'>
                      {template.instrumento}
                    </Typography>
                  </TableCell>
                  <TableCell className='hide-mobile'>
                    <Typography variant='body2' color='text.secondary'>
                      {template.calibrationDate || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align='center'>
                    <TemplateActions
                      template={template}
                      onEdit={handleEdit}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                    />
                  </TableCell>
                </ModernTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ModernTableContainer>

      {/* Pagination */}
      {!loading && filteredTemplates.length > 0 && (
        <TablePagination
          totalItems={filteredTemplates.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize)
            setCurrentPage(1) // Reset to first page when changing page size
          }}
        />
      )}

      {/* Results Summary */}
      {!loading && (
        <Box sx={{ marginTop: 2, textAlign: 'center' }}>
          <Typography variant='body2' color='text.secondary'>
            {debouncedSearchTerm ||
            filters.hasDescription !== 'all' ||
            filters.hasPassword !== 'all' ? (
              <>
                Mostrando {filteredTemplates.length} plantillas filtradas de{' '}
                {templates.length} totales
                {debouncedSearchTerm && (
                  <Chip
                    label={`Búsqueda: "${debouncedSearchTerm}"`}
                    size='small'
                    sx={{ marginLeft: 1 }}
                    onDelete={() => setSearchTerm('')}
                  />
                )}
              </>
            ) : (
              `Total: ${templates.length} plantillas`
            )}
          </Typography>
        </Box>
      )}

      {/* Edit Template Modal */}
      {templateToEdit && (
        <EditTemplateModal
          open={editModalOpen}
          template={templateToEdit}
          onClose={() => {
            setEditModalOpen(false)
            setTemplateToEdit(null)
          }}
          onSubmit={handleEditSubmit}
        />
      )}
    </Box>
  )
}

export default memo(TemplatesTable)
