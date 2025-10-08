import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const EditOffer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [hasActiveApplications, setHasActiveApplications] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requiredViews: "",
    platform: "TikTok",
  });

  useEffect(() => {
    loadOffer();
  }, [id]);

  const loadOffer = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load offer
      const { data: offer, error: offerError } = await supabase
        .from("offers")
        .select("*")
        .eq("id", id)
        .eq("business_id", session.user.id)
        .single();

      if (offerError || !offer) {
        toast({
          title: "Errore",
          description: "Offerta non trovata",
          variant: "destructive",
        });
        navigate("/manage-offers");
        return;
      }

      // Check for active applications
      const { data: applications } = await supabase
        .from("applications")
        .select("id")
        .eq("offer_id", id)
        .in("status", ["pending", "accepted"]);

      if ((applications?.length || 0) > 0) {
        setHasActiveApplications(true);
        toast({
          title: "Modifica non consentita",
          description: "Non puoi modificare un'offerta con partecipanti attivi o in attesa",
          variant: "destructive",
        });
        navigate("/manage-offers");
        return;
      }

      setFormData({
        title: offer.title,
        description: offer.description,
        requiredViews: offer.required_views.toString(),
        platform: offer.platform,
      });
    } catch (error) {
      console.error("Error loading offer:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare l'offerta",
        variant: "destructive",
      });
      navigate("/manage-offers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasActiveApplications) {
      toast({
        title: "Errore",
        description: "Non puoi modificare un'offerta con partecipanti attivi",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("offers")
        .update({
          title: formData.title,
          description: formData.description,
          required_views: Number(formData.requiredViews),
          platform: formData.platform as "TikTok" | "Instagram" | "YouTube",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Offerta aggiornata con successo",
      });
      
      navigate("/manage-offers");
    } catch (error) {
      console.error("Error updating offer:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'offerta",
        variant: "destructive",
      });
    }
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
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/manage-offers")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla gestione offerte
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Modifica Offerta</CardTitle>
            <CardDescription>
              Aggiorna i dettagli della tua offerta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t("offerTitle")}</Label>
                <Input
                  id="title"
                  placeholder={t("offerTitlePlaceholder")}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("description")}</Label>
                <Textarea
                  id="description"
                  placeholder={t("descriptionPlaceholder")}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">{t("platformLabel")}</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TikTok">{t("tiktok")}</SelectItem>
                    <SelectItem value="Instagram">{t("instagram")}</SelectItem>
                    <SelectItem value="YouTube">{t("youtube")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredViews">{t("requiredViewsLabel")}</Label>
                <Input
                  id="requiredViews"
                  type="number"
                  placeholder="E.g., 10000"
                  value={formData.requiredViews}
                  onChange={(e) => setFormData({ ...formData, requiredViews: e.target.value })}
                  required
                />
              </div>

              <div className="pt-4 flex gap-4">
                <Button type="submit" className="flex-1">
                  Salva Modifiche
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/manage-offers")}
                >
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditOffer;
