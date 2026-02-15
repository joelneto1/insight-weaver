import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SAMPLE_CANAIS } from "@/lib/data";
import { formatDate, formatCurrency as formatBRL } from "@/lib/utils";
import {
    DollarSign, TrendingUp, TrendingDown, Plus, Trash2, ArrowUpRight, ArrowDownRight,
    Repeat, CircleDot, Tv, PiggyBank, Wallet, BarChart3, Globe, Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";

interface Transacao {
    id: string;
    user_id: string;
    tipo: "entrada" | "saida";
    categoria: string;
    valor: number;
    valor_usd?: number | null;
    cotacao_dolar?: number | null;
    descricao: string | null;
    canal_nome: string | null;
    recorrente: boolean;
    data: string;
    created_at: string;
}

const CATEGORIAS_ENTRADA = ["Adsense", "Venda de Produtos", "Parcerias", "Outros"];
const CATEGORIAS_SAIDA = ["Ferramentas", "Marketing", "Freelancer", "Impostos", "Hospedagem", "Outros"];

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const EMPTY_FORM = {
    tipo: "entrada" as "entrada" | "saida",
    categoria: "",
    valor: "",        // String mascarada: "1.000,00"
    valorUsd: "",     // String mascarada
    cotacao: "",      // String mascarada
    descricao: "",
    canal_nome: "",
    recorrente: false,
    data: "", // will be set to todayFormatted() on open
};

// Mask util for inputs
const formatCurrencyInput = (value: string) => {
    const onlyDigits = value.replace(/\D/g, "");
    const numberValue = Number(onlyDigits) / 100;
    return numberValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseCurrency = (value: string) => {
    if (!value) return 0;
    return Number(value.replace(/\./g, "").replace(",", ".")) || 0;
};

const fmtUsd = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" });

// Date mask utilities: DD/MM/AAAA <-> YYYY-MM-DD
const formatDateInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    let result = "";
    if (digits.length > 0) result = digits.substring(0, 2);
    if (digits.length > 2) result += "/" + digits.substring(2, 4);
    if (digits.length > 4) result += "/" + digits.substring(4, 8);
    return result;
};

// DD/MM/YYYY -> YYYY-MM-DD (for database)
const dateToISO = (ddmmyyyy: string) => {
    const parts = ddmmyyyy.split("/");
    if (parts.length !== 3 || parts[2]?.length !== 4) return "";
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

// YYYY-MM-DD -> DD/MM/YYYY (for display)
const dateFromISO = (iso: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
};

// Get today as DD/MM/YYYY
const todayFormatted = () => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
};

export default function Financeiro() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchTransacoes();
    }, [user]);

    // Auto-calculate BRL when USD or Rate changes
    useEffect(() => {
        if (form.tipo === "entrada" && form.categoria === "Adsense") {
            const usd = parseCurrency(form.valorUsd);
            const rate = parseCurrency(form.cotacao);
            // Only auto-calculate if user is interacting with USD fields
            // This simple check prevents overwriting if we just loaded an edit form and haven't touched USD values
            // But actually, for edit mode, we want the existing BRL value unless they change USD.
            // Since 'form' updates on load, this might trigger.
            // However, the calculation is deteministic: BRL = USD * Rate. If data is consistent, it's fine.
            if (usd > 0 && rate > 0) {
                const brl = usd * rate;
                // Check difference to avoid infinite loop or unnecessary updates
                const currentBrl = parseCurrency(form.valor);
                if (Math.abs(brl - currentBrl) > 0.01) {
                    setForm(prev => ({
                        ...prev,
                        valor: brl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }));
                }
            }
        }
    }, [form.valorUsd, form.cotacao, form.tipo, form.categoria]);

    const fetchTransacoes = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("financeiro")
            .select("*")
            .eq("user_id", user.id)
            .order("data", { ascending: false });
        if (error) {
            toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
        } else {
            setTransacoes((data as Transacao[]) || []);
        }
        setLoading(false);
    };

    const handleOpenNew = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM, data: todayFormatted() });
        setShowModal(true);
    };

    const handleEdit = (t: Transacao) => {
        setEditingId(t.id);
        setForm({
            tipo: t.tipo,
            categoria: t.categoria,
            valor: t.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
            valorUsd: t.valor_usd?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "",
            cotacao: t.cotacao_dolar?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "",
            descricao: t.descricao || "",
            canal_nome: t.canal_nome || "",
            recorrente: t.recorrente || false,
            data: dateFromISO(t.data),
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.categoria || !form.valor || !user) return;
        if (form.tipo === "entrada" && !form.canal_nome) {
            toast({ title: "Selecione o canal", description: "Entradas precisam estar vinculadas a um canal.", variant: "destructive" });
            return;
        }

        setSaving(true);
        const valorNumber = parseCurrency(form.valor);
        const usdNumber = form.categoria === "Adsense" ? parseCurrency(form.valorUsd) : null;
        const cotacaoNumber = form.categoria === "Adsense" ? parseCurrency(form.cotacao) : null;

        const payload = {
            user_id: user.id,
            tipo: form.tipo,
            categoria: form.categoria,
            valor: valorNumber,
            valor_usd: usdNumber,
            cotacao_dolar: cotacaoNumber,
            descricao: form.descricao || null,
            canal_nome: form.tipo === "entrada" ? form.canal_nome : null,
            recorrente: form.tipo === "saida" ? form.recorrente : false,
            data: dateToISO(form.data),
        };

        let error;
        if (editingId) {
            const { error: updateError } = await supabase.from("financeiro").update(payload).eq("id", editingId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from("financeiro").insert(payload);
            error = insertError;
        }

        if (error) {
            toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        } else {
            toast({ title: editingId ? "Atualizado com sucesso!" : "Transação registrada!" });
            setShowModal(false);
            setForm(EMPTY_FORM);
            setEditingId(null);
            fetchTransacoes();
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const { error } = await supabase.from("financeiro").delete().eq("id", deleteId);
        if (error) {
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Transação excluída!" });
            fetchTransacoes();
        }
        setDeleteId(null);
    };

    const handleCurrencyChange = (field: "valor" | "valorUsd" | "cotacao", value: string) => {
        setForm(prev => ({ ...prev, [field]: formatCurrencyInput(value) }));
    };

    const totalEntradas = useMemo(() => transacoes.filter(t => t.tipo === "entrada").reduce((s, t) => s + Number(t.valor), 0), [transacoes]);
    const totalSaidas = useMemo(() => transacoes.filter(t => t.tipo === "saida").reduce((s, t) => s + Number(t.valor), 0), [transacoes]);
    const totalUsd = useMemo(() => transacoes.reduce((s, t) => s + (Number(t.valor_usd) || 0), 0), [transacoes]);
    const saldo = totalEntradas - totalSaidas;
    const taxaPoupanca = totalEntradas > 0 ? Math.round((saldo / totalEntradas) * 100) : 0;

    const chartData = useMemo(() => {
        const now = new Date();
        const months: { name: string; entradas: number; saidas: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const entradas = transacoes.filter(t => t.tipo === "entrada" && t.data.startsWith(key)).reduce((s, t) => s + Number(t.valor), 0);
            const saidas = transacoes.filter(t => t.tipo === "saida" && t.data.startsWith(key)).reduce((s, t) => s + Number(t.valor), 0);
            months.push({ name: MESES[d.getMonth()], entradas, saidas });
        }
        return months;
    }, [transacoes]);

    const canalData = useMemo(() => {
        const map: Record<string, number> = {};
        transacoes.filter(t => t.tipo === "entrada" && t.canal_nome).forEach(t => {
            map[t.canal_nome!] = (map[t.canal_nome!] || 0) + Number(t.valor);
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [transacoes]);

    const CORES_PIE = ["#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#3b82f6"];

    return (
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
                        <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" /> Financeiro
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Controle de receitas e despesas</p>
                </div>
                <Button onClick={handleOpenNew} className="gradient-accent text-primary-foreground gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 shrink-0">
                    <Plus className="w-4 h-4" /> <span className="hidden xs:inline">Nova </span>Transação
                </Button>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
                {[
                    { label: "Receita Total", value: totalEntradas, icon: TrendingUp, cls: "stat-card-emerald", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" },
                    { label: "Despesa Total", value: totalSaidas, icon: TrendingDown, cls: "stat-card-amber", iconBg: "bg-red-500/20", iconColor: "text-red-400" },
                    { label: "Saldo", value: saldo, icon: DollarSign, cls: saldo >= 0 ? "stat-card-cyan" : "stat-card-amber", iconBg: saldo >= 0 ? "bg-cyan-500/20" : "bg-red-500/20", iconColor: saldo >= 0 ? "text-cyan-400" : "text-red-400" },
                    { label: "Taxa Poupança", value: taxaPoupanca, icon: PiggyBank, cls: "stat-card-purple", iconBg: "bg-purple-500/20", iconColor: "text-purple-400", isTaxa: true },
                    { label: "Total em Dólar", value: totalUsd, icon: Globe, cls: "stat-card-indigo", iconBg: "bg-indigo-500/20", iconColor: "text-indigo-400", isUsd: true },
                ].map((card, i) => (
                    <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`${card.cls} rounded-xl p-3 sm:p-5 ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}>
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{card.label}</span>
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${card.iconBg} flex items-center justify-center`}>
                                <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.iconColor}`} />
                            </div>
                        </div>
                        <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-foreground truncate" title={String((card as any).isUsd ? fmtUsd(card.value as number) : (card as any).isTaxa ? `${card.value}%` : formatBRL(card.value as number))}>
                            {(card as any).isUsd ? fmtUsd(card.value as number) : (card as any).isTaxa ? `${card.value}%` : formatBRL(card.value as number)}
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2"><BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Fluxo de Caixa (R$)</h2>
                            <p className="text-xs sm:text-sm text-muted-foreground">Últimos 6 meses</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData} barGap={2}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(218,35%,20%,0.3)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(215,25%,50%)" }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(215,25%,50%)" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} width={50} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(218,42%,12%)", border: "1px solid hsla(218,35%,20%,0.5)", borderRadius: "12px", color: "hsl(210,40%,95%)", fontSize: "12px" }} formatter={(v: number) => formatBRL(v)} />
                            <Bar dataKey="entradas" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={32} />
                            <Bar dataKey="saidas" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border/50 rounded-xl p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">Receita por Canal</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Total convertido (R$)</p>
                    {canalData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center">
                            <Tv className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/30 mb-3" />
                            <p className="text-xs sm:text-sm text-muted-foreground">Nenhuma receita registrada</p>
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie data={canalData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                                        {canalData.map((_, i) => (<Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: "hsl(218,42%,12%)", border: "1px solid hsla(218,35%,20%,0.5)", borderRadius: "12px", color: "hsl(210,40%,95%)", fontSize: "12px" }} formatter={(v: number) => formatBRL(v)} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-1.5 sm:space-y-2 mt-2">
                                {canalData.map((c, i) => (
                                    <div key={c.name} className="flex items-center justify-between text-xs sm:text-sm">
                                        <div className="flex items-center gap-2 min-w-0"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" style={{ backgroundColor: CORES_PIE[i % CORES_PIE.length] }} /><span className="text-foreground font-medium truncate">{c.name}</span></div>
                                        <span className="text-muted-foreground font-semibold shrink-0 ml-2">{formatBRL(c.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card border border-border/50 rounded-xl p-3 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-5">Últimas Transações</h2>
                {loading ? (
                    <div className="flex justify-center py-10 sm:py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : transacoes.length === 0 ? (
                    <div className="text-center py-10 sm:py-12">
                        <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Nenhuma transação registrada ainda.</p>
                        <Button onClick={handleOpenNew} className="mt-4 gradient-accent text-primary-foreground gap-2 text-sm"><Plus className="w-4 h-4" /> Registrar Primeira</Button>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {transacoes.slice(0, 20).map((t) => (
                            <div key={t.id} className="flex items-center gap-2.5 sm:gap-4 py-2.5 sm:py-3 border-b border-border/30 last:border-0 group">
                                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${t.tipo === "entrada" ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                                    {t.tipo === "entrada" ? <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <p className="font-medium text-foreground text-xs sm:text-sm truncate">{t.categoria}</p>
                                        {t.recorrente && <span title="Recorrente"><Repeat className="w-3 h-3 text-amber-400 shrink-0" /></span>}
                                        {!t.recorrente && t.tipo === "saida" && <span title="Pagamento único"><CircleDot className="w-3 h-3 text-muted-foreground shrink-0" /></span>}
                                        {t.valor_usd && <span title="Receita em Dólar" className="text-[9px] sm:text-[10px] bg-indigo-500/20 text-indigo-400 px-1 sm:px-1.5 rounded border border-indigo-500/30 shrink-0">USD</span>}
                                    </div>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                        {t.canal_nome ? `📺 ${t.canal_nome}` : "Geral"}{t.descricao ? ` · ${t.descricao}` : ""}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`text-xs sm:text-sm font-bold ${t.tipo === "entrada" ? "text-emerald-400" : "text-red-400"}`}>
                                        {t.tipo === "entrada" ? "+" : "-"}{formatBRL(Number(t.valor))}
                                    </p>
                                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">{formatDate(t.data)}</p>
                                    {t.valor_usd && <p className="text-[9px] sm:text-[10px] text-indigo-400 font-mono">{fmtUsd(t.valor_usd)}</p>}
                                </div>
                                <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                    <button onClick={() => handleEdit(t)} title="Editar" className="p-1 sm:p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground active:bg-secondary transition-colors">
                                        <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button onClick={() => setDeleteId(t.id)} title="Excluir" className="p-1 sm:p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive active:bg-destructive/10 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="bg-card border-border max-h-[85vh] sm:max-h-[90vh] overflow-y-auto w-[calc(100%-1.5rem)] sm:w-full max-w-lg rounded-xl p-4 sm:p-6">
                    <DialogHeader><DialogTitle>{editingId ? "Editar Transação" : "Nova Transação"}</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="flex rounded-lg overflow-hidden border border-border">
                            {(["entrada", "saida"] as const).map((t) => (
                                <button key={t} onClick={() => setForm({ ...form, tipo: t, categoria: "", canal_nome: "" })}
                                    className={`flex-1 py-2.5 text-sm font-semibold transition-all ${form.tipo === t ? (t === "entrada" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400") : "text-muted-foreground hover:bg-secondary/50"}`}>
                                    {t === "entrada" ? "📈 Entrada" : "📉 Saída"}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Categoria</label>
                            <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v, valorUsd: "", cotacao: "" })}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                    {(form.tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA).map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {form.tipo === "entrada" && (
                            <div>
                                <label className="text-sm font-medium text-foreground">Canal</label>
                                <Select value={form.canal_nome} onValueChange={(v) => setForm({ ...form, canal_nome: v })}>
                                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o canal..." /></SelectTrigger>
                                    <SelectContent>
                                        {SAMPLE_CANAIS.map((c) => (
                                            <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {form.tipo === "saida" && (
                            <div className="flex items-center justify-between py-2 border border-border/50 rounded-lg px-3 bg-secondary/20">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Despesa Recorrente?</p>
                                    <p className="text-xs text-muted-foreground">Ex: assinatura mensal de ferramenta</p>
                                </div>
                                <Switch checked={form.recorrente} onCheckedChange={(v) => setForm({ ...form, recorrente: v })} />
                            </div>
                        )}

                        {form.tipo === "entrada" && form.categoria === "Adsense" && (
                            <div className="grid grid-cols-2 gap-4 p-4 border border-indigo-500/30 bg-indigo-500/5 rounded-lg">
                                <div className="col-span-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">Cálculo de Câmbio (USD → BRL)</div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">Valor em Dólar ($)</label>
                                    <Input placeholder="0,00" value={form.valorUsd} onChange={(e) => handleCurrencyChange("valorUsd", e.target.value)} className="mt-1 font-mono text-indigo-300" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">Cotação do Dia (R$)</label>
                                    <Input placeholder="0,00" value={form.cotacao} onChange={(e) => handleCurrencyChange("cotacao", e.target.value)} className="mt-1 font-mono" />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium text-foreground">Valor Final (R$)</label>
                            <Input
                                placeholder="0,00"
                                value={form.valor}
                                readOnly={form.tipo === "entrada" && form.categoria === "Adsense"}
                                onChange={(e) => handleCurrencyChange("valor", e.target.value)}
                                className={`mt-1 text-lg font-bold ${form.tipo === "entrada" ? "text-emerald-400" : "text-red-400"} ${form.tipo === "entrada" && form.categoria === "Adsense" ? "bg-secondary/50 cursor-not-allowed" : ""}`}
                            />
                            {form.tipo === "entrada" && form.categoria === "Adsense" && <p className="text-xs text-muted-foreground mt-1">Calculado automaticamente: USD * Cotação</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Observações</label>
                            <Textarea
                                placeholder="Detalhes adicionais sobre esta transação..."
                                value={form.descricao}
                                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                                className="mt-1"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Data (DD/MM/AAAA)</label>
                            <Input
                                placeholder="DD/MM/AAAA"
                                value={form.data}
                                maxLength={10}
                                onChange={(e) => setForm({ ...form, data: formatDateInput(e.target.value) })}
                                className="mt-1 font-mono"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
                            <Button onClick={handleSave} disabled={saving} className="flex-1 gradient-accent text-primary-foreground">
                                {saving ? "Salvando..." : (editingId ? "Atualizar" : "Registrar")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
