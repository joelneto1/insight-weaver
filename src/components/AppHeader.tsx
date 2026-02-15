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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogOut, Settings, User, Search, Bell, MessageSquare, ChevronDown, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
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

        {/* Search Bar - Responsive */}
        <div className="relative hidden sm:block w-full max-w-[150px] md:max-w-xs transition-all duration-300">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar..."
            className="pl-10 bg-secondary/50 border-border/30 focus:bg-secondary focus:border-primary/30 transition-all rounded-full h-9 text-sm"
          />
        </div>

        {/* Mobile Search Icon (To save space) */}
        <Button variant="ghost" size="icon" className="sm:hidden text-muted-foreground">
          <Search className="w-5 h-5" />
        </Button>

        {/* Icons & Profile Group */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">

          {/* Helper Icons */}
          <div className="flex items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary rounded-full w-9 h-9 md:w-10 md:h-10 hover:bg-secondary/50">
                  <MessageSquare className="w-5 h-5" />
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full border-2 border-background"></span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-card border-border/50 backdrop-blur-md" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Mensagens</h4>
                    <p className="text-sm text-muted-foreground">Você não tem novas mensagens.</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary rounded-full w-9 h-9 md:w-10 md:h-10 hover:bg-secondary/50">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full border-2 border-background"></span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-card border-border/50 backdrop-blur-md" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Notificações</h4>
                    <p className="text-sm text-muted-foreground">Tudo limpo por aqui!</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="h-6 w-px bg-border/30 mx-1 hidden sm:block"></div>

          {/* Profile Dropdown */}
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
