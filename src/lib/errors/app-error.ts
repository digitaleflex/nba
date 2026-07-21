import { ErrorCode, ErrorCodeType } from "./codes"

export type Severity = "error" | "warning" | "info"

export interface AppErrorParams {
  code: ErrorCodeType
  message: string
  httpStatus?: number
  severity?: Severity
  retryable?: boolean
  module?: string
  details?: Record<string, unknown>
  requestId?: string
  userId?: string
}

export class AppError extends Error {
  public readonly code: ErrorCodeType
  public readonly httpStatus: number
  public readonly severity: Severity
  public readonly retryable: boolean
  public readonly module: string
  public readonly details?: Record<string, unknown>
  public readonly requestId?: string
  public readonly userId?: string
  public readonly errorId: string

  constructor(params: AppErrorParams) {
    super(params.message)
    this.name = "AppError"
    this.code = params.code
    this.httpStatus = params.httpStatus ?? 500
    this.severity = params.severity ?? "error"
    this.retryable = params.retryable ?? false
    this.module = params.module ?? "core"
    this.details = params.details
    this.requestId = params.requestId
    this.userId = params.userId
    this.errorId = Math.random().toString(36).slice(2, 10).toUpperCase()
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      errorId: this.errorId,
      correlationId: this.requestId,
    }
  }

  isRetryable(): boolean {
    return this.retryable
  }
}
