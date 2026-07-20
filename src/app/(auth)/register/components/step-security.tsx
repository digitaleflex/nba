"use client"

import { useState, useMemo } from "react"
import { Input, Button, Tooltip, TooltipTrigger, TooltipContent } from "@nba/design-system"
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check, AlertCircle, HelpCircle } from "lucide-react"
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
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">Mot de passe</label>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="size-3.5 text-muted-foreground/70 hover:text-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              Utilisez au moins {MIN_PASSWORD_LENGTH} caractères avec majuscule, minuscule, chiffre et caractère spécial pour sécuriser votre compte.
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder={`Min. ${MIN_PASSWORD_LENGTH} caractères`}
            value={password}
            onChange={(e) => {
              onChangePassword(e.target.value)
              setTouched(true)
            }}
            required
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            className="pr-9"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 size-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirmer le mot de passe</label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          placeholder="Retapez votre mot de passe"
          value={confirmPassword}
          onChange={(e) => onChangeConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          aria-invalid={confirmPassword.length > 0 && !passwordsMatch ? true : undefined}
          className={confirmPassword.length > 0 && !passwordsMatch ? "border-destructive" : ""}
        />
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
        )}
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
        <Button type="button" className="flex-1" disabled={!isValid || !passwordsMatch} onClick={onNext}>
          Suivant <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
