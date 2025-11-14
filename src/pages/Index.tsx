import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Shield, Eye, TrendingUp, Lock, Users, Rocket, CheckCircle2, Mail } from "lucide-react";
import logo from "@/assets/logo.png";
import { usePassword } from "@/contexts/PasswordContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { checkPassword } = usePassword();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPassword(password)) {
      toast({
        title: "Accesso consentito",
        description: "Benvenuto in WeasyDeal Beta",
      });
      navigate("/onboarding");
    } else {
      toast({
        title: "Password errata",
        description: "La password inserita non è corretta",
        variant: "destructive",
      });
      setPassword("");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email }]);

      if (error) throw error;

      toast({
        title: "Iscrizione completata!",
        description: "Ti terremo aggiornato sugli sviluppi della beta",
      });
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "C'è stato un problema con l'iscrizione",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="flex justify-center mb-12">
            <img src={logo} alt="WeasyDeal" className="h-16 md:h-20" />
          </div>
          
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Il Marketplace per{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Creator e Brand
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              E se ti dicessi che il tuo prodotto/servizio potrebbe essere condiviso da migliaia di utenti in qualche giorno?
            </p>

            <div className="inline-block bg-accent/20 px-6 py-3 rounded-full">
              <p className="text-xl font-semibold text-accent">
                🚀 Presto Disponibile
              </p>
            </div>

            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-sm text-warning-foreground">
                ⚠️ Accesso alla Beta limitato • Posti riservati per creator e aziende selezionate
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Perché WeasyDeal?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            La piattaforma che rivoluziona il marketing digitale
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            <Card className="p-8 space-y-4 border-2 border-primary/20">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">Per i Creator</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Monetizza il tuo pubblico in modo trasparente e sicuro</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Ricevi pagamenti garantiti tramite escrow</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Collabora con brand affidabili e verificati</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Nessun rischio di non essere pagato</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 space-y-4 border-2 border-accent/20">
              <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center">
                <Rocket className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-2xl font-bold">Per i Business</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Raggiungi migliaia di potenziali clienti in pochi giorni</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Paga solo per risultati reali e verificati</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Collabora con creator selezionati nel tuo settore</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Sistema di verifica automatica delle visualizzazioni</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Newsletter Section */}
          <Card className="p-8 md:p-12 max-w-3xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <div className="text-center space-y-4 mb-6">
              <Mail className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-2xl md:text-3xl font-bold">
                Rimani Aggiornato
              </h3>
              <p className="text-muted-foreground">
                Iscriviti alla lista d'attesa e sii tra i primi ad accedere alla piattaforma
              </p>
            </div>
            
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="La tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting}
                className="sm:w-auto"
              >
                {isSubmitting ? "Invio..." : "Iscriviti"}
              </Button>
            </form>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              Non invieremo spam. Promettiamo di aggiornarti solo sulle novità importanti.
            </p>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Pagamenti Sicuri</h3>
              <p className="text-muted-foreground">
                Sistema escrow che protegge brand e creator
              </p>
            </Card>
            
            <Card className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Visualizzazioni Verificate</h3>
              <p className="text-muted-foreground">
                Verifica automatica delle views in 14 giorni
              </p>
            </Card>
            
            <Card className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Matching Intelligente</h3>
              <p className="text-muted-foreground">
                Trova le migliori opportunità per il tuo brand
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Access Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Accesso Beta</h2>
                <p className="text-muted-foreground">
                  Inserisci la password per accedere alla piattaforma
                </p>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Password di accesso"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center"
                />
                <Button type="submit" className="w-full" size="lg">
                  Accedi alla Beta
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 WeasyDeal. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
