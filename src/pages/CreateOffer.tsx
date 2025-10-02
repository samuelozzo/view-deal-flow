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
    platform: "TikTok"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: t("offerCreated"),
      description: t("offerPostedSuccess"),
    });
    
    navigate("/offers");
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
                  <Label htmlFor="cashAmount">{t("cashAmount")}</Label>
                  <Input
                    id="cashAmount"
                    type="number"
                    step="0.01"
                    placeholder="E.g., 1.50"
                    value={formData.cashAmount}
                    onChange={(e) => setFormData({ ...formData, cashAmount: e.target.value })}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("cashAmountDesc")}
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
