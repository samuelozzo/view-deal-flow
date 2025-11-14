import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Shield, Eye, TrendingUp, Lock } from "lucide-react";
import logo from "@/assets/logo.png";
import appScreenshot1 from "@/assets/app-screenshot-1.jpg";
import appScreenshot2 from "@/assets/app-screenshot-2.jpg";
import { usePassword } from "@/contexts/PasswordContext";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [password, setPassword] = useState("");
  const { checkPassword } = usePassword();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
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
              Connetti creator e brand attraverso visualizzazioni verificate. 
              Pagamenti sicuri in escrow, verifica in 14 giorni, marketplace europeo.
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

      {/* Screenshots Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Un'anteprima della piattaforma
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="overflow-hidden">
              <img 
                src={appScreenshot1} 
                alt="Dashboard WeasyDeal" 
                className="w-full h-auto"
              />
            </Card>
            <Card className="overflow-hidden">
              <img 
                src={appScreenshot2} 
                alt="App Mobile WeasyDeal" 
                className="w-full h-auto"
              />
            </Card>
          </div>
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
              
              <form onSubmit={handleSubmit} className="space-y-4">
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
