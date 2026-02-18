import { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, Shield, Mail } from "lucide-react";
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
    const [newEmail, setNewEmail] = useState("");
    const [inviting, setInviting] = useState(false);

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

    const handleInvite = async () => {
        if (!newEmail || !newEmail.includes("@")) {
            toast({ title: "Email inválido", variant: "destructive" });
            return;
        }
        if (members.some(m => m.member_email === newEmail)) {
            toast({ title: "Usuário já adicionado", variant: "destructive" });
            return;
        }

        setInviting(true);
        // Tentar achar usuário existente para já vincular ID (opcional)
        // Mas como não temos acesso a auth.users, deixamos null e esperamos o user logar.

        const { error } = await supabase.from("team_members").insert({
            owner_id: user?.id,
            member_email: newEmail,
            permissions: { financeiro: false, contas: false, kanban: true } // Default permissions
        });

        if (error) {
            toast({ title: "Erro ao convidar", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Convite enviado!", description: "O usuário terá acesso assim que fizer login." });
            setNewEmail("");
            fetchMembers();
        }
        setInviting(false);
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
                    <p className="text-sm text-muted-foreground">Adicione membros para colaborar no seu workspace.</p>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                    <div className="relative flex-1 sm:w-64">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Email do colaborador"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button onClick={handleInvite} disabled={inviting || !newEmail} className="gradient-accent text-primary-foreground">
                        <UserPlus className="w-4 h-4 mr-2" /> Convidar
                    </Button>
                </div>
            </div>

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
