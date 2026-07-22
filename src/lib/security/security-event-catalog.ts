import type { SecurityEventType, SecuritySeverity } from "../../generated/prisma/client"

export interface EventMeta {
  type: SecurityEventType
  category: EventCategory
  defaultSeverity: SecuritySeverity
  description: string
  retentionDays: number
  alertP0: boolean
  alertP1: boolean
}

export type EventCategory =
  | "authentication"
  | "session"
  | "device"
  | "two_factor"
  | "account"
  | "risk"
  | "admin"
  | "data"
  | "kyc"
  | "subscription"

const CATALOG: Record<SecurityEventType, EventMeta> = {
  LOGIN_SUCCESS:             { type: "LOGIN_SUCCESS",             category: "authentication", defaultSeverity: "INFO",    description: "Connexion reussie",                          retentionDays: 90,  alertP0: false, alertP1: false },
  LOGIN_FAILED:              { type: "LOGIN_FAILED",              category: "authentication", defaultSeverity: "WARNING", description: "Echec de connexion",                         retentionDays: 180, alertP0: false, alertP1: true },
  LOGIN_NEW_DEVICE:          { type: "LOGIN_NEW_DEVICE",          category: "authentication", defaultSeverity: "INFO",    description: "Connexion depuis un nouvel appareil",        retentionDays: 90,  alertP0: false, alertP1: false },
  LOGIN_NEW_LOCATION:        { type: "LOGIN_NEW_LOCATION",        category: "authentication", defaultSeverity: "INFO",    description: "Connexion depuis un nouveau pays",           retentionDays: 90,  alertP0: false, alertP1: false },
  LOGIN_SUSPICIOUS_IP:       { type: "LOGIN_SUSPICIOUS_IP",       category: "authentication", defaultSeverity: "HIGH",    description: "Connexion depuis une IP suspecte",           retentionDays: 365, alertP0: false, alertP1: true },
  LOGIN_SESSION_LIMIT:       { type: "LOGIN_SESSION_LIMIT",       category: "authentication", defaultSeverity: "WARNING", description: "Limite de sessions atteinte",                 retentionDays: 90,  alertP0: false, alertP1: false },
  LOGIN_BLOCKED:             { type: "LOGIN_BLOCKED",             category: "authentication", defaultSeverity: "HIGH",    description: "Connexion bloquee",                          retentionDays: 365, alertP0: false, alertP1: true },
  LOGOUT:                    { type: "LOGOUT",                    category: "session",        defaultSeverity: "INFO",    description: "Deconnexion utilisateur",                    retentionDays: 90,  alertP0: false, alertP1: false },
  SESSION_CREATED:           { type: "SESSION_CREATED",           category: "session",        defaultSeverity: "INFO",    description: "Session creee",                              retentionDays: 90,  alertP0: false, alertP1: false },
  SESSION_REVOKED:           { type: "SESSION_REVOKED",           category: "session",        defaultSeverity: "INFO",    description: "Session revoquee",                           retentionDays: 90,  alertP0: false, alertP1: false },
  SESSION_EXPIRED:           { type: "SESSION_EXPIRED",           category: "session",        defaultSeverity: "INFO",    description: "Session expiree",                            retentionDays: 90,  alertP0: false, alertP1: false },
  SESSION_HIJACK_DETECTED:   { type: "SESSION_HIJACK_DETECTED",   category: "session",        defaultSeverity: "CRITICAL", description: "Hijacking de session detecte",                retentionDays: 730, alertP0: true,  alertP1: false },
  DEVICE_REGISTERED:         { type: "DEVICE_REGISTERED",         category: "device",         defaultSeverity: "INFO",    description: "Nouvel appareil enregistre",                  retentionDays: 90,  alertP0: false, alertP1: false },
  DEVICE_VERIFIED:           { type: "DEVICE_VERIFIED",           category: "device",         defaultSeverity: "INFO",    description: "Appareil verifie",                            retentionDays: 90,  alertP0: false, alertP1: false },
  DEVICE_TRUSTED:            { type: "DEVICE_TRUSTED",            category: "device",         defaultSeverity: "INFO",    description: "Appareil passe en confiance",                 retentionDays: 90,  alertP0: false, alertP1: false },
  DEVICE_REVOKED:            { type: "DEVICE_REVOKED",            category: "device",         defaultSeverity: "INFO",    description: "Appareil revoque",                            retentionDays: 90,  alertP0: false, alertP1: false },
  DEVICE_BLOCKED:            { type: "DEVICE_BLOCKED",            category: "device",         defaultSeverity: "HIGH",    description: "Appareil bloque",                             retentionDays: 365, alertP0: false, alertP1: true },
  DEVICE_SUSPICIOUS:         { type: "DEVICE_SUSPICIOUS",         category: "device",         defaultSeverity: "WARNING", description: "Comportement appareil suspect",               retentionDays: 180, alertP0: false, alertP1: false },
  TWOFA_ENABLED:             { type: "TWOFA_ENABLED",             category: "two_factor",     defaultSeverity: "INFO",    description: "2FA activee",                                retentionDays: 365, alertP0: false, alertP1: false },
  TWOFA_DISABLED:            { type: "TWOFA_DISABLED",            category: "two_factor",     defaultSeverity: "WARNING", description: "2FA desactivee",                              retentionDays: 365, alertP0: false, alertP1: true },
  TWOFA_FAILED:              { type: "TWOFA_FAILED",              category: "two_factor",     defaultSeverity: "WARNING", description: "Echec verification 2FA",                       retentionDays: 180, alertP0: false, alertP1: true },
  TWOFA_BYPASSED:            { type: "TWOFA_BYPASSED",            category: "two_factor",     defaultSeverity: "HIGH",    description: "2FA contournee",                              retentionDays: 365, alertP0: true,  alertP1: false },
  TWOFA_RECOVERY_USED:       { type: "TWOFA_RECOVERY_USED",       category: "two_factor",     defaultSeverity: "WARNING", description: "Code de recovery 2FA utilise",                 retentionDays: 365, alertP0: false, alertP1: true },
  PASSWORD_CHANGED:          { type: "PASSWORD_CHANGED",          category: "authentication", defaultSeverity: "INFO",    description: "Mot de passe modifie",                        retentionDays: 365, alertP0: false, alertP1: false },
  PASSWORD_RESET:            { type: "PASSWORD_RESET",            category: "authentication", defaultSeverity: "INFO",    description: "Mot de passe reinitialise",                   retentionDays: 365, alertP0: false, alertP1: false },
  PASSWORD_RESET_FAILED:     { type: "PASSWORD_RESET_FAILED",     category: "authentication", defaultSeverity: "WARNING", description: "Echec de reinitialisation mot de passe",       retentionDays: 180, alertP0: false, alertP1: false },
  EMAIL_VERIFIED:            { type: "EMAIL_VERIFIED",            category: "authentication", defaultSeverity: "INFO",    description: "Email verifie",                               retentionDays: 90,  alertP0: false, alertP1: false },
  EMAIL_CHANGED:             { type: "EMAIL_CHANGED",             category: "authentication", defaultSeverity: "WARNING", description: "Adresse email modifiee",                       retentionDays: 365, alertP0: false, alertP1: true },
  ACCOUNT_SUSPENDED:         { type: "ACCOUNT_SUSPENDED",         category: "account",        defaultSeverity: "HIGH",    description: "Compte suspendu",                             retentionDays: 730, alertP0: false, alertP1: true },
  ACCOUNT_REACTIVATED:       { type: "ACCOUNT_REACTIVATED",       category: "account",        defaultSeverity: "INFO",    description: "Compte reactive",                             retentionDays: 365, alertP0: false, alertP1: false },
  ACCOUNT_DELETED:           { type: "ACCOUNT_DELETED",           category: "account",        defaultSeverity: "INFO",    description: "Compte supprime",                             retentionDays: 730, alertP0: false, alertP1: false },
  ACCOUNT_LOCKED:            { type: "ACCOUNT_LOCKED",            category: "account",        defaultSeverity: "HIGH",    description: "Compte verrouille (tentatives)",              retentionDays: 180, alertP0: false, alertP1: true },
  RISK_SCORE_CHANGED:        { type: "RISK_SCORE_CHANGED",        category: "risk",           defaultSeverity: "INFO",    description: "Score de risque modifie",                     retentionDays: 90,  alertP0: false, alertP1: false },
  IMPOSSIBLE_TRAVEL_DETECTED: { type: "IMPOSSIBLE_TRAVEL_DETECTED", category: "risk",        defaultSeverity: "HIGH",    description: "Voyage impossible detecte",                   retentionDays: 365, alertP0: false, alertP1: true },
  RATE_LIMIT_EXCEEDED:       { type: "RATE_LIMIT_EXCEEDED",       category: "risk",           defaultSeverity: "WARNING", description: "Rate-limite depasse",                          retentionDays: 90,  alertP0: false, alertP1: false },
  API_KEY_CREATED:           { type: "API_KEY_CREATED",           category: "admin",          defaultSeverity: "INFO",    description: "Cle API creee",                               retentionDays: 365, alertP0: false, alertP1: false },
  API_KEY_REVOKED:           { type: "API_KEY_REVOKED",           category: "admin",          defaultSeverity: "INFO",    description: "Cle API revoquee",                            retentionDays: 365, alertP0: false, alertP1: false },
  ADMIN_ACTION:              { type: "ADMIN_ACTION",              category: "admin",          defaultSeverity: "INFO",    description: "Action administrateur",                       retentionDays: 730, alertP0: false, alertP1: false },
  ROLE_CHANGED:              { type: "ROLE_CHANGED",              category: "admin",          defaultSeverity: "WARNING", description: "Role utilisateur modifie",                     retentionDays: 730, alertP0: false, alertP1: true },
  PERMISSION_CHANGED:        { type: "PERMISSION_CHANGED",        category: "admin",          defaultSeverity: "WARNING", description: "Permission modifiee",                           retentionDays: 730, alertP0: false, alertP1: true },
  DATA_EXPORT:               { type: "DATA_EXPORT",               category: "data",           defaultSeverity: "INFO",    description: "Export de donnees",                           retentionDays: 365, alertP0: false, alertP1: false },
  DATA_DELETION_REQUEST:     { type: "DATA_DELETION_REQUEST",     category: "data",           defaultSeverity: "INFO",    description: "Demande de suppression de donnees",           retentionDays: 730, alertP0: false, alertP1: false },
  DATA_DELETION_COMPLETED:   { type: "DATA_DELETION_COMPLETED",   category: "data",           defaultSeverity: "INFO",    description: "Suppression de donnees effectuee",            retentionDays: 730, alertP0: false, alertP1: false },
  KYC_SUBMITTED:             { type: "KYC_SUBMITTED",             category: "kyc",            defaultSeverity: "INFO",    description: "Documents KYC soumis",                        retentionDays: 365, alertP0: false, alertP1: false },
  KYC_APPROVED:              { type: "KYC_APPROVED",              category: "kyc",            defaultSeverity: "INFO",    description: "KYC approuve",                                retentionDays: 365, alertP0: false, alertP1: false },
  KYC_REJECTED:              { type: "KYC_REJECTED",              category: "kyc",            defaultSeverity: "WARNING", description: "KYC rejete",                                   retentionDays: 365, alertP0: false, alertP1: false },
  BROKER_VERIFIED:           { type: "BROKER_VERIFIED",           category: "kyc",            defaultSeverity: "INFO",    description: "Compte broker verifie",                       retentionDays: 365, alertP0: false, alertP1: false },
  SUBSCRIPTION_CHANGED:      { type: "SUBSCRIPTION_CHANGED",      category: "subscription",   defaultSeverity: "INFO",    description: "Abonnement modifie",                          retentionDays: 365, alertP0: false, alertP1: false },
  SECURITY_ALERT:            { type: "SECURITY_ALERT",            category: "risk",           defaultSeverity: "HIGH",    description: "Alerte de securite generique",                retentionDays: 365, alertP0: false, alertP1: true },
}

export function getEventMeta(type: SecurityEventType): EventMeta {
  return CATALOG[type]
}

export function getEventsByCategory(category: EventCategory): EventMeta[] {
  return Object.values(CATALOG).filter(e => e.category === category)
}

export function getP0Events(): EventMeta[] {
  return Object.values(CATALOG).filter(e => e.alertP0)
}

export function getP1Events(): EventMeta[] {
  return Object.values(CATALOG).filter(e => e.alertP1)
}

export { CATALOG }
