"use client"

import { Input, Button } from "@nba/design-system"
import { ArrowLeft, ArrowRight } from "lucide-react"

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
  const isValid = !!email && !!whatsapp

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
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="whatsapp" className="text-sm font-medium text-foreground">WhatsApp</label>
        <Input
          id="whatsapp"
          type="tel"
          placeholder="+229 01 02 03 05 06"
          value={whatsapp}
          onChange={(e) => onChangeWhatsapp(e.target.value)}
          required
          autoComplete="tel"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="size-4" /> Retour
        </Button>
        <Button type="button" className="flex-1" disabled={!isValid} onClick={onNext}>
          Suivant <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
