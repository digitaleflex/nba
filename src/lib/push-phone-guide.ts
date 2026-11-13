/**
 * Réglages du téléphone qui décident si une alerte se voit et s'entend (étape 1 du plan « alertes fiables »).
 * Les intitulés exacts varient selon la marque et la version : on décrit le chemin sans inventer de noms.
 */
export type PhonePlatform = "ios" | "android" | "desktop"

export interface PhoneGuide {
  platform: PhonePlatform
  title: string
  steps: string[]
}

export function detectPlatform(ua: string): PhonePlatform {
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios"
  if (/Android/i.test(ua)) return "android"
  return "desktop"
}

export function phoneGuide(ua: string): PhoneGuide {
  const platform = detectPlatform(ua)
  if (platform === "ios") {
    return {
      platform,
      title: "Ne manquez aucun signal sur iPhone",
      steps: [
        "Ouvrez NBA depuis son icône sur l'écran d'accueil (pas depuis Safari).",
        "Réglages › Notifications › NBA : activez « Autoriser les notifications », puis Écran verrouillé, Bannières et Sons.",
        "Si vous utilisez un mode Concentration (Travail, Sommeil…) : Réglages › Concentration › votre mode › Apps autorisées, puis ajoutez NBA.",
        "Vérifiez que le commutateur de sonnerie sur le côté de l'iPhone n'est pas en mode silencieux.",
      ],
    }
  }
  if (platform === "android") {
    return {
      platform,
      title: "Ne manquez aucun signal sur Android",
      steps: [
        "Paramètres › Applications › (Chrome, ou NBA si l'application est installée) › Notifications : activez-les, avec le son et la vibration.",
        "Dans la liste des catégories de notifications du site, choisissez une importance « Urgent » ou « Élevée » et un son.",
        "Paramètres › Applications › (Chrome ou NBA) › Batterie : choisissez « Sans restriction » (ou « Non optimisée »).",
        "Désactivez le mode Ne pas déranger pendant vos heures de trading, ou autorisez-y l'application.",
      ],
    }
  }
  return {
    platform,
    title: "Ne manquez aucun signal sur ordinateur",
    steps: [
      "Autorisez les notifications de ce site dans votre navigateur (icône à gauche de l'adresse).",
      "Vérifiez que le mode « Ne pas déranger » ou « Concentration » de votre système n'est pas actif.",
      "Gardez un onglet NBA ouvert : l'application joue alors le son que vous avez choisi.",
    ],
  }
}
