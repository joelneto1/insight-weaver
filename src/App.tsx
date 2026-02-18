import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import CommandMenu from "./components/CommandMenu";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Kanban from "./pages/Kanban";
import Canais from "./pages/Canais";
import Prompts from "./pages/Prompts";
import Contas from "./pages/Contas";
import Formulario from "./pages/Formulario";
import Financeiro from "./pages/Financeiro";
import Configuracoes from "./pages/Configuracoes";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - prevent unnecessary refetches on page navigation
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <CommandMenu />
            <Toaster />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/canais" element={<Canais />} />
                <Route path="/prompts" element={<Prompts />} />
                <Route path="/contas" element={<Contas />} />
                <Route path="/formulario" element={<Formulario />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/config" element={<Configuracoes />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
