export interface NotificationSoundOption {
  id: string
  label: string
  desc: string
}

// Source unique de vérité pour les sons de notification.
// Les fichiers correspondants existent dans /public/sounds/<id>.wav
export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  { id: "default", label: "Classique", desc: "Double ding clair" },
  { id: "chime", label: "Douce", desc: "Carillon 3 notes" },
  { id: "pop", label: "Pop", desc: "Bulle courte" },
  { id: "signal", label: "Signal", desc: "Balayage ascendant" },
  { id: "urgent", label: "Urgente", desc: "3 bips descendants" },
  { id: "light-hearted", label: "Léger", desc: "Mélodie joyeuse" },
  { id: "joyous", label: "Joyeuse", desc: "Chime mélodique" },
  { id: "opening", label: "Éclat", desc: "Ton cristallin" },
  { id: "pristine", label: "Pureté", desc: "Son immaculé" },
  { id: "slick", label: "Glissé", desc: "Court et discret" },
  { id: "sly", label: "Discret", desc: "Subtil et doux" },
  { id: "come-here", label: "Appel", desc: "Ton d'attention" },
  { id: "playful", label: "Ludique", desc: "Amusant et frais" },
  { id: "happy-to-help", label: "Succès", desc: "Confirmation positive" },
  { id: "coins", label: "Pièces", desc: "Son de caisse" },
  { id: "to-the-point", label: "Précis", desc: "Déterminé" },
  { id: "not-good", label: "Erreur", desc: "Ton négatif" },
]

export const NOTIFICATION_SOUND_IDS: readonly string[] = NOTIFICATION_SOUNDS.map(
  (s) => s.id,
)
