import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { Euro, Eye, Clock, TrendingUp, MessageSquare, Upload } from "lucide-react";

// Mock user role - in real app this would come from auth
const USER_ROLE = "creator"; // or "business"

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("applications");

  // Mock data for creator
  const applications = [
    {
      id: 1,
      offer: "Fitness Brand Product Review",
      business: "FitLife Pro",
      status: "accepted",
      reward: "€150",
      requiredViews: "100,000",
      deadline: "14 days",
      hasChat: true,
    },
    {
      id: 2,
      offer: "Tech Gadget Unboxing",
      business: "TechGear EU",
      status: "pending",
      reward: "€200",
      requiredViews: "150,000",
      deadline: "14 days",
      hasChat: false,
    },
    {
      id: 3,
      offer: "Fashion Collection Showcase",
      business: "StyleHub",
      status: "submitted",
      reward: "€100",
      requiredViews: "80,000",
      deadline: "Awaiting verification",
      hasChat: true,
    },
  ];

  const submissions = [
    {
      id: 1,
      offer: "Fashion Collection Showcase",
      submittedDate: "2 days ago",
      views: "85,243",
      status: "pending_verification",
      proofUrl: "https://instagram.com/p/...",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      accepted: { variant: "success", label: "Accepted" },
      pending: { variant: "warning", label: "Pending Review" },
      submitted: { variant: "accent", label: "Proof Submitted" },
      pending_verification: { variant: "warning", label: "Verifying" },
      completed: { variant: "success", label: "Completed" },
    };
    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Creator Dashboard</h1>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Deals</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">€450</p>
                </div>
                <Euro className="h-8 w-8 text-success" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payment</p>
                  <p className="text-2xl font-bold">€100</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">235K</p>
                </div>
                <Eye className="h-8 w-8 text-accent" />
              </div>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4 mt-6">
            {applications.map((app) => (
              <Card key={app.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{app.offer}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{app.business}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{app.reward}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>{app.requiredViews} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{app.deadline}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:items-end">
                    {app.status === "accepted" && (
                      <>
                        {app.hasChat && (
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Open Chat
                          </Button>
                        )}
                        <Button variant="hero" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Proof
                        </Button>
                      </>
                    )}
                    {app.status === "pending" && (
                      <Button variant="ghost" size="sm" disabled>
                        Awaiting Review
                      </Button>
                    )}
                    {app.status === "submitted" && (
                      <Button variant="outline" size="sm">
                        View Submission
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-4 mt-6">
            {submissions.map((submission) => (
              <Card key={submission.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{submission.offer}</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted {submission.submittedDate}
                      </p>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">View Count</p>
                      <p className="text-lg font-bold">{submission.views}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Proof URL</p>
                      <a
                        href={submission.proofUrl}
                        className="text-sm text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Content
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <Clock className="h-5 w-5 text-warning" />
                    <p className="text-sm">
                      Awaiting verification. Payment will be released once approved.
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
