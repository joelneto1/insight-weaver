import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";

// Floating particles for animated background
function Particles() {
  const [particles] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.05,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: p.opacity }}
          animate={{
            y: [0, -40, 0, 30, 0],
            x: [0, 20, -15, 10, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// Animated mesh gradient
function MeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
        style={{
          background: "radial-gradient(ellipse at 20% 50%, hsla(200, 80%, 50%, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, hsla(260, 80%, 50%, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, hsla(180, 80%, 50%, 0.05) 0%, transparent 50%)",
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        toast({ title: "Conta criada!", description: "Bem-vindo ao DarkTube!" });
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      {/* Animated Background */}
      <MeshGradient />
      <Particles />

      {/* Decorative glowing orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-8 md:p-10 relative z-10 border border-border/60"
      >
        <div className="text-center mb-8">
          <motion.div className="flex justify-center mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Logo className="w-16 h-16 shadow-lg shadow-primary/20 rounded-xl" />
          </motion.div>
          <motion.h1 className="text-2xl font-bold text-foreground mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isLogin ? "Bem-vindo de Volta" : "Criar Conta"}
          </motion.h1>
          <motion.p className="text-muted-foreground text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {isLogin ? "Ei, insira seus detalhes para entrar na sua conta" : "Preencha os dados abaixo para começar"}
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <motion.div className="space-y-1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <div className="relative group">
                <Input
                  className="pl-4 pr-10 py-6 rounded-xl border-input bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  placeholder="Nome de Exibição"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
            </motion.div>
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
