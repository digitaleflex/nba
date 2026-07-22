import { NextResponse } from "next/server"

const api = {
  openapi: "3.0.3",
  info: {
    title: "NeverBrokeAgain API",
    version: "1.0.0",
    description: "API de la plateforme de signaux traders premium NBA.",
  },
  servers: [
    { url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", description: "Production" },
  ],
  paths: {
    "/api/auth/sign-in": {
      post: { summary: "Connexion email/mot de passe", tags: ["Auth"], security: [], responses: { "200": { description: "Session créée" }, "401": { description: "Identifiants invalides" } } },
    },
    "/api/auth/sign-up": {
      post: { summary: "Inscription", tags: ["Auth"], security: [], responses: { "200": { description: "Compte créé" } } },
    },
    "/api/auth/captcha": {
      get: { summary: "Générer CAPTCHA", tags: ["Auth"], security: [], responses: { "200": { description: "Question + token" } } },
    },
    "/api/auth/captcha/verify": {
      post: { summary: "Vérifier CAPTCHA", tags: ["Auth"], security: [], responses: { "200": { description: "Valid: true/false" } } },
    },
    "/api/admin/security/fraud/abuse": {
      get: { summary: "Résumé abus (stats, events récents)", tags: ["Admin - Fraude"], security: [{ adminAuth: [] }], responses: { "200": { description: "Stats + events" } } },
    },
    "/api/admin/security/fraud/events": {
      get: { summary: "Événements sécurité HAUT/CRITIQUE", tags: ["Admin - Fraude"], security: [{ adminAuth: [] }], responses: { "200": { description: "50 derniers events" } } },
    },
    "/api/admin/security/fraud/suspend": {
      post: { summary: "Suspendre un compte + email + audit", tags: ["Admin - Fraude"], security: [{ adminAuth: [] }], responses: { "200": { description: "Compte suspendu" } } },
    },
    "/api/admin/security/fraud/reactivate": {
      post: { summary: "Réactiver un compte + email", tags: ["Admin - Fraude"], security: [{ adminAuth: [] }], responses: { "200": { description: "Compte réactivé" } } },
    },
    "/api/admin/security/fraud/blocked-ips": {
      get: { summary: "Liste IPs bloquées (Redis)", tags: ["Admin - Fraude"], security: [{ adminAuth: [] }], responses: { "200": { description: "Liste IPs" } } },
    },
    "/api/admin/security/fraud/unblock-ip": {
      post: { summary: "Débloquer une IP", tags: ["Admin - Fraude"], security: [{ adminAuth: [] }], responses: { "200": { description: "IP débloquée" } } },
    },
    "/api/admin/security/fraud/playbook": {
      get: { summary: "Lister les playbooks", tags: ["Admin - Fraude"], security: [{ adminAuth: [] }], responses: { "200": { description: "12 playbooks" } } },
      post: { summary: "Exécuter un playbook sur un utilisateur", tags: ["Admin - Fraude"], security: [{ adminAuth: [] }], responses: { "200": { description: "Playbook exécuté" } } },
    },
    "/api/admin/security/events/{id}": {
      patch: { summary: "Marquer événement comme traité", tags: ["Admin - Fraude"], security: [{ adminAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Ack" } } },
    },
    "/api/admin/security/alerts": {
      get: { summary: "Nombre d'alertes dernière heure", tags: ["Admin - Fraude"], security: [{ adminAuth: [] }], responses: { "200": { description: "Count" } } },
    },
    "/api/admin/security/digest": {
      post: { summary: "Générer rapport sécurité quotidien (cron)", tags: ["Admin - Fraude"], security: [{ adminAuth: [] }], responses: { "200": { description: "Email envoyé" } } },
    },
    "/api/admin/sessions": {
      get: { summary: "Sessions actives", tags: ["Admin - Sessions"], security: [{ adminAuth: [] }], responses: { "200": { description: "Liste" } } },
    },
    "/api/admin/sessions/{id}": {
      delete: { summary: "Révoquer une session", tags: ["Admin - Sessions"], security: [{ adminAuth: [] }], responses: { "200": { description: "OK" } } },
    },
    "/api/admin/support": {
      get: { summary: "Tickets support", tags: ["Admin - Support"], security: [{ adminAuth: [] }], responses: { "200": { description: "Liste" } } },
    },
    "/api/admin/support/{id}": {
      patch: { summary: "Répondre à un ticket", tags: ["Admin - Support"], security: [{ adminAuth: [] }], responses: { "200": { description: "OK" } } },
    },
    "/api/admin/members/search": {
      get: { summary: "Chercher un membre par email", tags: ["Admin - Membres"], security: [{ adminAuth: [] }], responses: { "200": { description: "User" } } },
    },
    "/api/admin/journal/{userId}": {
      get: { summary: "Journal trading complet d'un membre", tags: ["Admin - Coaching"], security: [{ adminAuth: [] }], responses: { "200": { description: "Trades + stats + streaks" } } },
    },
    "/api/admin/metrics": {
      get: { summary: "Métriques système (léger)", tags: ["Admin - Observabilité"], security: [{ adminAuth: [] }], responses: { "200": { description: "JSON compteurs" } } },
    },
    "/api/dashboard/sessions": {
      get: { summary: "Mes sessions actives", tags: ["Dashboard"], security: [{ userAuth: [] }], responses: { "200": { description: "Liste" } } },
      delete: { summary: "Révoquer ma session", tags: ["Dashboard"], security: [{ userAuth: [] }], responses: { "200": { description: "OK" } } },
    },
    "/api/dashboard/plan-limits": {
      get: { summary: "Mes limites plan (sessions, devices)", tags: ["Dashboard"], security: [{ userAuth: [] }], responses: { "200": { description: "Limits + usage" } } },
    },
    "/api/dashboard/security/events": {
      get: { summary: "Mes événements sécurité", tags: ["Dashboard"], security: [{ userAuth: [] }], responses: { "200": { description: "Liste" } } },
    },
  },
  components: {
    securitySchemes: {
      adminAuth: { type: "http", scheme: "bearer", description: "Session admin requis" },
      userAuth: { type: "http", scheme: "bearer", description: "Session utilisateur requis" },
    },
  },
  tags: [
    { name: "Auth", description: "Authentification" },
    { name: "Admin - Fraude", description: "Anti-fraude, sécurité, playbooks" },
    { name: "Admin - Sessions", description: "Gestion des sessions" },
    { name: "Admin - Support", description: "Tickets support" },
    { name: "Admin - Membres", description: "Gestion des membres" },
    { name: "Admin - Coaching", description: "Journal de trading" },
    { name: "Admin - Observabilité", description: "Métriques et monitoring" },
    { name: "Dashboard", description: "API utilisateur" },
  ],
}

export async function GET() {
  return NextResponse.json(api)
}
