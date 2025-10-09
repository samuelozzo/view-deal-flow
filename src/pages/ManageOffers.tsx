import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Offer {
  id: string;
  title: string;
  description: string;
  platform: string;
  reward_type: string;
  total_reward_cents: number;
  required_views: number;
  status: string;
  created_at: string;
  has_active_applications?: boolean;
}

const ManageOffers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch user's offers (excluding completed ones)
      const { data: offersData, error: offersError } = await supabase
        .from("offers")
        .select("*")
        .eq("business_id", session.user.id)
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      if (offersError) throw offersError;

      // For each offer, check if it has active/pending applications
      const offersWithStatus = await Promise.all(
        (offersData || []).map(async (offer) => {
          const { data: applications } = await supabase
            .from("applications")
            .select("status")
            .eq("offer_id", offer.id)
            .in("status", ["pending", "accepted"]);

          return {
            ...offer,
            has_active_applications: (applications?.length || 0) > 0,
          };
        })
      );

      setOffers(offersWithStatus);
    } catch (error) {
      console.error("Error loading offers:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le offerte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!offerToDelete) return;

    try {
      // Call edge function to cancel offer and release escrow funds
      const { data, error } = await supabase.functions.invoke('cancel-offer', {
        body: {
          offer_id: offerToDelete.id,
        },
      });

      if (error) {
        console.error("Error cancelling offer:", error);
        toast({
          title: "Errore",
          description: error.message || "Impossibile annullare l'offerta",
          variant: "destructive",
        });
        return;
      }

      if (!data?.success) {
        toast({
          title: "Errore",
          description: data?.error || "Impossibile annullare l'offerta",
          variant: "destructive",
        });
        return;
      }

      const fundsReleased = data.funds_released || 0;
      toast({
        title: "Successo",
        description: fundsReleased > 0 
          ? `Offerta annullata e €${(fundsReleased / 100).toFixed(2)} riaccreditati al tuo wallet`
          : "Offerta annullata con successo",
      });

      setOffers(offers.filter((o) => o.id !== offerToDelete.id));
      setDeleteDialogOpen(false);
      setOfferToDelete(null);
    } catch (error) {
      console.error("Error cancelling offer:", error);
      toast({
        title: "Errore",
        description: "Impossibile annullare l'offerta",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (offer: Offer) => {
    setOfferToDelete(offer);
    setDeleteDialogOpen(true);
  };

  const getRewardDisplay = (offer: Offer) => {
    if (offer.reward_type === "cash") {
      return `€${(offer.total_reward_cents / 100).toFixed(2)}`;
    }
    return offer.reward_type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      draft: "secondary",
      active: "default",
      closed: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
            <CardTitle>Gestione Offerte</CardTitle>
            <CardDescription>
              Modifica o elimina le tue offerte (solo se non hanno partecipanti attivi o in attesa)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Non hai ancora creato offerte</p>
                <Button onClick={() => navigate("/create-offer")}>
                  Crea la tua prima offerta
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <Card key={offer.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{offer.title}</h3>
                            {getStatusBadge(offer.status)}
                            {offer.has_active_applications && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Con partecipanti
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {offer.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span>
                              <strong>Piattaforma:</strong> {offer.platform}
                            </span>
                            <span>
                              <strong>Ricompensa:</strong> {getRewardDisplay(offer)}
                            </span>
                            <span>
                              <strong>Visualizzazioni richieste:</strong> {offer.required_views.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(`/edit-offer/${offer.id}`)}
                            disabled={offer.has_active_applications}
                            title={
                              offer.has_active_applications
                                ? "Non puoi modificare un'offerta con partecipanti attivi"
                                : "Modifica offerta"
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => confirmDelete(offer)}
                            disabled={offer.has_active_applications}
                            title={
                              offer.has_active_applications
                                ? "Non puoi eliminare un'offerta con partecipanti attivi"
                                : "Elimina offerta"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare l'offerta "{offerToDelete?.title}"? 
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageOffers;
