import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Briefcase, Video, ArrowRight } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"creator" | "business" | null>(null);

  const handleRoleSelection = (role: "creator" | "business") => {
    setSelectedRole(role);
    // In a real app, this would save the role and redirect to appropriate dashboard
    setTimeout(() => {
      navigate("/dashboard");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to ViewDeal
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose your path to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Creator Card */}
          <Card
            className={`p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl ${
              selectedRole === "creator" ? "ring-2 ring-primary shadow-xl scale-105" : ""
            }`}
            onClick={() => handleRoleSelection("creator")}
          >
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <Video className="h-10 w-10 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">I'm a Creator</h2>
                <p className="text-muted-foreground">
                  Apply to brand offers, create content, and get paid for views
                </p>
              </div>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Browse and apply to paid offers</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Chat directly with brands</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Submit proof and get paid via escrow</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Works with TikTok, Instagram & YouTube</span>
                </li>
              </ul>
              <Button
                variant="hero"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelection("creator");
                }}
              >
                Continue as Creator
              </Button>
            </div>
          </Card>

          {/* Business Card */}
          <Card
            className={`p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl ${
              selectedRole === "business" ? "ring-2 ring-primary shadow-xl scale-105" : ""
            }`}
            onClick={() => handleRoleSelection("business")}
          >
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                <Briefcase className="h-10 w-10 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">I'm a Business</h2>
                <p className="text-muted-foreground">
                  Post offers, connect with creators, and grow your brand reach
                </p>
              </div>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Create custom offers with your budget</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Review and approve applications</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Secure escrow payment system</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Verify results before payment release</span>
                </li>
              </ul>
              <Button
                variant="default"
                className="w-full bg-accent hover:bg-accent/90"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelection("business");
                }}
              >
                Continue as Business
              </Button>
            </div>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto">
              Sign in here
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
