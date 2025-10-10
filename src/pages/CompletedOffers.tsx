import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Calendar, DollarSign, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompletedOffer {
  id: string;
  title: string;
  description: string;
  platform: string;
  reward_type: string;
  total_reward_cents: number;
  claimed_reward_cents: number;
  required_views: number;
  category: string;
  status: string;
  profiles?: {
    display_name: string | null;
  };
}

const CompletedOffers = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<CompletedOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompletedOffers();
  }, []);

  const loadCompletedOffers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get all applications from the creator that have offers with status 'completed'
      // and have verified submissions
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          submissions!inner (
            id,
            status
          ),
          offers!inner (
            id,
            title,
            description,
            platform,
            reward_type,
            total_reward_cents,
            claimed_reward_cents,
            required_views,
            category,
            status,
            profiles:business_id (
              display_name
            )
          )
        `)
        .eq("creator_id", session.user.id)
        .eq("offers.status", "completed")
        .eq("submissions.status", "verified");

      if (error) throw error;

      // Extract unique offers from applications with verified submissions
      // Exclude discount offers as they don't have monetary rewards
      const uniqueOffers = new Map();
      data?.forEach((app: any) => {
        if (app.offers && !uniqueOffers.has(app.offers.id)) {
          // Only show cash offers in completed offers page
          if (app.offers.reward_type === 'cash') {
            uniqueOffers.set(app.offers.id, app.offers);
          }
        }
      });

      setOffers(Array.from(uniqueOffers.values()));
    } catch (error) {
      console.error("Error loading completed offers:", error);
      toast.error("Impossibile caricare le offerte concluse");
    } finally {
      setLoading(false);
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
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Offerte Concluse</h1>
          <p className="text-muted-foreground">
            Le offerte a cui hai partecipato che sono state completate con successo
          </p>
        </div>

        {offers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Non hai ancora partecipato a offerte concluse
              </p>
              <Button onClick={() => navigate("/offers")}>
                Esplora le offerte disponibili
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => {
              const progressPercentage = 100;
              const businessName = offer.profiles?.display_name || "Unknown Business";

              return (
                <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        ✓ Conclusa
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {offer.platform}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{offer.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {offer.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Business:</span>
                      <span className="font-medium">{businessName}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Ricompensa Totale:</span>
                        <span className="font-bold text-lg text-primary">
                          €{(offer.total_reward_cents / 100).toFixed(2)}
                        </span>
                      </div>
                      
                      {offer.reward_type === "cash" && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Erogata: €{(offer.claimed_reward_cents / 100).toFixed(2)}</span>
                            <span>100% completata</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Visualizzazioni</p>
                          <p className="font-semibold">{offer.required_views.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Categoria</p>
                          <p className="font-semibold">{offer.category}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedOffers;
