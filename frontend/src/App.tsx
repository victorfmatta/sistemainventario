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

// --- INÍCIO DAS ALTERAÇÕES ---
// 1. Importar a nova página de Administração
import AdminPage from "./pages/AdminPage";
import SuppliersPage from "./pages/SuppliersPage";
import StockEntryPage from "./pages/StockEntryPage";
import StockHistoryPage from "./pages/StockHistoryPage";
// --- FIM DAS ALTERAÇÕES ---

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

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-units" element={<MyUnits />} />
              <Route path="/inventory/:id" element={<InventoryDetails />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/central-stock" element={<CentralStockPage />} />

              {/* --- INÍCIO DAS ALTERAÇÕES --- */}
              {/* 2. Adicionar a nova rota para a página de Administração */}
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/stock-entry" element={<StockEntryPage />} />
              <Route path="/stock-history" element={<StockHistoryPage />} />
              {/* --- FIM DAS ALTERAÇÕES --- */}
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
