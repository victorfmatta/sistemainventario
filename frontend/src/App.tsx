import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/auth.context";

// --- INÍCIO DAS ALTERAÇÕES ---
// 1. Importar nosso novo componente de proteção
import ProtectedRoute from "./components/ProtectedRoute";
// --- FIM DAS ALTERAÇÕES ---

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import InventoryDetails from "./pages/InventoryDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rota pública de Login */}
            <Route path="/" element={<Login />} />

            {/* --- INÍCIO DAS ALTERAÇÕES --- */}
            {/* 2. Agrupar as rotas protegidas */}
            <Route element={<ProtectedRoute />}>
              {/* Todas as rotas aqui dentro exigirão login */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory/:id" element={<InventoryDetails />} />
            </Route>
            {/* --- FIM DAS ALTERAÇÕES --- */}

            {/* Rota para páginas não encontradas */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
