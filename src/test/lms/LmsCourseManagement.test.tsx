import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'
import LmsCourseManagement from '../../pages/lms/admin/LmsCourseManagement'

// Mock axios
const mockAxiosPrivate = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn()
}

jest.mock('@utils/use-axios-private', () => ({
  __esModule: true,
  default: () => mockAxiosPrivate
}))

// Mock react-router-dom
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))

const theme = createTheme()

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {component}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const mockCourses = {
  courses: [
    {
      id: 1,
      title: 'JavaScript Fundamentals',
      description: 'Learn the basics of JavaScript programming',
      slug: 'javascript-fundamentals',
      status: 'published',
      audience: 'internal',
      is_mandatory: true,
      has_certificate: true,
      estimated_duration_minutes: 120,
      created_by: 1,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      _count: {
        modules: 3,
        assignments: 1,
        progress: 25
      }
    },
    {
      id: 2,
      title: 'React Development',
      description: 'Advanced React concepts and patterns',
      slug: 'react-development',
      status: 'draft',
      audience: 'both',
      is_mandatory: false,
      has_certificate: false,
      estimated_duration_minutes: 180,
      created_by: 1,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z',
      _count: {
        modules: 2,
        assignments: 0,
        progress: 0
      }
    }
  ],
  total: 2
}

