import { useState, useEffect } from "react";
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
    .max(1000000, "Total reward amount cannot exceed $1,000,000"),
});

const discountSchema = z.object({
  discountDetails: z.string()
    .trim()
    .min(1, "Discount details are required")
    .max(500, "Discount details must be less than 500 characters"),
});

const freeGiftSchema = z.object({
  freeGiftDetails: z.string()
    .trim()
    .min(1, "Free gift details are required")
    .max(500, "Free gift details must be less than 500 characters"),
});

const CreateOffer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  useEffect(() => {
    const accountType = localStorage.getItem("userAccountType");
    if (accountType !== "business") {
      toast({
        title: t("accessDenied"),
        description: t("onlyBusinessCanPost"),
        variant: "destructive"
      });
      navigate("/offers");
    }
  }, [navigate, toast, t]);
  
  const [rewardType, setRewardType] = useState<"cash" | "discount" | "free">("cash");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cashAmount: "",
    discountDetails: "",
    freeGiftDetails: "",
    requiredViews: "",
    platform: "TikTok",
    totalRewardAmount: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
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
      
      // Validate reward-specific fields
      if (rewardType === "cash") {
        cashRewardSchema.parse({
          totalRewardAmount: Number(formData.totalRewardAmount),
        });
      } else if (rewardType === "discount") {
        discountSchema.parse({
          discountDetails: formData.discountDetails,
        });
      } else if (rewardType === "free") {
        freeGiftSchema.parse({
          freeGiftDetails: formData.freeGiftDetails,
        });
      }
      
      toast({
        title: t("offerCreated"),
        description: t("offerPostedSuccess"),
      });
      
      navigate("/offers");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
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
                <Select value={rewardType} onValueChange={(value: "cash" | "discount" | "free") => setRewardType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t("cashPerView")}</SelectItem>
                    <SelectItem value="discount">{t("discount")}</SelectItem>
                    <SelectItem value="free">{t("freeGift")}</SelectItem>
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
                <div className="space-y-2">
                  <Label htmlFor="discountDetails">{t("discountDetails")}</Label>
                  <Textarea
                    id="discountDetails"
                    placeholder={t("discountPlaceholder")}
                    value={formData.discountDetails}
                    onChange={(e) => setFormData({ ...formData, discountDetails: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
              )}

              {rewardType === "free" && (
                <div className="space-y-2">
                  <Label htmlFor="freeGiftDetails">{t("freeGiftDetails")}</Label>
                  <Textarea
                    id="freeGiftDetails"
                    placeholder={t("giftPlaceholder")}
                    value={formData.freeGiftDetails}
                    onChange={(e) => setFormData({ ...formData, freeGiftDetails: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
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
