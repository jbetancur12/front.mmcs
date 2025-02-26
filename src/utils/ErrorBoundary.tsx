import React, { Component, ErrorInfo } from 'react'

interface Props {
  children: React.ReactNode
}
interface State {
  hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Error capturado en ErrorBoundary:', error)
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error capturado en ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <h1>Algo salió mal.</h1>
    }
    return this.props.children
  }
}

export default ErrorBoundary
