"use client"

import { Input, Button } from "@nba/design-system"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface StepIdentityProps {
  firstName: string
  onChangeFirstName: (val: string) => void
  lastName: string
  onChangeLastName: (val: string) => void
  onPrev: () => void
  onNext: () => void
}

export function StepIdentity({
  firstName,
  onChangeFirstName,
  lastName,
  onChangeLastName,
  onPrev,
  onNext,
}: StepIdentityProps) {
  const isValid = firstName.trim().length >= 2 && lastName.trim().length >= 2

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">Commençons par votre identité</p>
      <div className="space-y-1.5">
        <label htmlFor="firstName" className="text-sm font-medium text-foreground">Prénom</label>
        <Input
          id="firstName"
          type="text"
          placeholder="Kofi"
          value={firstName}
          onChange={(e) => onChangeFirstName(e.target.value)}
          required
          autoComplete="given-name"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="lastName" className="text-sm font-medium text-foreground">Nom</label>
        <Input
          id="lastName"
          type="text"
          placeholder="Mensah"
          value={lastName}
          onChange={(e) => onChangeLastName(e.target.value)}
          required
          autoComplete="family-name"
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
      {!isValid && (
        <p className="text-xs text-muted-foreground text-center">
          Indiquez votre prénom et votre nom (2 caractères minimum) pour continuer.
        </p>
      )}
    </div>
  )
}
