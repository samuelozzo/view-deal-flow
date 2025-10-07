import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
}

interface Application {
  id: string;
  offers: {
    title: string;
    profiles?: {
      display_name: string | null;
    };
  };
}

const messageSchema = z.object({
  message: z.string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(1000, "Message must be less than 1000 characters"),
});

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && user) {
      fetchApplication();
      fetchMessages();
      subscribeToMessages();
    }
  }, [id, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          offers (
            title,
            profiles:business_id (
              display_name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setApplication(data as any);
    } catch (error: any) {
      console.error("Error fetching application:", error);
      toast({
        title: "Error",
        description: "Failed to load chat",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `application_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async () => {
    if (!user) return;

    try {
      messageSchema.parse({ message });

      setSending(true);

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          application_id: id,
          sender_id: user.id,
          message: message.trim(),
        });

      if (error) throw error;

      setMessage("");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid Message",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Error sending message:", error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      }
    } finally {
      setSending(false);
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

  if (!application) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{t("chatNotFound")}</h1>
          <Button onClick={() => navigate("/dashboard")}>{t("backToDashboard")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backToDashboard")}
            </Link>
          </Button>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">{application.offers.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {application.offers.profiles?.display_name || "Unknown Business"}
                </p>
              </div>
              <Badge variant="success">{t("active")}</Badge>
            </div>
          </Card>
        </div>

        <Card className="mb-4">
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>{t("noMessagesYet")}</p>
                <p className="text-sm">{t("startConversation")}</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      msg.sender_id === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    <p className="text-sm mb-1">{msg.message}</p>
                    <p className={`text-xs ${
                      msg.sender_id === user?.id
                        ? "text-primary-foreground/70" 
                        : "text-muted-foreground"
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder={t("typeMessage")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !sending && handleSend()}
              disabled={sending}
            />
            <Button onClick={handleSend} variant="hero" disabled={sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
