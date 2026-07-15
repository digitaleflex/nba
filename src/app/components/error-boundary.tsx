"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@nba/design-system"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-[50vh] items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="size-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="size-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Quelque chose s'est mal passé</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Une erreur inattendue est survenue. Essayez de rafraîchir la page.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Rafraîchir
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}