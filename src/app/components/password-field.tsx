"use client"

import { useState, useSyncExternalStore } from "react"
import { Input } from "@nba/design-system"
import { Eye, EyeOff } from "lucide-react"

function useSafariPasswordToggle() {
  return useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return false
      return CSS.supports("selector(input[type='password']::-webkit-textfield-decoration-container)")
    },
    () => false,
  )
}

interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string
  error?: string
  tooltip?: React.ReactNode
  prefixIcon?: React.ReactNode
  show?: boolean
  onToggle?: () => void
}

export function PasswordField({
  label,
  error,
  tooltip,
  prefixIcon,
  className,
  id,
  show: controlledShow,
  onToggle,
  ...inputProps
}: PasswordFieldProps) {
  const isSafari = useSafariPasswordToggle()
  const [internalShow, setInternalShow] = useState(false)
  const show = controlledShow ?? internalShow
  const inputId = id ?? inputProps.name

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {tooltip}
      </div>
      <div className="relative">
        {prefixIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {prefixIcon}
          </div>
        )}
        <Input
          id={inputId}
          type={show ? "text" : "password"}
          className={[
            prefixIcon ? "pl-9" : "",
            !isSafari ? "pr-9" : "",
            className ?? "",
          ].join(" ")}
          aria-invalid={!!error}
          {...inputProps}
        />
        {!isSafari && (
          <button
            type="button"
            onClick={() => onToggle ? onToggle() : setInternalShow(!internalShow)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 size-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg"
            aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            tabIndex={-1}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[11px] text-destructive mt-1" role="alert">{error}</p>
      )}
    </div>
  )
}
