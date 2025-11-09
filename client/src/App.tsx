import { useState } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter"; // Added useLocation
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import AdSidebar from "@/components/AdSidebar"; // Import AdSidebar
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import ProductFormDialog from "@/components/ProductFormDialog";
import CompanyFormDialog from "@/components/CompanyFormDialog";
import Register from "@/pages/Register";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProductsAndServices from "@/pages/ProductsAndServices";
import BrowseCompanies from "@/pages/BrowseCompanies";
import Favorites from "@/pages/Favorites";
import About from "@/pages/About";
import Tenders from "@/pages/Tenders";
import Articles from "@/pages/Articles";
import NotFound from "@/pages/not-found";
import SearchPage from "@/pages/SearchPage"; // Import the new SearchPage
import Jobs from "@/pages/Jobs"; // Import the Jobs page
import Admin from "@/pages/Admin"; // Import the Admin page
import Footer from "@/components/Footer"; // Import the Footer component

function AdminRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  if (user?.username !== "admin77") {
    return <Redirect to="/" />;
  }
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/products-services" component={ProductsAndServices} />
      <Route path="/companies" component={BrowseCompanies} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/about" component={About} />
      <Route path="/tenders" component={Tenders} />
      <Route path="/articles" component={Articles} />
      <Route path="/jobs" component={Jobs} /> {/* Add the Jobs route */}
      <Route path="/search" component={SearchPage} /> {/* Add the new search route */}
      <AdminRoute path="/admin77" component={Admin} /> {/* Add route for admin dashboard */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [location] = useLocation(); // Get current location

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <SidebarProvider
                open={isSidebarOpen}
                onOpenChange={setIsSidebarOpen}
                style={sidebarStyle as React.CSSProperties}
              >
                <div className="flex h-screen w-full">
                  <AppSidebar />
                  <div className="flex flex-col flex-1 overflow-y-auto"> {/* Changed to overflow-y-auto */}
                    <Header
                      onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    />
                    <div className="flex flex-1"> {/* Removed overflow-hidden from here */}
                      <main className="flex-1"> {/* Removed overflow-y-auto from here */}
                        <Router />
                      </main>
                      {location !== "/" && ( // Conditionally render AdSidebar
                        <aside className="hidden lg:block w-64 border-l p-4 overflow-y-auto sticky top-0"> {/* Right sidebar */}
                          <AdSidebar />
                        </aside>
                      )}
                    </div>
                    <Footer /> {/* Add the Footer component here */}
                  </div>
                </div>
              </SidebarProvider>
              <Toaster />
              <ProductFormDialog
                open={showProductForm}
                onOpenChange={setShowProductForm}
                onOpenCompanyForm={() => {
                  setShowProductForm(false);
                  setShowCompanyForm(true);
                }}
                mode="add"
              />
              <CompanyFormDialog
                open={showCompanyForm}
                onOpenChange={setShowCompanyForm}
                mode="add"
              />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
