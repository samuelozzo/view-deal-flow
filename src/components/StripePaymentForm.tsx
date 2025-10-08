import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface StripePaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const StripePaymentForm = ({ onSuccess, onCancel }: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/wallet?payment=success`,
        },
      });

      if (error) {
        toast({
          title: "Errore",
          description: error.message || "Si è verificato un errore durante il pagamento",
          variant: "destructive",
        });
      } else {
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
