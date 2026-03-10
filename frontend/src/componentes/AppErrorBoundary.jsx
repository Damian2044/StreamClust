import React from 'react'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.props.onError?.(error, info)
  }

  handleRetry = () => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    const mensaje = this.props.getMessage?.(this.state.error)
      ?? 'The application encountered an unexpected error.'

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-white shadow-xl overflow-hidden">
          <div className="border-b border-red-100 bg-red-50 px-6 py-4">
            <h1 className="text-lg font-bold text-red-700">The application stopped because of an error</h1>
            <p className="mt-1 text-sm text-red-600">
              Execution was stopped to prevent the page from ending up in an inconsistent state.
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 whitespace-pre-wrap break-words">
              {mensaje}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default AppErrorBoundary
