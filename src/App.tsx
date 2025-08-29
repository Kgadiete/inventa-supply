import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Test from "./pages/Test";
import Dashboard from "./pages/Dashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SmartDashboard from "./components/SmartDashboard";
import Auth from "./pages/Auth";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import Users from "./pages/Users";
import Deliveries from "./pages/Deliveries";
import PurchaseOrders from "./pages/PurchaseOrders";
import StockHistory from "./pages/StockHistory";
import CompanyManagement from "./pages/CompanyManagement";
import NotFound from "./pages/NotFound";
import { useState, useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Error boundary component
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setError(event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || 'An unexpected error occurred'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('App: Initializing...');
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Initializing Application...</h2>
          <p className="text-muted-foreground">Please wait while we set up the app</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/test" element={<Test />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Layout><SmartDashboard /></Layout>} />
                <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
                <Route path="/suppliers" element={<Layout><Suppliers /></Layout>} />
                <Route path="/purchase-orders" element={<Layout><PurchaseOrders /></Layout>} />
                <Route path="/stock-history" element={<Layout><StockHistory /></Layout>} />
                <Route path="/users" element={<Layout><Users /></Layout>} />
                <Route path="/deliveries" element={<Layout><Deliveries /></Layout>} />
                <Route path="/company-management" element={<Layout><CompanyManagement /></Layout>} />
                <Route path="/super-admin-dashboard" element={<Layout><SuperAdminDashboard /></Layout>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
