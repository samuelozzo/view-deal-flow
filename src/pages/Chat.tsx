import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Mock data
const mockChats = [
  {
    id: 1,
    offerId: 1,
    offerTitle: "Fitness Brand Product Review",
    business: "FitLife Pro",
    messages: [
      {
        id: 1,
        sender: "business",
        text: "Hi! Thanks for applying. We'd love to work with you!",
        timestamp: "10:30 AM",
      },
      {
        id: 2,
        sender: "creator",
        text: "Thank you! I'm excited about this collaboration.",
        timestamp: "10:35 AM",
      },
      {
        id: 3,
        sender: "business",
        text: "When can you create the content?",
        timestamp: "10:40 AM",
      },
    ],
  },
  {
    id: 3,
    offerId: 3,
    offerTitle: "Fashion Collection Showcase",
    business: "StyleHub",
    messages: [
      {
        id: 1,
        sender: "business",
        text: "Hello! We're reviewing your submission now.",
        timestamp: "Yesterday",
      },
    ],
  },
];

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
  const [message, setMessage] = useState("");
  
  const chat = mockChats.find((c) => c.id === Number(id));

  if (!chat) {
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

  const handleSend = () => {
    try {
      messageSchema.parse({ message });
      // In real app, would send message here
      setMessage("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid Message",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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
                <h1 className="text-xl font-bold">{chat.offerTitle}</h1>
                <p className="text-sm text-muted-foreground">{chat.business}</p>
              </div>
              <Badge variant="success">{t("active")}</Badge>
            </div>
          </Card>
        </div>

        {/* Chat Messages */}
        <Card className="mb-4">
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {chat.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "creator" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    msg.sender === "creator"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                >
                  <p className="text-sm mb-1">{msg.text}</p>
                  <p className={`text-xs ${
                    msg.sender === "creator" 
                      ? "text-primary-foreground/70" 
                      : "text-muted-foreground"
                  }`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Message Input */}
        <Card className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder={t("typeMessage")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
            />
            <Button onClick={handleSend} variant="hero">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
