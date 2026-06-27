export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { prisma } = await import("./lib/db")

    console.log("\n═══ Démarrage du Serveur Next.js ═══")
    console.log("📡 Vérification de la connexion à la base de données...")

    try {
      // Exécuter une requête SQL ultra-simple pour tester la connexion
      await prisma.$queryRaw`SELECT 1 AS ok`
      console.log("✅ Base de données connectée avec succès !\n")
    } catch (error) {
      console.error("❌ Impossible de se connecter à la base de données au démarrage :")
      console.error(`   ${(error as Error).message}\n`)
    }

    // Planifier un ping automatique toutes les 4 minutes
    // afin d'éviter la mise en veille Neon Serverless
    const intervalMinutes = 4
    setInterval(async () => {
      try {
        await prisma.$queryRaw`SELECT 1 AS ok`
        console.log(`[${new Date().toISOString()}] 🔄 Keep-Alive Database : Ping OK`)
      } catch (err) {
        console.error(`[${new Date().toISOString()}] ❌ Keep-Alive Database : Échec du ping :`, (err as Error).message)
      }
    }, intervalMinutes * 60 * 1000)
  }
}
