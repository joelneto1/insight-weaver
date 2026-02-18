import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { encryptText, decryptText } from "@/lib/crypto";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, User, Mail, Phone, Lock, Globe, StickyNote, KeyRound, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCopy } from "@/hooks/use-copy";

interface Conta {
    id: string;
    user_id: string;
    nick: string;
    email: string;
    senha_email: string | null;
    telefone: string | null;
    perfil_conectado: string | null;
    plataforma: string | null;
    anotacoes: string | null;
    created_at: string;
    updated_at: string;
}

const EMPTY_FORM = {
    nick: "",
    email: "",
    senha_email: "",
    telefone: "",
    perfil_conectado: "",
    plataforma: "YouTube",
    anotacoes: "",
};

export default function Contas() {
    const { user, ownerId, permissions, isOwner } = useAuth();
    const { toast } = useToast();
    const [contas, setContas] = useState<Conta[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const { copyToClipboard } = useCopy();

    // Check permissions
    if (!isOwner && !permissions.contas) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-muted-foreground">
                <Lock className="w-12 h-12 mb-4 opacity-20" />
                <h2 className="text-xl font-semibold">Acesso Restrito</h2>
                <p>Você não tem permissão para acessar o gerenciamento de contas.</p>
            </div>
        );
    }

    // Fetch contas
    useEffect(() => {
        if (!user || !ownerId) return;
        fetchContas();
    }, [user, ownerId]);

    const fetchContas = async () => {
        if (!user || !ownerId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("contas")
            .select("*")
            .eq("user_id", ownerId)
            .order("created_at", { ascending: false });

        if (error) {
            toast({ title: "Erro ao carregar contas", description: error.message, variant: "destructive" });
        } else if (data) {
            const decrypted = await Promise.all(
                data.map(async (conta) => ({
                    ...conta,
                    senha_email: conta.senha_email
                        ? await decryptText(conta.senha_email, ownerId)
                        : null,
                }))
            );
            setContas(decrypted);
        }
        setLoading(false);
    };

    const handleCopy = async (text: string, fieldId: string, label: string) => {
        await copyToClipboard(text, label);
        setCopiedField(fieldId);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowModal(true);
    };

    const openEdit = (conta: Conta) => {
        setForm({
            nick: conta.nick,
            email: conta.email,
            senha_email: conta.senha_email || "",
            telefone: conta.telefone || "",
            perfil_conectado: conta.perfil_conectado || "",
            plataforma: conta.plataforma || "YouTube",
            anotacoes: conta.anotacoes || "",
        });
        setEditingId(conta.id);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.nick || !form.email) {
            toast({ title: "Campos obrigatórios", description: "Nick e Email são obrigatórios.", variant: "destructive" });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            toast({ title: "Email inválido", description: "Por favor, insira um email válido.", variant: "destructive" });
            return;
        }

        if (!user || !ownerId) return;

        setSaving(true);

        const encryptedSenha = form.senha_email
            ? await encryptText(form.senha_email, ownerId)
            : null;

        if (editingId) {
            // Update
            const { error } = await supabase
                .from("contas")
                .update({
                    nick: form.nick,
                    email: form.email,
                    senha_email: encryptedSenha,
                    telefone: form.telefone || null,
                    perfil_conectado: form.perfil_conectado || null,
                    plataforma: form.plataforma || "YouTube",
                    anotacoes: form.anotacoes || null,
                })
                .eq("id", editingId)
                .eq("user_id", ownerId);

            if (error) {
                toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "Conta atualizada!" });
                setShowModal(false);
                fetchContas();
            }
        } else {
            // Create
            const { error } = await supabase
                .from("contas")
                .insert({
                    user_id: ownerId,
                    nick: form.nick,
                    email: form.email,
                    senha_email: encryptedSenha,
                    telefone: form.telefone || null,
                    perfil_conectado: form.perfil_conectado || null,
                    plataforma: form.plataforma || "YouTube",
                    anotacoes: form.anotacoes || null,
                });

            if (error) {
                toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "Conta adicionada!" });
                setShowModal(false);
                fetchContas();
            }
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteId || !user || !ownerId) return;
        const { error } = await supabase.from("contas").delete().eq("id", deleteId).eq("user_id", ownerId);
        if (error) {
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Conta excluída!" });
            fetchContas();
        }
        setDeleteId(null);
    };

    const togglePassword = (id: string) => {
        setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const getPlatformColor = (plataforma: string | null) => {
        switch (plataforma) {
            case "YouTube": return "bg-red-500/20 text-red-400 border-red-500/30";
            case "TikTok": return "bg-pink-500/20 text-pink-400 border-pink-500/30";
            case "Instagram": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
            case "Twitter/X": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "Facebook": return "bg-blue-600/20 text-blue-300 border-blue-600/30";
            case "Twitch": return "bg-violet-500/20 text-violet-400 border-violet-500/30";
            default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Contas</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gerencie os logins e senhas dos seus canais
                    </p>
                </div>
                <Button onClick={openCreate} className="gradient-accent text-primary-foreground gap-2">
                    <Plus className="w-4 h-4" /> Nova Conta
                </Button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Empty state */}
            {!loading && contas.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <KeyRound className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Nenhuma conta cadastrada</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Adicione os logins dos seus canais para gerenciá-los em um só lugar.
                    </p>
                    <Button onClick={openCreate} className="gradient-accent text-primary-foreground gap-2">
                        <Plus className="w-4 h-4" /> Adicionar Primeira Conta
                    </Button>
                </motion.div>
            )}

            {/* Cards grid */}
            {!loading && contas.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {contas.map((conta, i) => (
                            <motion.div
                                key={conta.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-300 group"
                            >
                                {/* Card header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-primary-foreground" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground text-base">{conta.nick}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getPlatformColor(conta.plataforma)}`}>
                                                {conta.plataforma || "Outro"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(conta)}
                                            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(conta.id)}
                                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Info rows */}
                                <div className="space-y-2.5 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate flex-1">{conta.email}</span>
                                        <button
                                            onClick={() => handleCopy(conta.email, `email-${conta.id}`, "Email")}
                                            className="p-1 rounded hover:bg-secondary transition-colors shrink-0"
                                            title="Copiar email"
                                        >
                                            {copiedField === `email-${conta.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>

                                    {conta.senha_email && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Lock className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate flex-1 font-mono text-xs">
                                                {showPasswords[conta.id] ? conta.senha_email : "••••••••••"}
                                            </span>
                                            <button
                                                onClick={() => togglePassword(conta.id)}
                                                className="p-1 rounded hover:bg-secondary transition-colors shrink-0"
                                            >
                                                {showPasswords[conta.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                            </button>
                                            <button
                                                onClick={() => handleCopy(conta.senha_email!, `senha-${conta.id}`, "Senha")}
                                                className="p-1 rounded hover:bg-secondary transition-colors shrink-0"
                                                title="Copiar senha"
                                            >
                                                {copiedField === `senha-${conta.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    )}

                                    {conta.telefone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate flex-1">{conta.telefone}</span>
                                            <button
                                                onClick={() => handleCopy(conta.telefone!, `tel-${conta.id}`, "Telefone")}
                                                className="p-1 rounded hover:bg-secondary transition-colors shrink-0"
                                                title="Copiar telefone"
                                            >
                                                {copiedField === `tel-${conta.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    )}

                                    {conta.perfil_conectado && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Globe className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate flex-1">{conta.perfil_conectado}</span>
                                        </div>
                                    )}

                                    {conta.anotacoes && (
                                        <div className="flex items-start gap-2 text-muted-foreground mt-2 pt-2 border-t border-border/50">
                                            <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span className="text-xs leading-relaxed">{conta.anotacoes}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Editar Conta" : "Adicionar Conta"}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        {editingId ? "Atualize as informações da conta" : "Preencha os dados de login do canal"}
                    </p>

                    <div className="space-y-4 mt-2">
                        <div>
                            <label className="text-sm font-medium text-foreground">Nick *</label>
                            <div className="relative mt-1">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Nome de identificação da conta"
                                    value={form.nick}
                                    onChange={(e) => setForm({ ...form, nick: e.target.value })}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Email *</label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Senha do Email</label>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={form.senha_email}
                                    onChange={(e) => setForm({ ...form, senha_email: e.target.value })}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Telefone Cadastrado</label>
                            <div className="relative mt-1">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="(11) 99999-9999"
                                    value={form.telefone}
                                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Perfil Conectado</label>
                            <div className="relative mt-1">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Ex: Perfil Principal, Perfil Secundário"
                                    value={form.perfil_conectado}
                                    onChange={(e) => setForm({ ...form, perfil_conectado: e.target.value })}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Plataforma</label>
                            <Select value={form.plataforma} onValueChange={(v) => setForm({ ...form, plataforma: v })}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="YouTube">YouTube</SelectItem>
                                    <SelectItem value="TikTok">TikTok</SelectItem>
                                    <SelectItem value="Instagram">Instagram</SelectItem>
                                    <SelectItem value="Twitter/X">Twitter/X</SelectItem>
                                    <SelectItem value="Facebook">Facebook</SelectItem>
                                    <SelectItem value="Twitch">Twitch</SelectItem>
                                    <SelectItem value="Outro">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Anotações</label>
                            <Textarea
                                placeholder="Observações adicionais sobre esta conta..."
                                value={form.anotacoes}
                                onChange={(e) => setForm({ ...form, anotacoes: e.target.value })}
                                className="mt-1"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={saving} className="flex-1 gradient-accent text-primary-foreground">
                                {saving ? "Salvando..." : editingId ? "Salvar Alterações" : "Adicionar Conta"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Os dados de login desta conta serão permanentemente removidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
