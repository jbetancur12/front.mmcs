import { useState } from 'react'
import { WORKSPACE_SECTIONS } from './calibrationServiceWorkspaceSections'

/** Paso activo del formulario y desplazamiento al inicio al cambiar de paso. */
const useCalibrationServiceWorkspaceNavigation = () => {
  const [activeSection, setActiveSection] = useState(0)

  const goToSection = (index: number) => {
    setActiveSection(Math.min(Math.max(index, 0), WORKSPACE_SECTIONS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return { activeSection, setActiveSection, goToSection }
}

export type CalibrationServiceWorkspaceNavigation = ReturnType<
  typeof useCalibrationServiceWorkspaceNavigation
>

export default useCalibrationServiceWorkspaceNavigation
