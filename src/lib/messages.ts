export const msg = {
  auth: {
    NOT_AUTHENTICATED: "Non authentifié",
    ACCESS_DENIED: "Accès refusé",
    ACCOUNT_SUSPENDED: "Votre compte a été suspendu. Contactez le support.",
    UNAUTHORIZED: "Non autorisé",
    EMAIL_REQUIRED: "Email requis",
    INVALID_CREDENTIALS: "Identifiants invalides",
    ACCOUNT_BANNED: (reason: string) =>
      `Ce compte a été banni : ${reason}. Contactez le support.`,
    NO_PASSWORD_SET: "Aucun mot de passe configuré",
    INCORRECT_PASSWORD: "Le mot de passe est incorrect",
    CURRENT_PASSWORD_INCORRECT: "Le mot de passe actuel est incorrect",
    EMAIL_ALREADY_USED: "Cet email est déjà utilisé",
  },

  member: {
    NOT_FOUND: "Utilisateur introuvable",
    NOT_FOUND_ALT: "Utilisateur non trouvé",
    ROLE_INVALID: "Rôle invalide",
    DELETED: "Utilisateur supprimé",
    REQUEST_NOT_FOUND: "Demande introuvable",
    REQUEST_EXISTS: "Une demande d'accès existe déjà pour ce service",
    REDIS_UNAVAILABLE: "Redis indisponible",
  },

  signal: {
    NOT_FOUND: "Signal introuvable",
    INTERNAL_ERROR: "Erreur interne du serveur",
    DRAFT_INVALID: "Brouillon invalide",
  },

  onboarding: {
    DOCUMENT_TYPE_INVALID: "Type de document invalide",
    FILE_REQUIRED: "Fichier requis",
    FILE_MUST_BE_IMAGE: "Le fichier doit être une image",
    FILE_BACK_MUST_BE_IMAGE: "Le fichier verso doit être une image",
    VIDEO_REQUIRED: "Vidéo requise",
    FILE_MUST_BE_VIDEO: "Le fichier doit être une vidéo",
    KYC_REQUIRED_FIRST: "Vous devez d'abord soumettre vos documents d'identité",
    ACCOUNT_SUSPENDED: "Votre compte a été suspendu",
    CODE_INCORRECT: "Code incorrect ou expiré",
    CODE_INVALID: "Code invalide ou expiré",
    NO_FILE: "Aucun fichier fourni",
    IMAGE_TOO_LARGE: "L'image ne doit pas dépasser 5 MB",
  },

  admin: {
    IMPERSONATION_UNAVAILABLE: "Impersonation temporairement indisponible.",
    ID_REQUIRED: "id requis",
    DLQ_ENTRY_NOT_FOUND: "DLQ entry not found",
    EMAIL_EVENT_NOT_FOUND: "email_event not found",
    MISSING_TYPE: "Missing type",
    MISSING_EMAIL_ID: "Missing email_id",
    FILE_TYPE_NOT_ALLOWED: (type: string, formats: string) =>
      `Type de fichier non autorisé : ${type}. Formats acceptés : ${formats}.`,
    FILE_TOO_LARGE: (maxMb: number) =>
      `Fichier trop volumineux (max ${maxMb} Mo)`,
  },

  dashboard: {
    NOTIFICATION_NOT_FOUND: "Notification introuvable",
    TRADE_NOT_FOUND: "Trade introuvable",
    SESSION_NOT_FOUND: "Session introuvable",
    INVALID_DATA: "Donnees invalides",
    INVALID_PARAMS: "Paramètres invalides",
    INVALID_SOUND: "Son invalide",
    NO_DATA: "Aucune donnée",
    ERROR: "Erreur",
    SL_BUY: "Le Stop Loss doit être inférieur au prix d'entrée en position ACHETER",
    SL_SELL: "Le Stop Loss doit être supérieur au prix d'entrée en position VENDRE",
    TP_BUY: "Le Take Profit doit être supérieur au prix d'entrée en position ACHETER",
    TP_SELL: "Le Take Profit doit être inférieur au prix d'entrée en position VENDRE",
    SL_LT_TP_BUY: "Le Stop Loss doit être inférieur au Take Profit en position ACHETER",
    SL_GT_TP_SELL: "Le Stop Loss doit être supérieur au Take Profit en position VENDRE",
    TOO_MANY_ATTEMPTS: "Trop de tentatives. Veuillez patienter.",
  },

  support: {
    CONVERSATION_NOT_FOUND: "Conversation introuvable",
    MESSAGE_NOT_FOUND: "Message introuvable",
    MESSAGE_EMPTY: "Le message ne peut pas être vide",
    FORMAT_NOT_SUPPORTED: (type: string) =>
      `Format non supporté : ${type}. Formats acceptés : images (JPEG, PNG, WebP, GIF) et vidéos (MP4, WebM, MOV).`,
    IMAGE_TOO_LARGE: "Image trop volumineuse (max 10 Mo)",
    VIDEO_TOO_LARGE: "Vidéo trop volumineuse (max 50 Mo)",
  },

  push: {
    VAPID_NOT_CONFIGURED: "VAPID key not configured",
  },

  webhook: {
    NOT_CONFIGURED: "webhook not configured",
    INVALID_SIGNATURE: "invalid signature",
  },

  validation: {
    RESOURCE_NOT_FOUND: "Ressource introuvable.",
    UNIQUE_CONSTRAINT: "Ressource en conflit (contrainte unique).",
    FOREIGN_KEY: "Référence invalide (clé étrangère).",
    DB_ERROR: "Une erreur de base de données est survenue.",
    INVALID_REQUEST: "Requête invalide.",
    DB_UNAVAILABLE: "Base de données temporairement indisponible. Réessayez plus tard.",
    INVALID_DATA: "Données invalides. Vérifiez votre saisie.",
    UNEXPECTED_ERROR:
      "Une erreur inattendue est survenue. L'équipe technique en a été informée. Réessayez dans quelques instants, ou contactez le support.",
    UNKNOWN_ERROR: "Erreur inconnue",
    SAFE_DB_ERROR:
      "Une erreur de base de données est survenue. Réessayez, ou contactez le support si cela persiste.",
    SAFE_UNEXPECTED: "Une erreur inattendue est survenue. Réessayez dans quelques instants.",
  },

  storage: {
    FILE_TYPE_NOT_ALLOWED: (type: string, allowed: string) =>
      `Type de fichier non autorisé : ${type}. Types acceptés : ${allowed}`,
    FILE_TOO_LARGE: (maxMb: string) => `Fichier trop volumineux (max ${maxMb} MB)`,
    FILE_EMPTY: "Fichier vide",
    CONTENT_MISMATCH: (type: string) =>
      `Le contenu du fichier ne correspond pas au type déclaré : ${type}`,
    CONTENT_EMPTY: "Contenu du fichier vide",
  },

  security: {
    MISSING_ORIGIN: "Forbidden — missing origin/referer",
    CROSS_ORIGIN_REJECTED: "Forbidden — cross-origin request rejected",
  },

  email: {
    API_KEY_MISSING: "RESEND_API_KEY non configurée — les emails ne peuvent pas être envoyés",
  },
}
