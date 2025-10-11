import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import Home from "@/pages/Home";
import BrowseProducts from "@/pages/BrowseProducts";
import BrowseCompanies from "@/pages/BrowseCompanies";
import Favorites from "@/pages/Favorites";
import About from "@/pages/About";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={BrowseProducts} />
      <Route path="/companies" component={BrowseCompanies} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <LanguageProvider>
            <SidebarProvider
              open={isSidebarOpen}
              onOpenChange={setIsSidebarOpen}
              style={sidebarStyle as React.CSSProperties}
            >
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <Header
                    onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    isAuthenticated={true}
                  />
                  <main className="flex-1 overflow-y-auto">
                    <Router />
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
