import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/auth.context";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyUnits from "./pages/MyUnits";
import InventoryDetails from "./pages/InventoryDetails";
import NotFound from "./pages/NotFound";
import RequestsPage from "./pages/Requests";
import CentralStockPage from "./pages/CentralStock";
import AdminPage from "./pages/AdminPage";
import SuppliersPage from "./pages/SuppliersPage";
import StockEntryPage from "./pages/StockEntryPage";
import StockHistoryPage from "./pages/StockHistoryPage";
import SelectCompanyPage from "./pages/SelectCompanyPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />

            {/* Rotas Protegidas (Requer Login) */}
            <Route element={<ProtectedRoute />}>
              
              {/* Rota de Seleção de Empresa (Obrigatória para Diretor Multi-empresa) */}
              <Route path="/select-company" element={<SelectCompanyPage />} />

              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-units" element={<MyUnits />} />
              <Route path="/inventory/:id" element={<InventoryDetails />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/central-stock" element={<CentralStockPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/stock-entry" element={<StockEntryPage />} />
              <Route path="/stock-history" element={<StockHistoryPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;