import { useStore } from '@nanostores/react'
import DashboardCustomer from '../Components/Dashboard/DashboardCustomer'
import DashboardMmcs from '../Components/Dashboard/DashboardMmcs'
import { userStore } from 'src/store/userStore'

const Dashboard = () => {
  const $userStore = useStore(userStore)
  const customerId = $userStore.customer?.id ?? null

  if (customerId) return <DashboardCustomer />

  return <DashboardMmcs />
}

export default Dashboard
