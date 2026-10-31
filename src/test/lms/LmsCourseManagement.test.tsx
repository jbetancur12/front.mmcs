import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'
import LmsCourseManagement from '../../pages/lms/admin/LmsCourseManagement'

// Mocks: vi.mock se eleva sobre los imports, así que lo que usan sus fábricas va en vi.hoisted
const { mockAxiosPrivate, mockNavigate } = vi.hoisted(() => ({
  mockAxiosPrivate: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  },
  mockNavigate: vi.fn()
}))

vi.mock('@utils/use-axios-private', () => ({
  __esModule: true,
  default: () => mockAxiosPrivate
}))

// lmsService llama a axiosPrivate de utils/api: sin esto intenta conectarse a localhost
vi.mock('src/utils/api', async () => ({
  ...(await vi.importActual<typeof import('src/utils/api')>('src/utils/api')),
  axiosPrivate: mockAxiosPrivate
}))

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
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
    vi.clearAllMocks()
    mockAxiosPrivate.get.mockImplementation(async (url: string) =>
      url.includes('certificates/templates')
        ? { data: [] }
        : { data: mockCourses }
    )
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