import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRoute, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "wouter";
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [, params] = useRoute("/reset/:token");
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"request" | "verify" | "success">(params ? "verify" : "request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const requestResetMutation = useMutation({
    mutationFn: async (emailValue: string) => {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de la demande");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Email envoyé ! Vérifiez votre boîte mail.");
      setStep("success");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur de réinitialisation");
      }
      return res.json();
    },
    onSuccess: () => {
      setStep("success");
      setTimeout(() => setLocation("/app"), 3000);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 border-b border-blue-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-6 h-6 text-white" />
          <h1 className="text-white font-bold text-xl">Espace Sécurisé</h1>
        </div>
        <Link href="/app" className="text-blue-100 hover:text-white text-sm font-medium flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {step === "request" ? (
            <div className="bg-white rounded-lg shadow-2xl p-8 space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Réinitialiser votre mot de passe</h2>
                <p className="text-slate-600">Entrez votre adresse email pour recevoir un lien de réinitialisation sécurisé.</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Vérifiez que vous avez accès à cet email. Le lien expirera après 1 heure.
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-slate-700 font-semibold">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-slate-300 focus:border-blue-600"
                  data-testid="input-reset-email"
                />
              </div>

              <Button
                onClick={() => {
                  const setLocation = useLocation()[1];
                  setLocation("/verify");
                }}
                disabled={!email}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
                data-testid="button-request-reset"
              >
                Continuer vers la vérification
              </Button>

              <p className="text-center text-xs text-slate-500">
                Vos données sont protégées par un chiffrement SSL 256-bit
              </p>
            </div>
          ) : step === "verify" ? (
            <div className="bg-white rounded-lg shadow-2xl p-8 space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Créer un nouveau mot de passe</h2>
                <p className="text-slate-600">Saisissez un nouveau mot de passe sécurisé.</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">
                  Le lien de réinitialisation est valide. Vous avez 1 heure pour changer votre mot de passe.
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="new-password" className="text-slate-700 font-semibold">Nouveau mot de passe</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border-slate-300 focus:border-blue-600"
                  data-testid="input-new-password"
                />
                <p className="text-xs text-slate-500">Minimum 8 caractères</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirm-password" className="text-slate-700 font-semibold">Confirmez le mot de passe</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-slate-300 focus:border-blue-600"
                  data-testid="input-confirm-password"
                />
              </div>

              <Button
                onClick={() => {
                  if (newPassword !== confirmPassword) {
                    toast.error("Les mots de passe ne correspondent pas");
                    return;
                  }
                  if (newPassword.length < 8) {
                    toast.error("Le mot de passe doit contenir au moins 8 caractères");
                    return;
                  }
                  resetMutation.mutate({
                    token: params?.token || "",
                    password: newPassword,
                  });
                }}
                disabled={!newPassword || !confirmPassword || resetMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
                data-testid="button-confirm-reset"
              >
                {resetMutation.isPending ? "Réinitialisation..." : "Confirmer et réinitialiser"}
              </Button>

              <p className="text-center text-xs text-slate-500">
                Vos données sont protégées par un chiffrement SSL 256-bit
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-2xl p-8 space-y-6 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Mot de passe réinitialisé</h2>
                <p className="text-slate-600">Votre mot de passe a été mis à jour avec succès.</p>
              </div>

              <p className="text-sm text-slate-500">
                Redirection vers l'application en cours...
              </p>

              <Link href="/app" className="inline-block">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  Aller à l'application
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-800 border-t border-slate-700 px-6 py-4 text-center text-slate-400 text-xs space-y-2">
        <p>🔒 Connexion sécurisée SSL 256-bit | Espace Protégé</p>
        <p>© 2024 SocialApp. Tous droits réservés.</p>
      </div>
    </div>
  );
}
