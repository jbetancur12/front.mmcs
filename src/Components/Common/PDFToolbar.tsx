// src/components/PDFToolbar.tsx
import React from 'react'
import { IconButton } from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download
} from '@mui/icons-material'

interface PDFToolbarProps {
  onPrevPage: () => void
  onNextPage: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onDownload: () => void
  currentPage: number
  totalPages: number
}

const PDFToolbar: React.FC<PDFToolbarProps> = ({
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onDownload,
  currentPage,
  totalPages
}) => {
  return (
    <div className='flex items-center justify-between p-4 bg-gray-800 text-white'>
      {/* Page Navigation */}
      <div className='flex items-center'>
        <IconButton onClick={onPrevPage} color='inherit'>
          <ChevronLeft />
        </IconButton>
        <span className='mx-2 text-sm'>
          {currentPage} / {totalPages}
        </span>
        <IconButton onClick={onNextPage} color='inherit'>
          <ChevronRight />
        </IconButton>
      </div>

      {/* Zoom Controls */}
      <div className='flex items-center'>
        <IconButton onClick={onZoomOut} color='inherit'>
          <ZoomOut />
        </IconButton>
        <IconButton onClick={onZoomIn} color='inherit'>
          <ZoomIn />
        </IconButton>
      </div>

      {/* Download Button */}
      <div className='flex items-center'>
        <IconButton onClick={onDownload} color='inherit'>
          <Download />
        </IconButton>
      </div>
    </div>
  )
}

export default PDFToolbar
