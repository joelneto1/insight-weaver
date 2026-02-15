import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Kanban from "./pages/Kanban";
import Canais from "./pages/Canais";
import Prompts from "./pages/Prompts";
import Configuracoes from "./pages/Configuracoes";
import Contas from "./pages/Contas";
import Auth from "./pages/Auth";
import Formulario from "./pages/Formulario";
import FinanceiroPage from "./pages/Financeiro";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Apply saved theme before first paint to avoid flash
if (typeof window !== "undefined") {
  const saved = localStorage.getItem("theme");
  document.documentElement.classList.toggle("dark", saved !== "light");
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/canais" element={<Canais />} />
                <Route path="/contas" element={<Contas />} />
                <Route path="/prompts" element={<Prompts />} />
                <Route path="/formulario" element={<Formulario />} />
                <Route path="/financeiro" element={<FinanceiroPage />} />
                <Route path="/config" element={<Configuracoes />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
