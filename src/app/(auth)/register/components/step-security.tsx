"use client"

import { useState, useMemo } from "react"
import { Input, Button } from "@nba/design-system"
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check, AlertCircle } from "lucide-react"
import { getPasswordStrength, RULES } from "./password-utils"

interface StepSecurityProps {
  password: string
  onChangePassword: (val: string) => void
  onPrev: () => void
  onNext: () => void
}

export function StepSecurity({ password, onChangePassword, onPrev, onNext }: StepSecurityProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])
  const isValid = password.length >= 8

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">Créez un mot de passe sécurisé</p>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">Mot de passe</label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 caractères"
            value={password}
            onChange={(e) => {
              onChangePassword(e.target.value)
              setTouched(true)
            }}
            required
            autoComplete="new-password"
            minLength={8}
            className="pr-9"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {touched && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Solidité</span>
              <span className="font-medium" style={{ color: strength.color.replace("bg-", "var(--color-") }}>
                {strength.label}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${(strength.score / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            {RULES.map((rule) => {
              const valid = rule.test(password)
              return (
                <div key={rule.label} className="flex items-center gap-2 text-sm">
                  {valid ? (
                    <Check className="size-3.5 text-success shrink-0" />
                  ) : (
                    <div className="size-3.5 shrink-0 flex items-center justify-center">
                      <AlertCircle className="size-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className={valid ? "text-success" : "text-muted-foreground"}>
                    {rule.label}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

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