describe('LmsCourseManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAxiosPrivate.get.mockResolvedValue({ data: mockCourses })
  })

  it('renders course management interface', async () => {
    renderWithProviders(<LmsCourseManagement />)

    expect(screen.getByText('Gestión de Cursos')).toBeInTheDocument()
    expect(screen.getByText('Crear Curso')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument()
      expect(screen.getByText('React Development')).toBeInTheDocument()
    })
  })

  it('displays course information correctly', async () => {
    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      // Check first course
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument()
      expect(screen.getByText('Learn the basics of JavaScript programming')).toBeInTheDocument()
      expect(screen.getByText('Obligatorio')).toBeInTheDocument()
      expect(screen.getByText('Con certificado')).toBeInTheDocument()
      expect(screen.getByText('2h 0m')).toBeInTheDocument()
      expect(screen.getByText('Publicado')).toBeInTheDocument()

      // Check second course
      expect(screen.getByText('React Development')).toBeInTheDocument()
      expect(screen.getByText('Advanced React concepts and patterns')).toBeInTheDocument()
      expect(screen.getByText('3h 0m')).toBeInTheDocument()
      expect(screen.getByText('Borrador')).toBeInTheDocument()
    })
  })

  it('opens create course dialog when create button is clicked', async () => {
    renderWithProviders(<LmsCourseManagement />)

    const createButton = screen.getByText('Crear Curso')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Crear Nuevo Curso')).toBeInTheDocument()
      expect(screen.getByLabelText('Título del curso')).toBeInTheDocument()
      expect(screen.getByLabelText('Descripción')).toBeInTheDocument()
      expect(screen.getByLabelText('Audiencia')).toBeInTheDocument()
    })
  })

  it('creates a new course successfully', async () => {
    mockAxiosPrivate.post.mockResolvedValue({ 
      data: { 
        id: 3, 
        title: 'New Course',
        description: 'New course description',
        audience: 'internal',
        is_mandatory: false,
        has_certificate: true,
        estimated_duration_minutes: 90
      } 
    })

    renderWithProviders(<LmsCourseManagement />)

    // Open create dialog
    const createButton = screen.getByText('Crear Curso')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Crear Nuevo Curso')).toBeInTheDocument()
    })

    // Fill form
    const titleInput = screen.getByLabelText('Título del curso')
    const descriptionInput = screen.getByLabelText('Descripción')
    const durationInput = screen.getByLabelText('Duración estimada (minutos)')

    fireEvent.change(titleInput, { target: { value: 'New Course' } })
    fireEvent.change(descriptionInput, { target: { value: 'New course description' } })
    fireEvent.change(durationInput, { target: { value: '90' } })

    // Submit form
    const saveButton = screen.getByText('Guardar')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockAxiosPrivate.post).toHaveBeenCalledWith('/lms/courses', {
        title: 'New Course',
        description: 'New course description',
        audience: 'internal',
        is_mandatory: false,
        has_certificate: false,
        estimated_duration_minutes: 90
      })
    })
  })

  it('opens edit dialog with course data', async () => {
    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument()
    })

    // Find and click edit button for first course
    const editButtons = screen.getAllByLabelText('Editar curso')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Editar Curso')).toBeInTheDocument()
      expect(screen.getByDisplayValue('JavaScript Fundamentals')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Learn the basics of JavaScript programming')).toBeInTheDocument()
    })
  })

  it('updates course successfully', async () => {
    mockAxiosPrivate.put.mockResolvedValue({ 
      data: { 
        id: 1,
        title: 'Updated Course Title',
        description: 'Updated description'
      } 
    })

    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument()
    })

    // Open edit dialog
    const editButtons = screen.getAllByLabelText('Editar curso')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Editar Curso')).toBeInTheDocument()
    })

    // Update title
    const titleInput = screen.getByDisplayValue('JavaScript Fundamentals')
    fireEvent.change(titleInput, { target: { value: 'Updated Course Title' } })

    // Submit form
    const saveButton = screen.getByText('Guardar')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockAxiosPrivate.put).toHaveBeenCalledWith('/lms/courses/1', expect.objectContaining({
        title: 'Updated Course Title'
      }))
    })
  })

  it('deletes course after confirmation', async () => {
    mockAxiosPrivate.delete.mockResolvedValue({ data: {} })
    
    // Mock window.confirm
    const originalConfirm = window.confirm
    window.confirm = jest.fn(() => true)

    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument()
    })

    // Find and click delete button
    const deleteButtons = screen.getAllByLabelText('Eliminar curso')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockAxiosPrivate.delete).toHaveBeenCalledWith('/lms/courses/1')
    })

    // Restore window.confirm
    window.confirm = originalConfirm
  })

  it('navigates to content editor when edit content is clicked', async () => {
    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument()
    })

    // Find and click edit content button
    const editContentButtons = screen.getAllByLabelText('Editar contenido')
    fireEvent.click(editContentButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith('/lms/admin/courses/1/content')
  })

  it('navigates to course preview when preview is clicked', async () => {
    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument()
    })

    // Find and click preview button
    const previewButtons = screen.getAllByLabelText('Vista previa')
    fireEvent.click(previewButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith('/lms/course/1/preview')
  })

  it('navigates to course assignments when assign is clicked', async () => {
    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument()
    })

    // Find and click assign button
    const assignButtons = screen.getAllByLabelText('Asignar curso')
    fireEvent.click(assignButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith('/lms/admin/courses/1/assignments')
  })

  it('navigates to analytics when analytics button is clicked', async () => {
    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument()
    })

    // Find and click analytics button
    const analyticsButtons = screen.getAllByLabelText('Ver analíticas')
    fireEvent.click(analyticsButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith('/lms/admin/analytics?courseId=1')
  })

  it('handles pagination correctly', async () => {
    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument()
    })

    // Check pagination component exists
    expect(screen.getByText('Filas por página:')).toBeInTheDocument()
    expect(screen.getByText('1–2 de 2')).toBeInTheDocument()
  })

  it('displays empty state when no courses exist', async () => {
    mockAxiosPrivate.get.mockResolvedValue({ data: { courses: [], total: 0 } })

    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      expect(screen.getByText('No hay cursos disponibles')).toBeInTheDocument()
      expect(screen.getByText('Crear primer curso')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockAxiosPrivate.get.mockRejectedValue(new Error('API Error'))

    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      expect(screen.getByText('Error al cargar los cursos. Por favor, intenta nuevamente.')).toBeInTheDocument()
    })
  })

  it('validates required fields in create form', async () => {
    renderWithProviders(<LmsCourseManagement />)

    // Open create dialog
    const createButton = screen.getByText('Crear Curso')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Crear Nuevo Curso')).toBeInTheDocument()
    })

    // Try to submit without filling required fields
    const saveButton = screen.getByText('Guardar')
    fireEvent.click(saveButton)

    // Form should not submit without required fields
    expect(mockAxiosPrivate.post).not.toHaveBeenCalled()
  })

  it('formats duration correctly', async () => {
    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      // 120 minutes should display as "2h 0m"
      expect(screen.getByText('2h 0m')).toBeInTheDocument()
      // 180 minutes should display as "3h 0m"
      expect(screen.getByText('3h 0m')).toBeInTheDocument()
    })
  })

  it('displays correct status colors and labels', async () => {
    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      // Published course should show "Publicado"
      expect(screen.getByText('Publicado')).toBeInTheDocument()
      // Draft course should show "Borrador"
      expect(screen.getByText('Borrador')).toBeInTheDocument()
    })
  })

  it('shows course features correctly', async () => {
    renderWithProviders(<LmsCourseManagement />)

    await waitFor(() => {
      // Mandatory course should show "Obligatorio" chip
      expect(screen.getByText('Obligatorio')).toBeInTheDocument()
      // Course with certificate should show "Con certificado" chip
      expect(screen.getByText('Con certificado')).toBeInTheDocument()
    })
  })
})