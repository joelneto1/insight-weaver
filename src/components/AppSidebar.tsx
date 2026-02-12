import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Columns3, Tv, Sparkles, Settings, ChevronLeft, ChevronRight, KeyRound, LogOut, MessageSquare, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Kanban", icon: Columns3, path: "/kanban" },
  { label: "Canais", icon: Tv, path: "/canais" },
  { label: "Contas", icon: KeyRound, path: "/contas" },
  { label: "Prompts", icon: Sparkles, path: "/prompts" },
  { label: "Configurações", icon: Settings, path: "/config" },
];

interface SidebarContentProps {
  collapsed?: boolean;
  onCollapse?: () => void;
  isMobile?: boolean; // Novo prop para controlar comportamento mobile
}

export function SidebarContent({ collapsed = false, onCollapse, isMobile = false }: SidebarContentProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const [isDark, setIsDark] = useState(() => {
    // Check initial theme from localStorage or system preference
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        return savedTheme === "dark";
      }
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  // Em mobile, nunca colapsa
  const isCollapsed = isMobile ? false : collapsed;
  const showText = isMobile || !collapsed;

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className={cn("flex items-center gap-3 px-4 border-b border-sidebar-border", isMobile ? "h-16" : "h-20")}>
        <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center shrink-0">
          <Tv className="w-4 h-4 text-primary-foreground" />
        </div>
        {showText && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-foreground text-lg whitespace-nowrap"
          >
            DarkTube
          </motion.span>
        )}
      </div>

      <nav className="flex-1 py-6 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              {showText && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        {!isMobile && (
          <>
            <button
              onClick={onCollapse}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 mb-2"
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5 ml-0.5" /> : <ChevronLeft className="w-5 h-5" />}
              {!isCollapsed && <span>Recolher</span>}
            </button>
            <div className="h-px bg-border/50 my-2" />
          </>
        )}

        <div
          onClick={toggleTheme}
          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {isDark ? (
              <Moon className="w-5 h-5 shrink-0 text-sidebar-foreground" />
            ) : (
              <Sun className="w-5 h-5 shrink-0 text-yellow-400" />
            )}
            {showText && <span>Modo Escuro</span>}
          </div>
          {showText && <Switch checked={isDark} onCheckedChange={toggleTheme} />}
        </div>

        <Link
          to="/suporte"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
        >
          <MessageSquare className="w-5 h-5 shrink-0 text-muted-foreground" />
          {showText && <span>Suporte</span>}
        </Link>

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
          {showText && <span>Sair da conta</span>}
        </button>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen sticky top-0 flex flex-col border-r border-sidebar-border bg-sidebar z-30 hidden md:flex"
    >
      <SidebarContent collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />
    </motion.aside>
  );
}
