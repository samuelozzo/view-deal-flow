import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Smartphone, Tablet, Monitor, Maximize2 } from "lucide-react";

const ResponsiveCheck = () => {
  const [selectedWidth, setSelectedWidth] = useState<string>("100%");

  const viewports = [
    { name: "iPhone SE", width: "375px", icon: Smartphone },
    { name: "iPhone 14", width: "390px", icon: Smartphone },
    { name: "Android Small", width: "360px", icon: Smartphone },
    { name: "iPhone 14 Pro Max", width: "428px", icon: Smartphone },
    { name: "iPad", width: "768px", icon: Tablet },
    { name: "iPad Pro", width: "1024px", icon: Tablet },
    { name: "Desktop SM", width: "1280px", icon: Monitor },
    { name: "Desktop MD", width: "1440px", icon: Monitor },
    { name: "Desktop LG", width: "1920px", icon: Monitor },
    { name: "Full Width", width: "100%", icon: Maximize2 },
  ];

  const sampleData = [
    { id: 1, title: "Sample Offer 1", reward: "€150.00", views: "10,000", platform: "TikTok" },
    { id: 2, title: "Sample Offer 2", reward: "€250.00", views: "25,000", platform: "Instagram" },
    { id: 3, title: "Sample Offer 3", reward: "€100.00", views: "5,000", platform: "YouTube" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-fluid-2xl font-bold mb-2">Responsive Components Check</h1>
          <p className="text-muted-foreground">
            Test dei componenti principali a diverse risoluzioni. Seleziona una viewport per vedere l'anteprima.
          </p>
        </div>

        {/* Viewport Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Seleziona Viewport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {viewports.map((viewport) => (
                <Button
                  key={viewport.name}
                  variant={selectedWidth === viewport.width ? "default" : "outline"}
                  onClick={() => setSelectedWidth(viewport.width)}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <viewport.icon className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">{viewport.name}</div>
                    <div className="text-xs opacity-70">{viewport.width}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview Container */}
        <div className="border-2 border-dashed border-border rounded-lg p-4 bg-secondary/20">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline">Preview: {selectedWidth}</Badge>
            <Badge variant="secondary">Scroll horizontalmente se necessario</Badge>
          </div>
          
          <div className="overflow-x-auto">
            <div 
              style={{ width: selectedWidth, minWidth: '320px' }} 
              className="mx-auto bg-background border border-border rounded-lg shadow-lg"
            >
              <div className="p-4 md:p-6 space-y-6">
                {/* Typography Test */}
                <section>
                  <h2 className="text-fluid-xl font-bold mb-4">Tipografia Fluida</h2>
                  <div className="space-y-2">
                    <h1 className="text-fluid-2xl font-bold">Heading 2XL (Fluid)</h1>
                    <h2 className="text-fluid-xl font-bold">Heading XL (Fluid)</h2>
                    <h3 className="text-fluid-lg font-semibold">Heading LG (Fluid)</h3>
                    <p className="text-fluid-base">Body text with fluid sizing for optimal readability.</p>
                    <p className="text-fluid-sm text-muted-foreground">Small text with fluid sizing.</p>
                  </div>
                </section>

                {/* Grid Layout Test */}
                <section>
                  <h2 className="text-fluid-lg font-bold mb-4">Responsive Grid</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardHeader>
                          <CardTitle className="text-base">Card {i}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Responsive card content that adapts to viewport.
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>

                {/* Buttons Test */}
                <section>
                  <h2 className="text-fluid-lg font-bold mb-4">Touch Targets (min 44px)</h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button className="touch-target">Primary Button</Button>
                    <Button variant="outline" className="touch-target">Outline Button</Button>
                    <Button variant="secondary" className="touch-target">Secondary</Button>
                  </div>
                </section>

                {/* Form Elements Test */}
                <section>
                  <h2 className="text-fluid-lg font-bold mb-4">Form Elements</h2>
                  <div className="space-y-4">
                    <Input placeholder="Mobile-friendly input" className="w-full" />
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Option 1</SelectItem>
                        <SelectItem value="2">Option 2</SelectItem>
                        <SelectItem value="3">Option 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button type="submit" className="w-full sm:w-auto">Submit</Button>
                      <Button type="button" variant="outline" className="w-full sm:w-auto">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </section>

                {/* Table Responsive Test */}
                <section>
                  <h2 className="text-fluid-lg font-bold mb-4">Responsive Table/Cards</h2>
                  
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Reward</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Platform</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sampleData.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.title}</TableCell>
                            <TableCell>{item.reward}</TableCell>
                            <TableCell>{item.views}</TableCell>
                            <TableCell>{item.platform}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {sampleData.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4 space-y-2">
                          <div className="font-semibold">{item.title}</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Reward:</span>
                              <span className="ml-2 font-medium">{item.reward}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Views:</span>
                              <span className="ml-2 font-medium">{item.views}</span>
                            </div>
                          </div>
                          <Badge variant="outline">{item.platform}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>

                {/* Modal Test */}
                <section>
                  <h2 className="text-fluid-lg font-bold mb-4">Modal Responsivo</h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Apri Modal</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Responsive Dialog</DialogTitle>
                        <DialogDescription>
                          Questo dialog si adatta al viewport: full-screen su mobile, centrato su desktop.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p>Contenuto del modal che si adatta alla dimensione dello schermo.</p>
                        <Input placeholder="Example input" />
                        <Button className="w-full sm:w-auto">Conferma</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </section>

                {/* Spacing Test */}
                <section>
                  <h2 className="text-fluid-lg font-bold mb-4">Spaziatura Scalabile</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p>Padding: p-4 (16px)</p>
                    </div>
                    <div className="p-6 bg-primary/10 rounded-lg">
                      <p>Padding: p-6 (24px)</p>
                    </div>
                    <div className="p-8 bg-primary/10 rounded-lg">
                      <p>Padding: p-8 (32px)</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">✅ Best Practices</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Touch targets ≥ 44×44px</li>
                  <li>• Tipografia fluida con clamp()</li>
                  <li>• Grid responsive: mobile-first</li>
                  <li>• Tabelle → Cards su mobile</li>
                  <li>• Modali full-screen su mobile</li>
                  <li>• Safe area padding (iOS)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🎯 Breakpoints</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Mobile: &lt; 640px</li>
                  <li>• SM: ≥ 640px</li>
                  <li>• MD: ≥ 768px (Tablet)</li>
                  <li>• LG: ≥ 1024px (Desktop)</li>
                  <li>• XL: ≥ 1280px</li>
                  <li>• 2XL: ≥ 1536px</li>
                </ul>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">🔍 Test Checklist</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <Badge variant="outline" className="justify-start">iPhone SE (375px)</Badge>
                <Badge variant="outline" className="justify-start">iPhone 14 (390px)</Badge>
                <Badge variant="outline" className="justify-start">Android (360px)</Badge>
                <Badge variant="outline" className="justify-start">iPad (768px)</Badge>
                <Badge variant="outline" className="justify-start">Desktop (1280px)</Badge>
                <Badge variant="outline" className="justify-start">Large (1920px)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResponsiveCheck;
