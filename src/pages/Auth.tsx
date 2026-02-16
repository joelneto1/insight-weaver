import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Email inválido", description: "Por favor, insira um email válido.", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      }
    } else {
      if (!displayName.trim()) {
        toast({ title: "Nome obrigatório", description: "Informe um nome de exibição.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName.trim() || email },
        },
      });
      if (error) {
        toast({ title: "Erro ao registrar", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "Conta criada!",
          description: "Bem-vindo ao DarkTube!",
        });
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Informe seu email", description: "Digite seu email no campo acima para receber o link de redefinição.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">

      {/* Decorative Elements (Doodles) - Updated Colors */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Left Side Shapes */}
        <motion.div
          initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="absolute top-1/4 left-10 md:left-20"
        >
          <div className="w-16 h-16 border-2 border-dashed border-primary/20 rounded-full" />
          <div className="w-8 h-8 bg-accent/20 rounded-full absolute -top-4 -right-4" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="absolute bottom-1/4 left-10 md:left-32 hidden md:block"
        >
          <div className="w-24 h-32 bg-secondary rounded-t-full relative pattern-dots opacity-50" />
          <div className="w-12 h-12 border-2 border-primary/30 absolute -right-6 top-10 rounded-lg transform rotate-12" />
        </motion.div>

        {/* Right Side Shapes */}
        <motion.div
          initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="absolute top-20 right-10 md:right-32 hidden md:block"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 blur-xl"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="absolute bottom-20 right-10 md:right-20 hidden lg:block"
        >
          <div className="w-20 h-40 bg-accent/10 rounded-t-full relative opacity-90 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
          </div>
        </motion.div>
      </div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] bg-card rounded-3xl shadow-xl p-8 md:p-10 relative z-10 border border-border"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo className="w-16 h-16 shadow-lg shadow-primary/10 rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isLogin ? "Bem-vindo de Volta" : "Criar Conta"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLogin ? "Ei, insira seus detalhes para entrar na sua conta" : "Preencha os dados abaixo para começar"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1">
              <div className="relative group">
                <Input
                  className="pl-4 pr-10 py-6 rounded-xl border-input bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  placeholder="Nome de Exibição"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="relative group">
              <Input
                type="email"
                className="pl-4 pr-10 py-6 rounded-xl border-input bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                placeholder="Insira Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative group">
              <Input
                type={showPassword ? "text" : "password"}
                className="pl-4 pr-10 py-6 rounded-xl border-input bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10 p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {isLogin && (
              <div className="flex justify-end pt-1">
                <button type="button" onClick={handleForgotPassword} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                  Esqueceu sua senha?
                </button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-accent text-primary-foreground font-semibold py-6 rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Entrar" : "Cadastrar")}
          </Button>
        </form>


        <div className="mt-8 text-center text-sm">
          <span className="text-muted-foreground">
            {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
          </span>{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold text-primary hover:underline transition-all"
          >
            {isLogin ? "Crie agora" : "Entre aqui"}
          </button>
        </div>
      </motion.div>

      {/* Footer Text */}
      <div className="absolute bottom-4 text-center w-full text-xs text-muted-foreground/50 pointer-events-none">
        DarkTube © 2026 | Política de Privacidade
      </div>
    </div>
  );
}
