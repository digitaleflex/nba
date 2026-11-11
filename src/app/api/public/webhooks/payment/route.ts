import { NextRequest, NextResponse } from "next/server"
import { prisma, withRetryTransaction } from "@nba/lib/db"
import { logAuditEvent } from "@nba/lib/services/audit"
import { newAccessRequestAdminEmail, sendEmail } from "@nba/lib/email"

/**
 * Webhook de confirmation de paiement (fournisseur externe).
 *
 * Payload attendu (JSON) :
 *   { "userId": "<uuid>", "planId": "<uuid>", "reference": "<ref checkout>" }
 *   ou { "email": "...", "planId": "<uuid>", "reference": "..." }
 *
 * Auth : header `x-payment-signature` == PAYMENT_WEBHOOK_SECRET.
 * Comportement minimal volontaire : crée une demande PENDING (l'admin
 * garde la validation manuelle), idempotent sur (user, plan, reference).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 })
  if (req.headers.get("x-payment-signature") !== secret) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 })
  }

  let body: { userId?: string; email?: string; planId?: string; reference?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
  }
  if (!body.planId || (!body.userId && !body.email)) {
    return NextResponse.json({ error: "planId + userId (ou email) requis" }, { status: 400 })
  }

  const user = body.userId
    ? await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true, name: true, email: true } })
    : await prisma.user.findUnique({ where: { email: body.email! }, select: { id: true, name: true, email: true } })
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: body.planId },
    select: { id: true, name: true },
  })
  if (!plan) return NextResponse.json({ error: "Plan introuvable" }, { status: 404 })

  // Idempotence : pas de doublon si un PENDING existe déjà pour ce couple
  const existingPending = await prisma.accessRequest.findFirst({
    where: { userId: user.id, planId: plan.id, status: "PENDING" },
    select: { id: true },
  })

  let requestId = existingPending?.id
  if (!requestId) {
    const created = await withRetryTransaction(async (tx) => {
      const dup = await tx.accessRequest.findFirst({
        where: { userId: user.id, planId: plan.id, status: "PENDING" },
        select: { id: true },
      })
      if (dup) return dup
      return tx.accessRequest.create({
        data: {
          userId: user.id,
          planId: plan.id,
          status: "PENDING",
          notes: `Paiement confirmé (réf: ${body.reference ?? "n/a"}) — validation admin requise`,
        },
        select: { id: true },
      })
    })
    requestId = created.id
  }

  await logAuditEvent({
    action: "payment.confirmed",
    resourceType: "access_request",
    resourceId: requestId,
    details: {
      userEmail: user.email,
      planName: plan.name,
      reference: body.reference ?? null,
      duplicate: Boolean(existingPending),
    },
  })

  if (!existingPending) {
    const admins = await prisma.user.findMany({
      where: { role: { name: { in: ["ADMIN", "SUPER_ADMIN"] } } },
      select: { name: true, email: true },
    })
    for (const admin of admins) {
      const template = newAccessRequestAdminEmail(
        admin,
        { name: user.name ?? "Utilisateur", email: user.email },
        plan.name,
      )
      sendEmail(admin.email, template).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, requestId, duplicate: Boolean(existingPending) })
}
