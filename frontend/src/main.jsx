import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ErrorProvider } from './contextos/ErrorContext'
import { useError } from './hooks/useError'
import { obtenerMensajeError } from './lib/errores'
import AppErrorBoundary from './componentes/AppErrorBoundary'

function AppWithSafety() {
  const { addError, clearErrors } = useError()

  useEffect(() => {
    const manejarErrorGlobal = (event) => {
      if (event.error?.__notified) {
        return
      }

      console.error('Error global no controlado:', event.error ?? event.message)
      addError(
        obtenerMensajeError(event.error ?? event.message, 'An unexpected application error occurred.'),
        'error',
        { timeoutMs: 7000 }
      )
    }

    const manejarPromesaNoControlada = (event) => {
      if (event.reason?.__notified) {
        event.preventDefault?.()
        return
      }

      console.error('Promesa rechazada no controlada:', event.reason)
      event.preventDefault?.()
      addError(
        obtenerMensajeError(event.reason, 'An unexpected application error occurred.'),
        'error',
        { timeoutMs: 7000 }
      )
    }

    window.addEventListener('error', manejarErrorGlobal)
    window.addEventListener('unhandledrejection', manejarPromesaNoControlada)

    return () => {
      window.removeEventListener('error', manejarErrorGlobal)
      window.removeEventListener('unhandledrejection', manejarPromesaNoControlada)
    }
  }, [addError])

  return (
    <AppErrorBoundary
      getMessage={(error) => obtenerMensajeError(error, 'The application encountered an unexpected error.')}
      onError={(error, info) => {
        console.error('Error de render en React:', error, info)
        addError(
          obtenerMensajeError(error, 'The application encountered an unexpected error.'),
          'error',
          { timeoutMs: 8000 }
        )
      }}
      onReset={clearErrors}
    >
      <App />
    </AppErrorBoundary>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorProvider>
      <AppWithSafety />
    </ErrorProvider>
  </StrictMode>,
)
