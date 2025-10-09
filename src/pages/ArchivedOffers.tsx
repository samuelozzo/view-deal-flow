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

interface ArchivedOffer {
  id: string;
  title: string;
  description: string;
  platform: string;
  reward_type: string;
  total_reward_cents: number;
  claimed_reward_cents: number;
  required_views: number;
  category: string;
  created_at: string;
  status: string;
}

const ArchivedOffers = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<ArchivedOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchivedOffers();
  }, []);

  const loadArchivedOffers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("business_id", session.user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error("Error loading archived offers:", error);
      toast.error("Impossibile caricare lo storico offerte");
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
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Storico Offerte</CardTitle>
            <CardDescription>
              Le tue offerte completate con successo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Non hai ancora offerte completate
                </p>
                <Button onClick={() => navigate("/create-offer")}>
                  Crea una nuova offerta
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map((offer) => {
                  const progressPercentage = 100;
                  const remainingReward = 0;

                  return (
                    <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            ✓ Completata
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
                                <span>Rimanente: €{remainingReward.toFixed(2)}</span>
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

                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <Calendar className="h-3 w-3" />
                          <span>Creata il {new Date(offer.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArchivedOffers;
