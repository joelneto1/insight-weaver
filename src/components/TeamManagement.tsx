import { useState, useEffect } from "react";
import { Users, Mail, UserPlus, Trash2, X, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
    id: string;
    member_email: string;
    member_id: string | null;
    permissions: Record<string, boolean>;
    created_at: string;
}

const PERMISSIONS = [
    { key: "financeiro", label: "Financeiro" },
    { key: "contas", label: "Gerenciar Contas" },
    { key: "kanban", label: "Editar Kanban" },
];

export function TeamManagement() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (user) fetchMembers();
    }, [user]);

    const fetchMembers = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("team_members")
            .select("*")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            toast({ title: "Erro ao carregar equipe", description: error.message, variant: "destructive" });
        } else {
            // Parse permissions ensures type safety
            const parsedMembers = (data || []).map(m => ({
                ...m,
                permissions: (typeof m.permissions === 'object' && m.permissions !== null ? m.permissions : {}) as Record<string, boolean>
            }));
            setMembers(parsedMembers);
        }
        setLoading(false);
    };

    const handleCreateMember = async () => {
        if (!formData.email || !formData.password) {
            toast({ title: "Email e Senha são obrigatórios", variant: "destructive" });
            return;
        }
        if (formData.password.length < 6) {
            toast({ title: "Senha muito curta", description: "Mínimo de 6 caracteres.", variant: "destructive" });
            return;
        }

        setCreating(true);

        try {
            const { data, error } = await supabase.functions.invoke('create-team-member', {
                body: {
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    permissions: { financeiro: false, contas: false, kanban: true } // Default
                }
            });

            if (error) {
                console.error("Function invoke error:", error);

                // Tenta ler o corpo da resposta de erro se possível
                let contextMsg = "";
                if (error instanceof Error) {
                    contextMsg = error.message;
                } else if (typeof error === 'object' && error !== null) {
                    contextMsg = JSON.stringify(error);
                }

                throw new Error(`Erro: ${contextMsg}`);
            }

            if (data && data.error) {
                throw new Error(data.error);
            }

            toast({ title: "Membro criado!", description: "Usuário cadastrado com sucesso." });
            setFormData({ name: "", email: "", password: "" });
            setIsCreateModalOpen(false);
            fetchMembers();

        } catch (err: any) {
            console.error("Erro ao criar membro:", err);
            toast({ title: "Erro ao criar", description: err.message || "Falha ao criar usuário.", variant: "destructive" });
        } finally {
            setCreating(false);
        }
    };

    const togglePermission = async (memberId: string, permissionKey: string, currentValue: boolean) => {
        const member = members.find(m => m.id === memberId);
        if (!member) return;

        const newPermissions = { ...member.permissions, [permissionKey]: !currentValue };

        // Update local state optimistic
        setMembers(members.map(m => m.id === memberId ? { ...m, permissions: newPermissions } : m));

        const { error } = await supabase
            .from("team_members")
            .update({ permissions: newPermissions })
            .eq("id", memberId);

        if (error) {
            toast({ title: "Erro ao atualizar permissão", description: error.message, variant: "destructive" });
            fetchMembers(); // Revert
        }
    };

    const removeMember = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este membro? Ele perderá acesso imediatamente.")) return;

        const { error } = await supabase.from("team_members").delete().eq("id", id);
        if (error) {
            toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Membro removido" });
            fetchMembers();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" /> Gerenciar Equipe
                    </h2>
                    <p className="text-sm text-muted-foreground">Cadastre membros para colaborar no seu workspace.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="gradient-accent text-primary-foreground">
                    <UserPlus className="w-4 h-4 mr-2" /> Novo Membro
                </Button>
            </div>

            {/* Dialog for Create Member - Updated CSS for Centering */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
                    <div className="bg-card border border-border w-full max-w-md p-6 rounded-xl shadow-2xl space-y-5 animate-in zoom-in-95 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-4 text-muted-foreground hover:text-primary"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            <X className="w-4 h-4" />
                        </Button>

                        <div className="space-y-1">
                            <h3 className="text-xl font-bold">Cadastrar Novo Membro</h3>
                            <p className="text-sm text-muted-foreground">Preencha os dados do colaborador.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome (Opcional)</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nome do colaborador"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email *</Label>
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="colaborador@email.com"
                                    type="email"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Senha *</Label>
                                <Input
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Senha de acesso"
                                    type="password"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={creating}>Cancelar</Button>
                            <Button onClick={handleCreateMember} disabled={creating} className="gradient-accent text-primary-foreground">
                                {creating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Criando...
                                    </>
                                ) : "Cadastrar Membro"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-secondary/50">
                            <TableHead>Membro</TableHead>
                            <TableHead>Status</TableHead>
                            {PERMISSIONS.map(p => (
                                <TableHead key={p.key} className="text-center">{p.label}</TableHead>
                            ))}
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={2 + PERMISSIONS.length + 1} className="text-center py-8 text-muted-foreground">
                                    Carregando...
                                </TableCell>
                            </TableRow>
                        ) : members.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2 + PERMISSIONS.length + 1} className="text-center py-8 text-muted-foreground">
                                    Nenhum membro na equipe. Convide alguém para começar.
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{member.member_email}</span>
                                            <span className="text-xs text-muted-foreground">ID: {member.member_id ? "*******" + member.member_id.slice(-4) : "-"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {member.member_id ? (
                                            <Badge variant="default" className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">Ativo</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border-amber-500/20">Pendente</Badge>
                                        )}
                                    </TableCell>
                                    {PERMISSIONS.map(p => (
                                        <TableCell key={p.key} className="text-center">
                                            <Switch
                                                checked={!!member.permissions[p.key]}
                                                onCheckedChange={(checked) => togglePermission(member.id, p.key, !!member.permissions[p.key])}
                                            />
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => removeMember(member.id)} className="text-muted-foreground hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
