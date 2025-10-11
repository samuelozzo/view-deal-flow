import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { Search, DollarSign, Eye, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Offer {
  id: string;
  title: string;
  description: string;
  reward_type: string;
  total_reward_cents: number;
  claimed_reward_cents: number;
  required_views: number;
  platform: string;
  category: string;
  status: string;
  discount_percentage: number | null;
  discount_code: string | null;
  max_participants: number | null;
  profiles?: {
    display_name: string | null;
  };
}

const Offers = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rewardFilter, setRewardFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [pendingAppsWarning, setPendingAppsWarning] = useState(false);
  const [pendingAppsCount, setPendingAppsCount] = useState(0);

  useEffect(() => {
    checkAdminRole();
    fetchOffers();
  }, []);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    setIsAdmin(roles?.some(r => r.role === 'admin') || false);
  };

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          profiles:business_id (
            display_name
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log("DEBUG Offers data:", data);
      console.log("DEBUG First offer:", data?.[0]);
      setOffers(data || []);
    } catch (error: any) {
      console.error("Error fetching offers:", error);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  const filteredOffers = offers.filter((offer) => {
    const businessName = offer.profiles?.display_name || "Unknown";
    const matchesSearch =
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      businessName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory =
      categoryFilter === "all" || offer.category === categoryFilter;
    
    // For discount offers, ignore reward filter (not applicable)
    const matchesReward = offer.reward_type === "discount" 
      ? true 
      : rewardFilter === "all" ||
        (rewardFilter === "low" && offer.total_reward_cents < 10000) ||
        (rewardFilter === "medium" && offer.total_reward_cents >= 10000 && offer.total_reward_cents < 50000) ||
        (rewardFilter === "high" && offer.total_reward_cents >= 50000);

    return matchesSearch && matchesCategory && matchesReward;
  });

  const handleDeleteClick = async (offer: Offer) => {
    setSelectedOffer(offer);
    setAdminMessage("");
    setPendingAppsWarning(false);
    
    // Check for pending applications
    const { data: apps } = await supabase
      .from('applications')
      .select('id')
      .eq('offer_id', offer.id)
      .eq('status', 'pending');
    
    const count = apps?.length || 0;
    setPendingAppsCount(count);
    
    if (count > 0) {
      setPendingAppsWarning(true);
    }
    
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOffer || !adminMessage.trim()) {
      toast.error("Inserisci un messaggio per la notifica");
      return;
    }

    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-offer', {
        body: {
          offer_id: selectedOffer.id,
          admin_message: adminMessage,
        },
      });

      if (error) throw error;

      toast.success(`Offerta eliminata. ${data.funds_released > 0 ? `€${(data.funds_released / 100).toFixed(2)} rilasciati.` : ''} ${data.applications_rejected > 0 ? `${data.applications_rejected} applicazioni rifiutate.` : ''}`);
      
      setDeleteDialogOpen(false);
      setSelectedOffer(null);
      setAdminMessage("");
      fetchOffers();
    } catch (error: any) {
      console.error('Error deleting offer:', error);
      toast.error(error.message || "Errore durante l'eliminazione");
    } finally {
      setDeleting(false);
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
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{t("browseOffers")}</h1>
          <p className="text-muted-foreground">{t("findPerfectDealsDesc")}</p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchOffers")}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("category")}:</span>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("allCategories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allCategories")}</SelectItem>
                  <SelectItem value="Fitness">{t("fitness")}</SelectItem>
                  <SelectItem value="Technology">{t("technology")}</SelectItem>
                  <SelectItem value="Fashion">{t("fashion")}</SelectItem>
                  <SelectItem value="Lifestyle">{t("lifestyle")}</SelectItem>
                  <SelectItem value="Product Review">Product Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("reward")}:</span>
              <Select value={rewardFilter} onValueChange={setRewardFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("allRewards")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allRewards")}</SelectItem>
                  <SelectItem value="low">&lt; €100</SelectItem>
                  <SelectItem value="medium">€100 - €500</SelectItem>
                  <SelectItem value="high">&gt; €500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {filteredOffers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">{t("noOffersFound")}</p>
            <p className="text-sm text-muted-foreground mt-2">{t("tryDifferentFilters")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => {
              const progressPercentage = (offer.claimed_reward_cents / offer.total_reward_cents) * 100;
              const remainingReward = (offer.total_reward_cents - offer.claimed_reward_cents) / 100;
              const businessName = offer.profiles?.display_name || "Unknown Business";
              
              console.log("DEBUG Rendering offer:", {
                title: offer.title,
                reward_type: offer.reward_type,
                discount_percentage: offer.discount_percentage,
                total_reward_cents: offer.total_reward_cents
              });

              return (
                <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={offer.reward_type === "cash" ? "default" : "secondary"}>
                        {offer.reward_type === "cash" ? "💰 Cash" : offer.reward_type === "discount" ? "🏷️ Discount" : "🎁 Free Gift"}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{offer.platform}</Badge>
                    </div>
                    <CardTitle className="text-xl">{offer.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{offer.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("business")}:</span>
                      <span className="font-medium">{businessName}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {offer.reward_type === "discount" ? (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t("totalReward")}:</span>
                            <span className="font-bold text-lg text-primary">
                              {offer.discount_percentage}% OFF
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span>Partecipanti: 0 / {offer.max_participants || 1}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t("totalReward")}:</span>
                            <span className="font-bold text-lg text-primary">
                              €{(offer.total_reward_cents / 100).toFixed(2)}
                            </span>
                          </div>
                          {offer.reward_type === "cash" && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{t("claimed")}: €{(offer.claimed_reward_cents / 100).toFixed(2)}</span>
                                <span>{t("remaining")}: €{remainingReward.toFixed(2)}</span>
                              </div>
                              <Progress value={progressPercentage} className="h-2" />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t("requiredViews")}</p>
                          <p className="font-semibold">{offer.required_views.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t("category")}</p>
                          <p className="font-semibold">{offer.category}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" variant="hero" asChild>
                      <Link to={`/offers/${offer.id}`}>{t("viewDetails")}</Link>
                    </Button>
                    {isAdmin && (
                      <Button 
                        className="w-full" 
                        variant="destructive"
                        onClick={() => handleDeleteClick(offer)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina Offerta (Admin)
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Offerta</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {pendingAppsWarning && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-amber-800 dark:text-amber-200 font-semibold">
                    ⚠️ Attenzione: {pendingAppsCount} applicazion{pendingAppsCount === 1 ? 'e' : 'i'} in sospeso
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Procedendo, {pendingAppsCount === 1 ? 'verrà' : 'verranno'} automaticamente rifiutat{pendingAppsCount === 1 ? 'a' : 'e'} con notifica ai creator.
                  </p>
                </div>
              )}
              
              <div>
                <p className="mb-2">Stai per eliminare l'offerta: <strong>{selectedOffer?.title}</strong></p>
                {selectedOffer?.reward_type === 'cash' && (
                  <p className="text-sm text-muted-foreground">
                    Fondi da rilasciare: €{((selectedOffer.total_reward_cents - selectedOffer.claimed_reward_cents) / 100).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Messaggio per il business (richiesto):
                </label>
                <Textarea
                  placeholder="Es: L'offerta è stata eliminata per violazione delle policy..."
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting || !adminMessage.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Eliminazione..." : "Conferma Eliminazione"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Offers;
