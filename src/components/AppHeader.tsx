import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogOut, Settings, User, Search, ChevronDown, Menu, Command } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarContent } from "./AppSidebar";
import { useState } from "react";

export default function AppHeader() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const initials = (profile?.display_name || user.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const firstName = (profile?.display_name || user.email || "").split(" ")[0];

  const openCommandMenu = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  };

  return (
    <header className="h-16 md:h-20 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 gap-2 md:gap-4 transition-all duration-200">

      {/* Mobile Menu Trigger */}
      <div className="md:hidden mr-2">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-2">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-sidebar-border">
            <SidebarContent isMobile onCollapse={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Left Section: Title & Greeting (Desktop Only) */}
      <div className="hidden md:flex flex-col">
        <h1 className="text-xl font-bold text-foreground leading-none">DarkTube Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
          Bem-vindo de volta, {firstName} <span className="text-base">👋</span>
        </p>
      </div>

      {/* Mobile Title (When Greeting is Hidden) */}
      <div className="md:hidden font-bold text-lg truncate flex-1">
        DarkTube
      </div>

      {/* Right Section Container */}
      <div className="flex items-center justify-end flex-initial md:flex-1 gap-2 sm:gap-4 md:gap-6">

        {/* Search Bar - Opens Command Menu */}
        <button
          onClick={openCommandMenu}
          className="hidden sm:flex items-center gap-2 w-full max-w-[150px] md:max-w-xs bg-secondary/50 border border-border/30 hover:border-primary/30 rounded-full h-9 px-4 text-sm text-muted-foreground transition-all duration-200 group"
        >
          <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="flex-1 text-left truncate">Pesquisar...</span>
          <kbd className="hidden md:flex items-center gap-0.5 text-[10px] font-mono font-semibold text-muted-foreground/70 bg-secondary/80 px-1.5 py-0.5 rounded border border-border/50">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Mobile Search Icon */}
        <Button variant="ghost" size="icon" className="sm:hidden text-muted-foreground" onClick={openCommandMenu}>
          <Search className="w-5 h-5" />
        </Button>

        {/* Profile Dropdown */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 outline-none hover:opacity-80 transition-opacity pl-1">
              <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-primary/30 shadow-sm shadow-primary/10">
                <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-blue-500 text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 bg-card border-border/50 backdrop-blur-md">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-0.5 leading-none">
                  <p className="font-medium text-sm text-foreground">{profile?.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate w-[180px]">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/config")} className="cursor-pointer">
                <User className="w-4 h-4 mr-2" /> Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/config")} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer group">
                <LogOut className="w-4 h-4 mr-2 group-hover:text-destructive" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
