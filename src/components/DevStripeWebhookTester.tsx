import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

export const DevStripeWebhookTester = () => {
  const [payload, setPayload] = useState(JSON.stringify({
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: "pi_test_123",
        amount: 5000,
        metadata: {
          type: "wallet_topup",
          user_id: "replace-with-user-id",
          wallet_id: "replace-with-wallet-id"
        }
      }
    }
  }, null, 2));
  const [loading, setLoading] = useState(false);

  const handleResendEvent = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send webhook');
      }

      toast({
        title: "Webhook Inviato",
        description: "L'evento Stripe è stato re-inviato con successo",
      });
    } catch (error: any) {
      console.error("Error sending webhook:", error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare l'evento webhook",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-yellow-500">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          🔧 Dev: Stripe Webhook Tester
        </CardTitle>
        <CardDescription>
          Re-invia l'ultimo evento Stripe per testare il webhook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          className="font-mono text-xs min-h-[200px]"
          placeholder="Payload JSON dell'evento Stripe"
        />
        <Button onClick={handleResendEvent} disabled={loading} size="sm">
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Re-send Event
        </Button>
      </CardContent>
    </Card>
  );
};
