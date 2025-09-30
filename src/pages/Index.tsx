import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { TrendingUp, Shield, Zap, Euro, Eye, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const features = [
    {
      icon: Euro,
      title: "Fair Pricing",
      description: "Set your own rates like €1 per 1,000 views. Transparent and flexible.",
    },
    {
      icon: Shield,
      title: "Secure Escrow",
      description: "Funds held safely until verified proof of views is delivered.",
    },
    {
      icon: Eye,
      title: "View Verification",
      description: "14-day verification period ensures authentic engagement.",
    },
    {
      icon: Zap,
      title: "Quick Matching",
      description: "Find the perfect creators or brands in minutes, not days.",
    },
  ];

  const steps = [
    { number: "1", title: "Create Your Profile", desc: "Sign up as a creator or business" },
    { number: "2", title: "Browse or Post Offers", desc: "Find deals or create campaigns" },
    { number: "3", title: "Secure Payment", desc: "Funds held in escrow for safety" },
    { number: "4", title: "Deliver Content", desc: "Creators post and submit proof" },
    { number: "5", title: "Get Paid", desc: "Payment released after verification" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Connect Creators with Brands
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {" "}Through Views
                </span>
              </h1>
              <p className="text-lg text-muted-foreground">
                The EU marketplace where brands post offers, creators deliver content, 
                and payments flow securely through escrow after verified view counts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/onboarding">Start Creating Deals</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/offers">Browse Offers</Link>
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Secure Escrow</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>14-Day Verification</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <img
                src={heroImage}
                alt="Creator and brand collaboration"
                className="relative rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose ViewDeal?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for the creator economy with trust and transparency at its core
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300 bg-card">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Five simple steps from offer to payment
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-primary-glow to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of creators and brands building authentic partnerships through ViewDeal
          </p>
          <Button variant="secondary" size="lg" asChild>
            <Link to="/onboarding">Create Your Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/50 py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg" />
                <span className="text-xl font-bold">ViewDeal</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The trusted marketplace for creator-brand collaborations across the EU.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Creators</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/offers" className="hover:text-primary">Browse Offers</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Brands</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/onboarding" className="hover:text-primary">Post an Offer</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary">Manage Campaigns</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/support" className="hover:text-primary">Help Center</Link></li>
                <li><Link to="/support" className="hover:text-primary">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2025 ViewDeal. EU-based marketplace for creators and brands.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
