import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    LayoutDashboard,
    Columns3,
    Tv,
    Sparkles,
    Settings,
    KeyRound,
    FileText,
    Wallet,
    Search,
    Moon,
    Sun,
    LogOut,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const PAGES = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Kanban", icon: Columns3, path: "/kanban" },
    { label: "Financeiro", icon: Wallet, path: "/financeiro" },
    { label: "Canais", icon: Tv, path: "/canais" },
    { label: "Contas", icon: KeyRound, path: "/contas" },
    { label: "Prompts", icon: Sparkles, path: "/prompts" },
    { label: "Formulário", icon: FileText, path: "/formulario" },
    { label: "Configurações", icon: Settings, path: "/config" },
];

export default function CommandMenu() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { signOut } = useAuth();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (callback: () => void) => {
        setOpen(false);
        callback();
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Pesquisar páginas, ações..." />
            <CommandList>
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                <CommandGroup heading="Páginas">
                    {PAGES.map((page) => (
                        <CommandItem
                            key={page.path}
                            onSelect={() => runCommand(() => navigate(page.path))}
                            className="gap-3 cursor-pointer"
                        >
                            <page.icon className="w-4 h-4 text-muted-foreground" />
                            {page.label}
                        </CommandItem>
                    ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Ações">
                    <CommandItem
                        onSelect={() => runCommand(toggleTheme)}
                        className="gap-3 cursor-pointer"
                    >
                        {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-primary" />}
                        {isDark ? "Modo Claro" : "Modo Escuro"}
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(signOut)}
                        className="gap-3 cursor-pointer text-destructive"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair da conta
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
