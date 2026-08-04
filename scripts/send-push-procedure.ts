import { Resend } from "resend"

const EMAILS = [
  "dimitrihoundjo5@gmail.com",
  "lexnice540@gmail.com",
  "ammarsalifouail@gmail.com",
  "jauresdimas@gmail.com",
  "petitchrist308@gmail.com",
  "bossouharold@gmail.com",
  "chrismukadi625@gmail.com",
  "elvisakissohe061@gmail.com",
  "omonwaleatika@gmail.com",
  "brunoatika43@gmail.com",
]

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY)

  for (const email of EMAILS) {
    try {
      const r = await resend.emails.send({
        from: "NeverBrokeAgain <contact@signauxx.com>",
        to: email,
        subject: "Activez les notifications push sur votre iPhone pour recevoir les signaux en temps reel",
        html: `
<h2>Procédure pour activer les signaux en temps réel sur iPhone</h2>
<p>Pour recevoir instantanément chaque nouveau signal de trading sur votre téléphone, suivez ces deux étapes :</p>

<hr/>

<h3>Étape 1 — Installer l'application sur votre écran d'accueil</h3>
<ol>
  <li>Ouvrez <strong>Safari</strong> (pas Chrome, pas un autre navigateur)</li>
  <li>Allez sur <a href="https://nba.neverbrokeagain.com">https://nba.neverbrokeagain.com</a></li>
  <li>Connectez-vous à votre compte</li>
  <li>En bas de l'écran, appuyez sur l'icône <strong>Partager</strong> (carré avec une flèche vers le haut)</li>
  <li>Faites défiler vers le bas et sélectionnez <strong>« Sur l'écran d'accueil »</strong></li>
  <li>Appuyez sur <strong>« Ajouter »</strong> en haut à droite</li>
</ol>
<p>L'application NeverBrokeAgain apparaît maintenant sur votre écran d'accueil comme une vraie app.</p>

<hr/>

<h3>Étape 2 — Activer les notifications push</h3>
<ol>
  <li>Ouvrez l'application <strong>NeverBrokeAgain</strong> depuis l'écran d'accueil (pas depuis Safari)</li>
  <li>Une bannière violette « Ne manquez aucun signal » devrait apparaître en haut du tableau de bord</li>
  <li>Cliquez sur le bouton <strong>« Activer les notifications »</strong></li>
  <li>Une fenêtre du système iOS apparaît : appuyez sur <strong>« Autoriser »</strong></li>
</ol>
<p>Terminé ! Vous recevrez désormais chaque signal directement sur votre écran, même quand l'application est fermée.</p>

<hr/>

<h3>Important</h3>
<ul>
  <li>Les notifications push sur iPhone nécessitent <strong>iOS 16.4 ou supérieur</strong> (Réglages → Général → Version logicielle)</li>
  <li>L'application <strong>doit être ouverte depuis l'écran d'accueil</strong> pour que les notifications fonctionnent (pas depuis Safari)</li>
  <li>Si la bannière n'apparaît pas, vérifiez : Réglages → Notifications → NeverBrokeAgain → Autoriser les notifications</li>
</ul>

<p>Si vous rencontrez un problème, répondez à cet email.</p>

<p>À bientôt,<br/>L'équipe NeverBrokeAgain</p>
`.trim(),
      })
      console.log(`✅ ${email} — ${r.data?.id || "OK"}`)
    } catch (e) {
      console.error(`❌ ${email} — ${(e as Error).message}`)
    }
  }
}

main().catch(console.error)
