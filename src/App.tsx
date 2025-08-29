import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import Users from "./pages/Users";
import Deliveries from "./pages/Deliveries";
import PurchaseOrders from "./pages/PurchaseOrders";
import StockHistory from "./pages/StockHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
            <Route path="/suppliers" element={<Layout><Suppliers /></Layout>} />
            <Route path="/purchase-orders" element={<Layout><PurchaseOrders /></Layout>} />
            <Route path="/stock-history" element={<Layout><StockHistory /></Layout>} />
            <Route path="/users" element={<Layout><Users /></Layout>} />
            <Route path="/deliveries" element={<Layout><Deliveries /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
