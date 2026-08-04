import { PrismaClient } from "../src/generated/prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const EMAIL = process.argv[2]

if (!EMAIL) {
  console.error("Usage: npx tsx scripts/diagnose-user.ts <email>")
  process.exit(1)
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 1,
    ssl: process.env.DATABASE_URL?.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  })

  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const user = await prisma.user.findUnique({
    where: { email: EMAIL.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      deletedAt: true,
      emailVerified: true,
      signalsAccessOverride: true,
      metadata: true,
      createdAt: true,
      role: { select: { name: true } },
      accessRequests: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          plan: { select: { id: true, name: true } },
        },
      },
      sessions: {
        where: { expiresAt: { gt: new Date() } },
        select: { id: true, expiresAt: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      devices: {
        select: { id: true, trustLevel: true },
      },
      pushSubscriptions: {
        select: { id: true, endpoint: true, createdAt: true },
        take: 1,
      },
      _count: {
        select: {
          notifications: { where: { type: "SIGNAL" } },
          accessRequests: true,
        },
      },
    },
  })

  if (!user) {
    console.log(`\n❌ Aucun utilisateur trouvé pour : ${EMAIL}`)
    await pool.end()
    process.exit(0)
  }

  const meta = (user.metadata || {}) as Record<string, any>
  const prefs = meta.notificationPrefs || {}
  const hasApprovedAccess = user.accessRequests.some((a) => a.status === "APPROVED")
  const hasPendingAccess = user.accessRequests.some((a) => a.status === "PENDING")

  console.log("\n═══════════════════════════════════════════")
  console.log(`📋 Diagnostic — ${user.email}`)
  console.log("═══════════════════════════════════════════")

  console.log(`\n👤 Profil`)
  console.log(`   Nom       : ${user.name ?? "—"}`)
  console.log(`   ID        : ${user.id}`)
  console.log(`   Actif     : ${user.isActive ? "✅ OUI" : "❌ NON (suspendu)"}`)
  console.log(`   Supprimé  : ${user.deletedAt ? `❌ OUI — ${user.deletedAt.toISOString()}` : "✅ Non"}`)
  console.log(`   Rôle      : ${user.role?.name ?? "—"}`)
  console.log(`   Créé le   : ${user.createdAt.toISOString()}`)

  console.log(`\n📧 Vérification email`)
  console.log(`   Vérifié   : ${user.emailVerified ? "✅ OUI" : "❌ NON"}`)

  console.log(`\n🔑 Accès aux signaux`)
  console.log(`   Override  : ${user.signalsAccessOverride ? "✅ OUI (bypass admin)" : "Non"}`)
  console.log(`   Plan approuvé : ${hasApprovedAccess ? "✅ OUI" : "❌ NON"}`)

  if (user.accessRequests.length > 0) {
    console.log(`\n📋 Demandes d'accès :`)
    for (const ar of user.accessRequests) {
      const icon = ar.status === "APPROVED" ? "✅" : ar.status === "PENDING" ? "⏳" : "❌"
      console.log(`   ${icon} ${ar.status} — ${ar.plan?.name ?? "?"} (id: ${ar.id.slice(0, 8)}…)`)
    }
  } else {
    console.log(`\n📋 Aucune demande d'accès`)
  }

  console.log(`\n🔔 Préférences de notification`)
  console.log(`   signal   : ${prefs.signal !== false ? "✅ Activé" : "❌ Désactivé"}`)
  console.log(`   security : ${prefs.security !== false ? "✅ Activé" : "❌ Désactivé"}`)
  console.log(`   system   : ${prefs.system !== false ? "✅ Activé" : "❌ Désactivé"}`)

  console.log(`\n📊 Statistiques`)
  console.log(`   Signaux reçus (in-app) : ${user._count.notifications}`)
  console.log(`   Demandes d'accès       : ${user._count.accessRequests}`)

  console.log(`\n💻 Appareils`)
  for (const d of user.devices) {
    console.log(`   ${d.id} (confiance: ${d.trustLevel})`)
  }

  if (user.pushSubscriptions.length > 0) {
    console.log(`\n📲 Push actif : ${user.pushSubscriptions.length} souscription(s)`)
  } else {
    console.log(`\n📲 Push : Aucune souscription`)
  }

  if (user.sessions.length > 0) {
    const s = user.sessions[0]
    console.log(`\n🕐 Dernière session active — expire le ${s.expiresAt.toISOString()}`)
  } else {
    console.log(`\n🕐 Aucune session active`)
  }

  // ── Résumé ──
  console.log(`\n═══════════════════════════════════════════`)
  console.log(`🔍 RÉSUMÉ : pourquoi pas de signaux ?`)
  console.log("═══════════════════════════════════════════")

  const issues: string[] = []

  if (!user.isActive) issues.push("❌ Compte suspendu (isActive=false)")
  if (user.deletedAt) issues.push("❌ Compte supprimé")
  if (!user.emailVerified && !user.signalsAccessOverride) issues.push("⚠️  Email non vérifié")
  if (!hasApprovedAccess && !user.signalsAccessOverride) issues.push("❌ Aucun accès approuvé à un plan")
  if (hasPendingAccess && !hasApprovedAccess && !user.signalsAccessOverride) issues.push("⏳ Demande d'accès en attente")
  if (prefs.signal === false) issues.push("❌ Notifications de signaux désactivées dans les préférences")
  if (user.pushSubscriptions.length === 0) issues.push("⚠️  Aucune souscription push → pas de notifications sur le téléphone")

  if (issues.length === 0) {
    console.log("✅ Aucun problème détecté côté utilisateur. Vérifier :")
    console.log("   - Le signal a bien été publié (status=PUBLISHED)")
    console.log("   - Le plan du user est dans l'audience du signal")
    console.log("   - Le worker signal-distribution tourne")
  } else {
    for (const issue of issues) console.log(issue)
  }

  await pool.end()
}

main().catch((err) => {
  console.error("Erreur :", err)
  process.exit(1)
})
