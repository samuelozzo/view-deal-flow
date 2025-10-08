import { useState, useEffect } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StripePaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const StripePaymentForm = ({ onSuccess, onCancel }: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Setup realtime subscription to wallet updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('[REALTIME] Setting up wallet subscription for user:', user.id);
    
    const channel = supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[REALTIME] Wallet updated:', payload);
          toast({
            title: "Saldo Aggiornato",
            description: `Il tuo saldo è stato aggiornato: €${(payload.new.available_cents / 100).toFixed(2)}`,
          });
        }
      )
      .subscribe();

    return () => {
      console.log('[REALTIME] Cleaning up wallet subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        console.error("Payment error:", error);
        toast({
          title: "Pagamento Fallito",
          description: error.message || "Si è verificato un errore durante il pagamento",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log("Payment succeeded:", paymentIntent.id);
        toast({
          title: "Pagamento Riuscito",
          description: "La ricarica è stata completata con successo. Il saldo verrà aggiornato immediatamente.",
        });
        onSuccess();
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore imprevisto",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Annulla
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing}>
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isProcessing ? "Elaborazione..." : "Conferma Pagamento"}
        </Button>
      </div>
    </form>
  );
};
