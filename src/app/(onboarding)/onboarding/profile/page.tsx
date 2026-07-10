"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nba/design-system";
import { User, ArrowRight, Phone } from "lucide-react";
import countries from "@nba/lib/countries.json";

const COUNTRIES = countries.map((c) => c.name);

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("fr");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/onboarding/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, whatsapp, country, language }),
    });

    router.push("/onboarding/kyc");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <User className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Compléter votre profil</h1>
          <p className="text-sm text-muted-foreground">
            Quelques informations pour personnaliser votre expérience
          </p>
        </div>
      </div>

      <Card size="sm" className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-8"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9 h-8"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9 h-8"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Pays
              </label>
              <Select
                value={country}
                onValueChange={(value) => setCountry(value ?? "")}
              >
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Sélectionnez votre pays" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Langue
              </label>
              <Select
                value={language}
                onValueChange={(value) => setLanguage(value ?? "fr")}
              >
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Sélectionnez votre langue" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full h-9" disabled={loading}>
              {loading ? "Enregistrement…" : "Continuer"}
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
