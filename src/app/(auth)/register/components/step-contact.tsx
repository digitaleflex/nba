"use client"

import { Input, Button, Tooltip, TooltipTrigger, TooltipContent } from "@nba/design-system"
import { ArrowLeft, ArrowRight, HelpCircle } from "lucide-react"
import { isValidEmail, isValidWhatsapp } from "./form-utils"

interface StepContactProps {
  email: string
  onChangeEmail: (val: string) => void
  whatsapp: string
  onChangeWhatsapp: (val: string) => void
  onPrev: () => void
  onNext: () => void
}

export function StepContact({
  email,
  onChangeEmail,
  whatsapp,
  onChangeWhatsapp,
  onPrev,
  onNext,
}: StepContactProps) {
  const emailValid = isValidEmail(email)
  const whatsappValid = isValidWhatsapp(whatsapp)
  const isValid = emailValid && whatsappValid

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">Vos coordonnées</p>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
        <Input
          id="email"
          type="email"
          placeholder="a.mensah@exemple.com"
          value={email}
          onChange={(e) => onChangeEmail(e.target.value)}
          required
          autoComplete="email"
          aria-invalid={email.length > 0 && !emailValid}
          className={email.length > 0 && !emailValid ? "border-destructive focus-visible:border-destructive" : ""}
        />
        {email.length > 0 && !emailValid && (
          <p role="alert" className="text-xs text-destructive">Format d&apos;email invalide.</p>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label htmlFor="whatsapp" className="text-sm font-medium text-foreground">WhatsApp</label>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="size-3.5 text-muted-foreground/70 hover:text-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              Utilisé pour t&apos;envoyer les signaux et alertes importantes. Ton numéro reste privé.
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          id="whatsapp"
          type="tel"
          placeholder="+229 01 02 03 05 06"
          value={whatsapp}
          onChange={(e) => onChangeWhatsapp(e.target.value)}
          required
          autoComplete="tel"
          aria-invalid={whatsapp.length > 0 && !whatsappValid}
          className={whatsapp.length > 0 && !whatsappValid ? "border-destructive focus-visible:border-destructive" : ""}
        />
        {whatsapp.length > 0 && !whatsappValid && (
          <p role="alert" className="text-xs text-destructive">Numéro invalide (8 à 15 chiffres attendus).</p>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="size-4" /> Retour
        </Button>
        <Button type="button" className="flex-1" disabled={!isValid} onClick={onNext}>
          Suivant <ArrowRight className="size-4" />
        </Button>
      </div>
      {!isValid && (
        <p className="text-xs text-muted-foreground text-center">
          Renseignez un email et un WhatsApp valides pour continuer.
        </p>
      )}
    </div>
  )
}
