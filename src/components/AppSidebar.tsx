import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Columns3, Tv, Sparkles, Settings, ChevronLeft, ChevronRight, KeyRound, LogOut, Sun, Moon, FileText, Wallet } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { Logo } from "@/components/Logo";

const NAV_SECTIONS = [
  {
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
      { label: "Kanban", icon: Columns3, path: "/kanban" },
      { label: "Financeiro", icon: Wallet, path: "/financeiro" },
    ],
  },
  {
    title: "CONTEÚDO",
    items: [
      { label: "Canais", icon: Tv, path: "/canais" },
      { label: "Contas", icon: KeyRound, path: "/contas" },
      { label: "Prompts", icon: Sparkles, path: "/prompts" },
    ],
  },
  {
    title: "FERRAMENTAS",
    items: [
      { label: "Formulário", icon: FileText, path: "/formulario" },
    ],
  },
  {
    title: "AJUSTES",
    items: [
      { label: "Configurações", icon: Settings, path: "/config" },
    ],
  },
];

interface SidebarContentProps {
  collapsed?: boolean;
  onCollapse: () => void;
  isMobile?: boolean;
}

export function SidebarContent({ collapsed = false, onCollapse, isMobile = false }: SidebarContentProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const isCollapsed = isMobile ? false : collapsed;
  const showText = isMobile || !collapsed;

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className={cn("flex items-center gap-3 px-4 border-b border-sidebar-border", isMobile ? "h-16" : "h-20")}>
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <Logo className="w-8 h-8 rounded-lg" />
        </div>
        {showText && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-foreground text-lg whitespace-nowrap">
            DarkTube
          </motion.span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx}>
            {section.title && showText && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {section.title}
              </p>
            )}
            {!showText && section.title && (
              <div className="h-px bg-border/30 mx-3 my-2" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                      active
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {showText && <span className="whitespace-nowrap">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        {!isMobile && (
          <>
            <button onClick={onCollapse}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 mb-2"
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5 ml-0.5" /> : <ChevronLeft className="w-5 h-5" />}
              {!isCollapsed && <span>Recolher</span>}
            </button>
            <div className="h-px bg-border/30 my-2" />
          </>
        )}

        <div onClick={toggleTheme}
          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {isDark ? <Moon className="w-5 h-5 shrink-0 text-primary" /> : <Sun className="w-5 h-5 shrink-0 text-yellow-400" />}
            {showText && <span>Modo Escuro</span>}
          </div>
          {showText && <Switch checked={isDark} onClick={(e) => e.stopPropagation()} onCheckedChange={toggleTheme} />}
        </div>

        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
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
