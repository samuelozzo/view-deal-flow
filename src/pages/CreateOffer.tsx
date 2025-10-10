import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const offerSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string()
    .trim()
    .min(1, "Description is required")
    .max(2000, "Description must be less than 2000 characters"),
  requiredViews: z.number()
    .positive("Required views must be a positive number")
    .max(1000000000, "Required views cannot exceed 1 billion"),
  platform: z.enum(["TikTok", "Instagram", "YouTube"]),
});

const cashRewardSchema = z.object({
  totalRewardAmount: z.number()
    .positive("Total reward amount must be positive")
    .max(1000000, "Total reward amount cannot exceed €1,000,000"),
});

const discountSchema = z.object({
  discountPercentage: z.number()
    .min(1, "Discount percentage must be at least 1%")
    .max(100, "Discount percentage cannot exceed 100%"),
  discountCode: z.string()
    .trim()
    .min(1, "Discount code is required")
    .max(50, "Discount code must be less than 50 characters"),
});

const CreateOffer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [rewardType, setRewardType] = useState<"cash" | "discount">("cash");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requiredViews: "",
    platform: "TikTok",
    totalRewardAmount: "",
    discountPercentage: "",
    discountCode: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate basic offer fields
      const baseData = {
        title: formData.title,
        description: formData.description,
        requiredViews: Number(formData.requiredViews),
        platform: formData.platform as "TikTok" | "Instagram" | "YouTube",
      };
      
      offerSchema.parse(baseData);
      
      // Calculate total reward in cents and validate
      let totalRewardCents = 0;
      let discountPercentage = null;
      let discountCode = null;
      
      if (rewardType === "cash") {
        cashRewardSchema.parse({
          totalRewardAmount: Number(formData.totalRewardAmount),
        });
        totalRewardCents = Math.round(Number(formData.totalRewardAmount) * 100);
      } else if (rewardType === "discount") {
        discountSchema.parse({
          discountPercentage: Number(formData.discountPercentage),
          discountCode: formData.discountCode,
        });
        discountPercentage = Number(formData.discountPercentage);
        discountCode = formData.discountCode;
      }

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to create an offer",
          variant: "destructive",
        });
        return;
      }

      // Call edge function to create offer with escrow
      const { data, error } = await supabase.functions.invoke('create-offer-with-escrow', {
        body: {
          title: formData.title,
          description: formData.description,
          platform: formData.platform,
          reward_type: rewardType,
          total_reward_cents: totalRewardCents,
          required_views: Number(formData.requiredViews),
          category: "Product Review",
          discount_percentage: discountPercentage,
          discount_code: discountCode,
          max_participants: rewardType === "discount" ? 1 : null,
        },
      });

      if (error) {
        console.error("Error creating offer:", error);
        toast({
          title: "Errore",
          description: error.message || "Impossibile creare l'offerta",
          variant: "destructive",
        });
        return;
      }

      if (!data?.success) {
        toast({
          title: "Errore",
          description: data?.error || "Impossibile creare l'offerta",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: t("offerCreated"),
        description: data.escrow_funded 
          ? "Offerta pubblicata e fondi depositati in escrow" 
          : t("offerPostedSuccess"),
      });
      
      navigate("/offers");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Error:", error);
        toast({
          title: "Error",
          description: "Failed to create offer",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/offers")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToOffers")}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{t("createNewOffer")}</CardTitle>
            <CardDescription>
              {t("postOfferDescription")}
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

              <div className="space-y-2">
                <Label>{t("rewardType")}</Label>
                <Select value={rewardType} onValueChange={(value: "cash" | "discount") => setRewardType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t("cashPerView")}</SelectItem>
                    <SelectItem value="discount">{t("discount")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {rewardType === "cash" && (
                <div className="space-y-2">
                  <Label htmlFor="totalRewardAmount">{t("totalRewardAmount")}</Label>
                  <Input
                    id="totalRewardAmount"
                    type="number"
                    step="0.01"
                    placeholder="E.g., 150.00"
                    value={formData.totalRewardAmount}
                    onChange={(e) => setFormData({ ...formData, totalRewardAmount: e.target.value })}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("totalRewardDesc")}
                  </p>
                </div>
              )}

              {rewardType === "discount" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="discountPercentage">{t("discountPercentage")}</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="E.g., 20"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Percentuale di sconto (1-100%)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discountCode">{t("discountCode")}</Label>
                    <Input
                      id="discountCode"
                      type="text"
                      placeholder="E.g., PROMO2025"
                      value={formData.discountCode}
                      onChange={(e) => setFormData({ ...formData, discountCode: e.target.value })}
                      required
                      maxLength={50}
                    />
                    <p className="text-sm text-muted-foreground">
                      Codice sconto che verrà rivelato al creator accettato
                    </p>
                  </div>
                </>
              )}

              <div className="pt-4">
                <Button type="submit" className="w-full">
                  {t("publishOffer")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateOffer;
