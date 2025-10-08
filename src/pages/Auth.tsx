import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Validation schemas
const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<"business" | "creator">("creator");
  const [displayName, setDisplayName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [instagramAccessToken, setInstagramAccessToken] = useState("");
  const [instagramUserId, setInstagramUserId] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validate input
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        setIsLoading(false);
        return;
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.session) {
      toast.success(t("loginSuccess"));
      navigate("/dashboard");
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validate input
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        setIsLoading(false);
        return;
      }

      if (!displayName.trim()) {
        toast.error(accountType === "creator" ? "Nome utente richiesto" : "Nome azienda richiesto");
        setIsLoading(false);
        return;
      }

      if (accountType === "creator") {
        if (!instagramAccessToken.trim()) {
          toast.error("Instagram Access Token richiesto per i creator");
          setIsLoading(false);
          return;
        }
        if (!instagramUserId.trim()) {
          toast.error("Instagram User ID richiesto per i creator");
          setIsLoading(false);
          return;
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        setIsLoading(false);
        return;
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          account_type: accountType,
          display_name: displayName.trim(),
          ...(accountType === "creator" && {
            instagram_access_token: instagramAccessToken.trim(),
            instagram_user_id: instagramUserId.trim()
          })
        }
      }
    });

    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Please login instead.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    if (data.user) {
      toast.success(t("accountCreated"));
      navigate("/dashboard");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(resetEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/account-settings`,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Email di reset password inviata! Controlla la tua casella di posta.");
    setShowResetPassword(false);
    setResetEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{t("welcomeBack")}</h1>
            <p className="text-muted-foreground">{t("signInToContinue")}</p>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">{t("signIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("createAccount")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              {!showResetPassword ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t("email")}</Label>
                    <Input 
                      id="login-email"
                      name="email"
                      type="email" 
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t("password")}</Label>
                    <Input 
                      id="login-password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t("loggingIn") : t("signIn")}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Hai dimenticato la password?
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input 
                      id="reset-email"
                      type="email" 
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Ti invieremo un'email per reimpostare la password
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Invio in corso..." : "Invia Email di Reset"}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(false);
                        setResetEmail("");
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Torna al login
                    </button>
                  </div>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-type">{t("accountType")}</Label>
                  <Select value={accountType} onValueChange={(value: "business" | "creator") => {
                    setAccountType(value);
                    setDisplayName("");
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="creator">{t("creator")}</SelectItem>
                      <SelectItem value="business">{t("business")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-name">
                    {accountType === "creator" ? "Nome Utente" : "Nome Azienda"}
                  </Label>
                  <Input 
                    id="display-name"
                    type="text"
                    placeholder={accountType === "creator" ? "Il tuo nome utente" : "Nome della tua azienda"}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
                {accountType === "creator" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="instagram-access-token">Instagram Access Token</Label>
                      <Input 
                        id="instagram-access-token"
                        type="text"
                        placeholder="Il tuo Instagram Access Token"
                        value={instagramAccessToken}
                        onChange={(e) => setInstagramAccessToken(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Necessario per recuperare automaticamente le views dei tuoi video
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram-user-id">Instagram User ID</Label>
                      <Input 
                        id="instagram-user-id"
                        type="text"
                        placeholder="Il tuo Instagram Business Account ID"
                        value={instagramUserId}
                        onChange={(e) => setInstagramUserId(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t("email")}</Label>
                  <Input 
                    id="signup-email"
                    name="email"
                    type="email" 
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t("password")}</Label>
                  <Input 
                    id="signup-password"
                    name="password"
                    type="password"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">{t("confirmPassword")}</Label>
                  <Input 
                    id="signup-confirm"
                    name="confirmPassword"
                    type="password"
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("creatingAccount") : t("createAccount")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
