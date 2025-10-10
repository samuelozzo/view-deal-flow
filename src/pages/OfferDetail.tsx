import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Eye, DollarSign, Clock, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  discount_percentage: number | null;
  discount_code: string | null;
  max_participants: number | null;
  profiles?: {
    display_name: string | null;
  };
}

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [hasApplied, setHasApplied] = useState(false);
  const [userAccountType, setUserAccountType] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchOffer();
      checkApplication();
      fetchUserAccountType();
    }
  }, [id, user]);

  const fetchUserAccountType = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single();
      
      setUserAccountType(data?.account_type || null);
    } catch (error) {
      console.error("Error fetching user account type:", error);
    }
  };

  const fetchOffer = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          profiles:business_id (
            display_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setOffer(data);
    } catch (error: any) {
      console.error("Error fetching offer:", error);
      toast({
        title: "Error",
        description: "Failed to load offer details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkApplication = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('applications')
        .select('id')
        .eq('offer_id', id)
        .eq('creator_id', user.id)
        .maybeSingle();

      setHasApplied(!!data);
    } catch (error) {
      console.error("Error checking application:", error);
    }
  };

  const handleApply = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to apply",
        variant: "destructive",
      });
      return;
    }

    setApplying(true);

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          offer_id: id,
          creator_id: user.id,
          message: applicationMessage,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: t("applicationSubmitted"),
        description: t("businessWillReview"),
      });

      setHasApplied(true);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error applying:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setApplying(false);
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

  if (!offer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{t("offerNotFound")}</h1>
          <Button onClick={() => navigate("/offers")}>{t("backToOffers")}</Button>
        </div>
      </div>
    );
  }

  const progressPercentage = (offer.claimed_reward_cents / offer.total_reward_cents) * 100;
  const businessName = offer.profiles?.display_name || "Unknown Business";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/offers")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToOffers")}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <Badge variant={offer.reward_type === "cash" ? "default" : "secondary"}>
                      {offer.reward_type === "cash" ? "💰 Cash" : offer.reward_type === "discount" ? "🏷️ Discount" : "🎁 Free Gift"}
                    </Badge>
                    <CardTitle className="text-3xl">{offer.title}</CardTitle>
                    <CardDescription className="text-base">
                      {t("by")} <span className="font-semibold">{businessName}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="capitalize">{offer.platform}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{t("description")}</h3>
                  <p className="text-muted-foreground">{offer.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("category")}</p>
                      <p className="font-semibold">{offer.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("platform")}</p>
                      <p className="font-semibold capitalize">{offer.platform}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("howItWorks")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t("applyForOffer")}</h4>
                      <p className="text-sm text-muted-foreground">{t("submitApplication")}</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t("getAccepted")}</h4>
                      <p className="text-sm text-muted-foreground">{t("businessReviews")}</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t("createContent")}</h4>
                      <p className="text-sm text-muted-foreground">{t("postYourContent")}</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t("getPaid")}</h4>
                      <p className="text-sm text-muted-foreground">{t("receiveReward")}</p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("rewardDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("totalReward")}</p>
                  <p className="text-3xl font-bold text-primary">
                    {offer.reward_type === "discount" 
                      ? `${offer.discount_percentage}% OFF`
                      : `€${(offer.total_reward_cents / 100).toFixed(2)}`
                    }
                  </p>
                </div>

                {offer.reward_type === "cash" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("claimed")}</span>
                      <span className="font-semibold">
                        €{(offer.claimed_reward_cents / 100).toFixed(2)}
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {progressPercentage.toFixed(1)}% {t("claimed")}
                    </p>
                  </div>
                )}
                
                {offer.reward_type === "discount" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Partecipanti</span>
                      <span className="font-semibold">0 / {offer.max_participants || 1}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Il codice sconto sarà rivelato dopo l'approvazione
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("requirements")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("requiredViews")}</span>
                  <span className="font-semibold">{offer.required_views.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("platform")}</span>
                  <span className="font-semibold capitalize">{offer.platform}</span>
                </div>
              </CardContent>
            </Card>

            {userAccountType === 'business' ? (
              <Card>
                <CardContent className="py-6 text-center">
                  <Badge variant="secondary" className="mb-2">ℹ️ Business Account</Badge>
                  <p className="text-sm text-muted-foreground">
                    Solo gli account creator possono applicare alle offerte. 
                    Gli account business possono creare offerte.
                  </p>
                </CardContent>
              </Card>
            ) : !hasApplied ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t("applyNow")}</CardTitle>
                  <CardDescription>{t("tellWhyPerfect")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="message">{t("message")} ({t("optional")})</Label>
                    <Textarea
                      id="message"
                      placeholder={t("introduceYourself")}
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={handleApply} 
                    className="w-full" 
                    variant="hero"
                    disabled={applying}
                  >
                    {applying ? t("submitting") : t("submitApplication")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-6 text-center">
                  <Badge variant="success" className="mb-2">✓ {t("applied")}</Badge>
                  <p className="text-sm text-muted-foreground">{t("alreadyApplied")}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferDetail;
