import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, KeyRound, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Instagram } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { z } from "zod";

const AccountSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [accountType, setAccountType] = useState<string>("");
  const [instagramAccessToken, setInstagramAccessToken] = useState("");
  const [instagramUserId, setInstagramUserId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, bio, account_type, instagram_access_token, instagram_user_id')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setDisplayName(data?.display_name || "");
      setBio(data?.bio || "");
      setAccountType(data?.account_type || "");
      setInstagramAccessToken(data?.instagram_access_token || "");
      setInstagramUserId(data?.instagram_user_id || "");
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Errore nel caricamento del profilo");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData: any = {
        display_name: displayName.trim(),
        bio: bio.trim(),
      };

      // Only update Instagram fields for creator accounts
      if (accountType === "creator") {
        updateData.instagram_access_token = instagramAccessToken.trim() || null;
        updateData.instagram_user_id = instagramUserId.trim() || null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) throw error;

      toast.success("Impostazioni salvate con successo!");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Errore nel salvataggio delle impostazioni");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword.length < 6) {
      toast.error("La nuova password deve essere di almeno 6 caratteri");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Le password non corrispondono");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("La nuova password deve essere diversa da quella attuale");
      return;
    }

    setChangingPassword(true);

    try {
      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Password attuale non corretta");
        setChangingPassword(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success("Password modificata con successo!");
      
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Errore nella modifica della password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleInstagramConnect = () => {
    const clientId = import.meta.env.VITE_INSTAGRAM_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/instagram/callback`;
    const scope = 'instagram_basic,instagram_manage_insights';
    
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    window.location.href = authUrl;
  };

  const handleDeleteAccount = async () => {
    if (confirmEmail !== user?.email) {
      toast.error("L'email non corrisponde");
      return;
    }

    setDeleting(true);

    try {
      // Delete user account using admin function
      const { error } = await supabase.rpc('delete_user_account');
      
      if (error) throw error;

      toast.success("Account eliminato con successo");
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Errore nell'eliminazione dell'account");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Impostazioni Account</h1>
          <p className="text-muted-foreground">Gestisci le tue informazioni personali</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informazioni Profilo</CardTitle>
            <CardDescription>
              Aggiorna i tuoi dati personali
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  L'email non può essere modificata
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-type">Tipo Account</Label>
                <Input
                  id="account-type"
                  value={accountType === "creator" ? "Creator" : "Business"}
                  disabled
                  className="bg-muted capitalize"
                />
                <p className="text-xs text-muted-foreground">
                  Il tipo di account non può essere modificato
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display-name">
                  {accountType === "creator" ? "Nome Utente" : "Nome Azienda"}
                </Label>
                <Input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={accountType === "creator" ? "Il tuo nome utente" : "Nome della tua azienda"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (opzionale)</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Racconta qualcosa di te..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/500 caratteri
                </p>
              </div>

              {accountType === "creator" && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Integrazione Instagram</h3>
                      <p className="text-sm text-muted-foreground">
                        Configura le credenziali per il recupero automatico delle views
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram-access-token">Instagram Access Token</Label>
                      <Input 
                        id="instagram-access-token"
                        type="text"
                        placeholder="Il tuo Instagram Access Token"
                        value={instagramAccessToken}
                        onChange={(e) => setInstagramAccessToken(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Token di accesso per l'API Instagram Graph. Puoi ottenerlo dal Meta Developer Portal.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram-user-id">Instagram Business Account ID</Label>
                      <Input 
                        id="instagram-user-id"
                        type="text"
                        placeholder="Il tuo Instagram Business Account ID"
                        value={instagramUserId}
                        onChange={(e) => setInstagramUserId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        L'ID del tuo account Instagram Business
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={saving || !displayName.trim()}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    "Salva Modifiche"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={saving}
                >
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <CardTitle>Sicurezza</CardTitle>
            </div>
            <CardDescription>
              Modifica la tua password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current-password">Password Attuale</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Inserisci la password attuale"
                  required
                  disabled={changingPassword}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="new-password">Nuova Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Almeno 6 caratteri"
                  minLength={6}
                  required
                  disabled={changingPassword}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Conferma Nuova Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Reinserisci la nuova password"
                  minLength={6}
                  required
                  disabled={changingPassword}
                />
              </div>

              <Button 
                type="submit" 
                disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                className="w-full"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Modifica in corso...
                  </>
                ) : (
                  "Modifica Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6 border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Zona Pericolosa</CardTitle>
            </div>
            <CardDescription>
              Elimina permanentemente il tuo account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Una volta eliminato l'account, tutti i tuoi dati verranno cancellati permanentemente. 
              Questa azione non può essere annullata.
            </p>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Elimina Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sei sicuro?</DialogTitle>
                  <DialogDescription>
                    Questa azione è permanente e non può essere annullata. Tutti i tuoi dati verranno eliminati.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirm-email">
                      Conferma inserendo la tua email: <strong>{user?.email}</strong>
                    </Label>
                    <Input
                      id="confirm-email"
                      type="email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      placeholder="Inserisci la tua email"
                      disabled={deleting}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteDialogOpen(false);
                        setConfirmEmail("");
                      }}
                      disabled={deleting}
                      className="flex-1"
                    >
                      Annulla
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleting || confirmEmail !== user?.email}
                      className="flex-1"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Eliminazione...
                        </>
                      ) : (
                        "Elimina Definitivamente"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSettings;
