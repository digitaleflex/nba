export type EventType =
  | "USER_REGISTERED"
  | "EMAIL_VERIFIED"
  | "PASSWORD_RESET"
  | "NEW_DEVICE_LOGIN"
  | "KYC_SUBMITTED"
  | "KYC_APPROVED"
  | "KYC_REJECTED"
  | "BROKER_SUBMITTED"
  | "BROKER_APPROVED"
  | "BROKER_REJECTED"
  | "SIGNAL_PUBLISHED"
  | "ACCESS_GRANTED"
  | "ACCESS_REVOKED"
  | "ACCOUNT_SUSPENDED"
  | "SYSTEM_MAINTENANCE"

export type NotificationPriority = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "CRITICAL"

export const EVENT_PRIORITY: Record<EventType, NotificationPriority> = {
  USER_REGISTERED: "INFO",
  EMAIL_VERIFIED: "SUCCESS",
  PASSWORD_RESET: "INFO",
  NEW_DEVICE_LOGIN: "WARNING",
  KYC_SUBMITTED: "INFO",
  KYC_APPROVED: "SUCCESS",
  KYC_REJECTED: "ERROR",
  BROKER_SUBMITTED: "INFO",
  BROKER_APPROVED: "SUCCESS",
  BROKER_REJECTED: "ERROR",
  SIGNAL_PUBLISHED: "INFO",
  ACCESS_GRANTED: "SUCCESS",
  ACCESS_REVOKED: "WARNING",
  ACCOUNT_SUSPENDED: "CRITICAL",
  SYSTEM_MAINTENANCE: "WARNING",
}

export const CRITICAL_EVENTS: EventType[] = [
  "NEW_DEVICE_LOGIN",
  "PASSWORD_RESET",
  "ACCOUNT_SUSPENDED",
  "ACCESS_REVOKED",
]

export interface BaseEvent {
  type: EventType
  userId: string
  timestamp?: Date
}

export interface UserRegisteredEvent extends BaseEvent {
  type: "USER_REGISTERED"
  data: { name: string; email: string }
}

export interface SignalPublishedEvent extends BaseEvent {
  type: "SIGNAL_PUBLISHED"
  data: { signalId: string; content: string }
}

export interface KycEvent extends BaseEvent {
  type: "KYC_SUBMITTED" | "KYC_APPROVED" | "KYC_REJECTED"
  data: { documentId: string; notes?: string }
}

export interface BrokerEvent extends BaseEvent {
  type: "BROKER_SUBMITTED" | "BROKER_APPROVED" | "BROKER_REJECTED"
  data: { verificationId: string; notes?: string }
}

export interface AccessEvent extends BaseEvent {
  type: "ACCESS_GRANTED" | "ACCESS_REVOKED"
  data: { planName: string; requestId: string }
}

export interface SecurityEvent extends BaseEvent {
  type: "NEW_DEVICE_LOGIN" | "PASSWORD_RESET" | "ACCOUNT_SUSPENDED"
  data: { deviceName?: string; ipAddress?: string }
}

export type AppEvent =
  | UserRegisteredEvent
  | SignalPublishedEvent
  | KycEvent
  | BrokerEvent
  | AccessEvent
  | SecurityEvent
  | (BaseEvent & { data?: Record<string, unknown> })

export const EVENT_TITLES: Record<EventType, string> = {
  USER_REGISTERED: "Bienvenue sur NeverBrokeAgain",
  EMAIL_VERIFIED: "Email vérifié",
  PASSWORD_RESET: "Mot de passe réinitialisé",
  NEW_DEVICE_LOGIN: "Nouvel appareil détecté",
  KYC_SUBMITTED: "Document KYC reçu",
  KYC_APPROVED: "Vérification d'identité approuvée",
  KYC_REJECTED: "Vérification d'identité refusée",
  BROKER_SUBMITTED: "Vérification Broker reçue",
  BROKER_APPROVED: "Vérification Broker approuvée",
  BROKER_REJECTED: "Vérification Broker refusée",
  SIGNAL_PUBLISHED: "Nouveau signal de trading",
  ACCESS_GRANTED: "Accès accordé",
  ACCESS_REVOKED: "Accès révoqué",
  ACCOUNT_SUSPENDED: "Compte suspendu",
  SYSTEM_MAINTENANCE: "Maintenance plateforme",
}

export type EventHandler = (event: AppEvent) => void | Promise<void>

export class EventBus {
  private handlers: Map<EventType, EventHandler[]> = new Map()

  on(type: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type) || []
    handlers.push(handler)
    this.handlers.set(type, handlers)
  }

  async emit(event: AppEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || []
    await Promise.allSettled(handlers.map((h) => h(event)))
  }

  removeAll(): void {
    this.handlers.clear()
  }
}

export const eventBus = new EventBus()
