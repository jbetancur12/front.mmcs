// Modern Table Pagination Component
import React from 'react'
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  Typography,
  FormControl
} from '@mui/material'
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon
} from '@mui/icons-material'

interface TablePaginationProps {
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

const TablePagination: React.FC<TablePaginationProps> = ({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50]
}) => {
  const totalPages = Math.ceil(totalItems / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const handleFirstPage = () => onPageChange(1)
  const handlePrevPage = () => onPageChange(Math.max(1, currentPage - 1))
  const handleNextPage = () =>
    onPageChange(Math.min(totalPages, currentPage + 1))
  const handleLastPage = () => onPageChange(totalPages)

  if (totalItems === 0) {
    return null
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 2,
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        borderRadius: '0 0 12px 12px'
      }}
    >
      {/* Items per page selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant='body2' color='text.secondary'>
          Elementos por página:
        </Typography>
        <FormControl size='small' sx={{ minWidth: 80 }}>
          <Select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            variant='outlined'
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Page info and navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant='body2' color='text.secondary'>
          {startItem}-{endItem} de {totalItems}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={handleFirstPage}
            disabled={currentPage === 1}
            size='small'
            title='Primera página'
          >
            <FirstPageIcon />
          </IconButton>

          <IconButton
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            size='small'
            title='Página anterior'
          >
            <PrevIcon />
          </IconButton>

          <Box
            sx={{
              minWidth: 100,
              textAlign: 'center',
              padding: '4px 8px',
              backgroundColor: 'grey.50',
              borderRadius: 1,
              margin: '0 8px'
            }}
          >
            <Typography variant='body2' sx={{ fontWeight: 500 }}>
              Página {currentPage} de {totalPages}
            </Typography>
          </Box>

          <IconButton
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            size='small'
            title='Página siguiente'
          >
            <NextIcon />
          </IconButton>

          <IconButton
            onClick={handleLastPage}
            disabled={currentPage === totalPages}
            size='small'
            title='Última página'
          >
            <LastPageIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}

export default TablePagination
