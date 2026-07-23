"use client"

import { useState, useMemo } from "react"
import { Button, Tooltip, TooltipTrigger, TooltipContent } from "@nba/design-system"
import { PasswordField } from "@nba/app/components/password-field"
import { ArrowLeft, ArrowRight, Check, AlertCircle, HelpCircle } from "lucide-react"
import { getPasswordStrength, RULES, isPasswordValid, MIN_PASSWORD_LENGTH } from "./password-utils"

interface StepSecurityProps {
  password: string
  onChangePassword: (val: string) => void
  confirmPassword: string
  onChangeConfirmPassword: (val: string) => void
  onPrev: () => void
  onNext: () => void
}

export function StepSecurity({ password, onChangePassword, confirmPassword, onChangeConfirmPassword, onPrev, onNext }: StepSecurityProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])
  const isValid = isPasswordValid(password)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">Créez un mot de passe sécurisé</p>

      <PasswordField
        label="Mot de passe"
        placeholder={`Min. ${MIN_PASSWORD_LENGTH} caractères`}
        value={password}
        onChange={(e) => {
          onChangePassword(e.target.value)
          setTouched(true)
        }}
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        show={showPassword}
        onToggle={() => setShowPassword(!showPassword)}
        tooltip={
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="size-3.5 text-muted-foreground/70 hover:text-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              Utilisez au moins {MIN_PASSWORD_LENGTH} caractères avec majuscule, minuscule, chiffre et caractère spécial pour sécuriser votre compte.
            </TooltipContent>
          </Tooltip>
        }
      />

      <PasswordField
        label="Confirmer le mot de passe"
        placeholder="Retapez votre mot de passe"
        value={confirmPassword}
        onChange={(e) => onChangeConfirmPassword(e.target.value)}
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        show={showPassword}
        onToggle={() => setShowPassword(!showPassword)}
        error={confirmPassword.length > 0 && !passwordsMatch ? "Les mots de passe ne correspondent pas" : undefined}
        aria-invalid={confirmPassword.length > 0 && !passwordsMatch ? true : undefined}
      />

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
                className={`h-full rounded-full transition-all duration-500 ease-out ${strength.color}`}
                style={{ width: `${(strength.score / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground/80 min-h-4 transition-opacity">
              {strength.feedback}
            </p>
          </div>

          <div className="space-y-1.5">
            {RULES.map((rule) => {
              const valid = rule.test(password)
              return (
                <div
                  key={rule.label}
                  className="flex items-center gap-2 text-sm transition-all duration-300"
                >
                  <span className="size-3.5 shrink-0 flex items-center justify-center">
                    {valid ? (
                      <Check className="size-3.5 text-success transition-all duration-300 scale-100" />
                    ) : (
                      <AlertCircle className="size-3 text-muted-foreground transition-all duration-300" />
                    )}
                  </span>
                  <span
                    className={`transition-all duration-300 ${valid ? "text-success font-medium" : "text-muted-foreground"}`}
                  >
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
        <Button type="button" className="flex-1" disabled={!isValid || !passwordsMatch} onClick={onNext}>
          Suivant <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
