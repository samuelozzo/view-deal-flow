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

const CreateOffer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
      title: "Offer Created!",
      description: "Your offer has been posted successfully.",
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
          Back to Offers
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Offer</CardTitle>
            <CardDescription>
              Post an offer for creators to apply and promote your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Offer Title</Label>
                <Input
                  id="title"
                  placeholder="E.g., Promote our new product line"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you want creators to promote..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredViews">Required Views</Label>
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
                <Label>Reward Type</Label>
                <Select value={rewardType} onValueChange={(value: "cash" | "discount" | "free") => setRewardType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash per View</SelectItem>
                    <SelectItem value="discount">Discount Code</SelectItem>
                    <SelectItem value="free">Free Gift</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {rewardType === "cash" && (
                <div className="space-y-2">
                  <Label htmlFor="cashAmount">Amount per 1,000 Views (€)</Label>
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
                    Creators will be paid based on verified views after 14 days
                  </p>
                </div>
              )}

              {rewardType === "discount" && (
                <div className="space-y-2">
                  <Label htmlFor="discountDetails">Discount Details</Label>
                  <Textarea
                    id="discountDetails"
                    placeholder="E.g., 20% off all products, code: CREATOR20"
                    value={formData.discountDetails}
                    onChange={(e) => setFormData({ ...formData, discountDetails: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
              )}

              {rewardType === "free" && (
                <div className="space-y-2">
                  <Label htmlFor="freeGiftDetails">Free Gift Details</Label>
                  <Textarea
                    id="freeGiftDetails"
                    placeholder="Describe the free product or gift..."
                    value={formData.freeGiftDetails}
                    onChange={(e) => setFormData({ ...formData, freeGiftDetails: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
              )}

              <div className="pt-4">
                <Button type="submit" className="w-full">
                  Post Offer
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
