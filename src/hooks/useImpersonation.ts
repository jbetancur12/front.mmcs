import { useCallback, useState } from 'react'
import { axiosPrivate } from '@utils/api'
import toast from 'react-hot-toast'

interface ImpersonationUser {
  id: number
  name: string
  email: string
  roles: string[]
  customerId?: number | null
  customerName?: string | null
  userType: 'client' | 'internal'
}

interface ImpersonationState {
  isImpersonating: boolean
  impersonator: { id: number; name: string } | null
  targetUser: ImpersonationUser | null
}

const STORAGE_KEY_IMPERSONATOR = 'impersonator'
const STORAGE_KEY_TARGET = 'impersonationTarget'

const loadState = (): ImpersonationState => {
  try {
    const impersonatorData = localStorage.getItem(STORAGE_KEY_IMPERSONATOR)
    const targetData = localStorage.getItem(STORAGE_KEY_TARGET)
    if (impersonatorData && targetData) {
      return {
        isImpersonating: true,
        impersonator: JSON.parse(impersonatorData),
        targetUser: JSON.parse(targetData),
      }
    }
  } catch {}
  return { isImpersonating: false, impersonator: null, targetUser: null }
}

export const useImpersonation = () => {
  const [state, setState] = useState<ImpersonationState>(loadState)
  const [candidates, setCandidates] = useState<ImpersonationUser[]>([])
  const [searching, setSearching] = useState(false)

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCandidates([])
      return
    }
    setSearching(true)
    try {
      const response = await axiosPrivate.get<ImpersonationUser[]>(
        '/users/impersonation/candidates',
        { params: { q: query } }
      )
      setCandidates(response.data)
    } catch {
      setCandidates([])
    } finally {
      setSearching(false)
    }
  }, [])

  const startImpersonation = useCallback(async (userId: number) => {
    toast.loading('Suplantando usuario...', { id: 'impersonation' })
    try {
      const response = await axiosPrivate.post(`/auth/impersonate/${userId}`)
      const { token, user, impersonator } = response.data

      localStorage.setItem('accessToken', token)
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        rol: user.rol,
        userType: user.userType,
        customerId: user.customerId,
      }))
      localStorage.setItem(STORAGE_KEY_IMPERSONATOR, JSON.stringify(impersonator))
      localStorage.setItem(STORAGE_KEY_TARGET, JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.rol,
        customerId: user.customerId,
        userType: user.userType,
      }))

      toast.success(`Ahora operas como ${user.name}`, { id: 'impersonation' })

      setState({
        isImpersonating: true,
        impersonator,
        targetUser: {
          id: user.id, name: user.name, email: user.email,
          roles: user.rol, customerId: user.customerId, userType: user.userType,
        },
      })

      setTimeout(() => { window.location.href = '/' }, 500)
    } catch (error) {
      toast.error('No se pudo suplantar al usuario.', { id: 'impersonation' })
      console.error('Error starting impersonation:', error)
      throw error
    }
  }, [])

  const stopImpersonation = useCallback(async () => {
    toast.loading('Volviendo a tu sesión...', { id: 'impersonation' })
    try {
      const response = await axiosPrivate.post('/auth/impersonate/stop')
      const { token, user } = response.data

      localStorage.setItem('accessToken', token)
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        rol: user.rol,
        userType: user.userType,
      }))
      localStorage.removeItem(STORAGE_KEY_IMPERSONATOR)
      localStorage.removeItem(STORAGE_KEY_TARGET)

      toast.success(`De vuelta como ${user.name}`, { id: 'impersonation' })

      setState({
        isImpersonating: false,
        impersonator: null,
        targetUser: null,
      })

      setTimeout(() => { window.location.href = '/' }, 500)
    } catch (error) {
      console.error('Error stopping impersonation:', error)
    }
  }, [])

  return {
    ...state,
    candidates,
    searching,
    searchUsers,
    startImpersonation,
    stopImpersonation,
    clearSearch: () => setCandidates([]),
  }
}
