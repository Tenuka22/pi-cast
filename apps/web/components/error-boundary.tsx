"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@workspace/ui/components/button"
import { getErrorMessage } from "@pi-cast/orpc-handlers"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo)
    this.props.onError?.(error, errorInfo)
    this.setState({ error, errorInfo })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(this.state.error)}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: ErrorInfo) => void
  }
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={options?.fallback} onError={options?.onError}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}
