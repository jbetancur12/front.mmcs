import { useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import '../lms/shared/quill-custom.css'

interface CalibrationServiceRichTextEditorProps {
  value: string
  disabled?: boolean
  placeholder?: string
  onChange: (value: string) => void
}

const quillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean']
  ]
}

const quillFormats = ['header', 'bold', 'italic', 'underline', 'list']

const CalibrationServiceRichTextEditor = ({
  value,
  disabled = false,
  placeholder,
  onChange
}: CalibrationServiceRichTextEditorProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const quillRef = useRef<Quill | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return

    const host = document.createElement('div')
    containerRef.current.appendChild(host)

    const quill = new Quill(host, {
      theme: 'snow',
      modules: quillModules,
      formats: quillFormats,
      placeholder
    })

    quill.root.innerHTML = value || ''
    quill.enable(!disabled)
    quill.on('text-change', () => {
      onChangeRef.current(quill.root.innerHTML)
    })
    quillRef.current = quill

    return () => {
      quillRef.current = null
      if (containerRef.current && host.parentNode === containerRef.current) {
        containerRef.current.removeChild(host)
      }
    }
  }, [])

  useEffect(() => {
    quillRef.current?.enable(!disabled)
  }, [disabled])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return

    const nextValue = value || ''
    if (quill.root.innerHTML !== nextValue) {
      const selection = quill.getSelection()
      quill.root.innerHTML = nextValue
      if (selection) {
        quill.setSelection(selection)
      }
    }
  }, [value])

  return (
    <Box
      ref={containerRef}
      className='quill-editor-shell'
      sx={{
        '& .ql-editor': {
          minHeight: 140
        }
      }}
    />
  )
}

export default CalibrationServiceRichTextEditor
