import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface EscrowItem {
  id: string;
  amount_cents: number;
  scheduled_release_at: string;
  funded_at: string;
  status: string;
  submissions: {
    id: string;
    applications: {
      offers: {
        title: string;
      };
    };
  };
}

const EscrowList = () => {
  const { user } = useAuth();
  const [escrows, setEscrows] = useState<EscrowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEscrows();
    }
  }, [user]);

  const fetchEscrows = async () => {
    try {
      const { data, error } = await supabase
        .from("escrow_transactions")
        .select(`
          id,
          amount_cents,
          scheduled_release_at,
          funded_at,
          status,
          submissions!inner(
            id,
            applications!inner(
              offers!inner(
                title
              )
            )
          )
        `)
        .eq("creator_id", user!.id)
        .eq("status", "funded")
        .order("scheduled_release_at", { ascending: true });

      if (error) throw error;

      setEscrows(data as any || []);
    } catch (error) {
      console.error("Error fetching escrows:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (scheduledDate: string) => {
    const now = new Date();
    const release = new Date(scheduledDate);
    const diff = release.getTime() - now.getTime();
    
    if (diff <= 0) return "In attesa di rilascio...";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}g ${hours}h`;
    }
    return `${hours}h`;
  };

  if (loading) {
    return null;
  }

  if (escrows.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pagamenti in Escrow
        </CardTitle>
        <CardDescription>
          I tuoi pagamenti verranno rilasciati automaticamente alla scadenza dell'escrow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {escrows.map((escrow) => {
          const submission = escrow.submissions as any;
          const application = submission.applications;
          const offer = application.offers;
          
          return (
            <div
              key={escrow.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <p className="font-medium">{offer.title}</p>
                <p className="text-2xl font-bold text-primary">
                  €{(escrow.amount_cents / 100).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Rilascio: {new Date(escrow.scheduled_release_at).toLocaleDateString("it-IT")}
                </p>
              </div>
              <div className="text-right space-y-2">
                <Badge variant="secondary" className="mb-2">
                  <Clock className="h-3 w-3 mr-1" />
                  {calculateTimeRemaining(escrow.scheduled_release_at)}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Approvato il {new Date(escrow.funded_at).toLocaleDateString("it-IT")}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default EscrowList;