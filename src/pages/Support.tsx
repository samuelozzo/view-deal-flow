import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Mail, MessageCircle, HelpCircle, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Support = () => {
  const { t } = useLanguage();
  const whatsappNumber = "+31612345678"; // Replace with actual WhatsApp business number
  const supportEmail = "support@viewdeal.eu";

  const faqs = [
    {
      question: t("faqQuestion1"),
      answer: t("faqAnswer1")
    },
    {
      question: t("faqQuestion2"),
      answer: t("faqAnswer2")
    },
    {
      question: t("faqQuestion3"),
      answer: t("faqAnswer3")
    },
    {
      question: t("faqQuestion4"),
      answer: t("faqAnswer4")
    },
    {
      question: t("faqQuestion5"),
      answer: t("faqAnswer5")
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("supportTitle")}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("supportDescription")}
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
          <Card className="p-8 hover:shadow-xl transition-all">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-bold">{t("whatsappSupport")}</h3>
              <p className="text-muted-foreground">
                {t("chatWithUs")}
              </p>
              <Button
                variant="success"
                className="w-full"
                asChild
              >
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t("chatOnWhatsApp")}
                </a>
              </Button>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-all">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">{t("emailSupport")}</h3>
              <p className="text-muted-foreground">
                {t("sendEmail")}
              </p>
              <Button
                variant="hero"
                className="w-full"
                asChild
              >
                <a href={`mailto:${supportEmail}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  {t("emailUs")}
                </a>
              </Button>
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold">{t("frequentlyAsked")}</h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground text-sm">{faq.answer}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-16 text-center">
          <Card className="p-8 max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-accent/5">
            <h3 className="text-xl font-bold mb-2">{t("stillNeedHelp")}</h3>
            <p className="text-muted-foreground mb-6">
              {t("supportAvailability")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("chatOnWhatsApp")}
                </a>
              </Button>
              <Button variant="hero" asChild>
                <a href={`mailto:${supportEmail}`}>{t("sendEmailButton")}</a>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Support;
