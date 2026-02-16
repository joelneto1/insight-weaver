import { useState, useMemo } from "react";
import { Plus, Sparkles, Star, Edit2, Trash2, Search, Copy, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { usePrompts, type PromptInsert } from "@/hooks/usePrompts";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

const CATEGORIAS = ["Geral", "Roteiro", "Thumbnail", "SEO", "Descrição", "Tags", "Ideias"];

const EMPTY_FORM: PromptInsert = { titulo: "", conteudo: "", categoria: "Geral", favorito: false };

export default function Prompts() {
  const { toast } = useToast();
  const { prompts, loading, create, update, remove, toggleFavorite } = usePrompts();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<PromptInsert>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterFav, setFilterFav] = useState(false);

  const filtered = useMemo(() => {
    return prompts.filter((p) => {
      if (search && !p.titulo.toLowerCase().includes(search.toLowerCase()) && !p.conteudo.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat !== "all" && p.categoria !== filterCat) return false;
      if (filterFav && !p.favorito) return false;
      return true;
    });
  }, [prompts, search, filterCat, filterFav]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleOpenEdit = (p: typeof prompts[0]) => {
    setEditingId(p.id);
    setForm({ titulo: p.titulo, conteudo: p.conteudo, categoria: p.categoria, favorito: p.favorito });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titulo || !form.conteudo) {
      toast({ title: "Campos obrigatórios", description: "Título e conteúdo são obrigatórios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editingId) {
      await update(editingId, form);
    } else {
      await create(form);
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await remove(deleteId);
    setDeleteId(null);
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Prompt copiado!" });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader title="Prompts" description="Gerencie seus prompts de produção de conteúdo">
        <Button onClick={handleOpenCreate} className="gradient-accent text-primary-foreground gap-2">
          <Plus className="w-4 h-4" /> Novo Prompt
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar prompts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-40"><Filter className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant={filterFav ? "default" : "outline"} onClick={() => setFilterFav(!filterFav)} className="gap-2">
          <Star className={`w-4 h-4 ${filterFav ? "fill-current" : ""}`} /> Favoritos
        </Button>
      </div>

      {/* Prompts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border/50 rounded-xl p-5 space-y-3 animate-pulse">
              <div className="h-5 w-3/4 bg-muted/60 rounded" />
              <div className="h-3 w-full bg-muted/60 rounded" />
              <div className="h-3 w-2/3 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        prompts.length === 0 ? (
          <EmptyState icon={Sparkles} title="Nenhum prompt criado" description="Crie prompts para agilizar sua produção de conteúdo." actionLabel="Criar Primeiro Prompt" onAction={handleOpenCreate} />
        ) : (
          <EmptyState icon={Search} title="Nenhum resultado" description="Tente ajustar seus filtros ou termo de busca." />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((prompt, i) => (
            <motion.div key={prompt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">{prompt.categoria}</span>
                  <h3 className="font-semibold text-foreground text-sm truncate">{prompt.titulo}</h3>
                </div>
                <button onClick={() => toggleFavorite(prompt.id, prompt.favorito)} className="shrink-0 ml-2">
                  <Star className={`w-4 h-4 transition-colors ${prompt.favorito ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`} />
                </button>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{prompt.conteudo}</p>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" onClick={() => copyPrompt(prompt.conteudo)} className="gap-1 text-xs h-7"><Copy className="w-3 h-3" /> Copiar</Button>
                <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(prompt)} className="gap-1 text-xs h-7"><Edit2 className="w-3 h-3" /> Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(prompt.id)} className="gap-1 text-xs h-7 text-destructive"><Trash2 className="w-3 h-3" /> Excluir</Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Prompt" : "Novo Prompt"}</DialogTitle>
            <DialogDescription>{editingId ? "Atualize o conteúdo do prompt." : "Crie um novo prompt reutilizável."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><label className="text-sm font-medium">Título *</label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Roteiro de horror" maxLength={100} /></div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><label className="text-sm font-medium">Conteúdo *</label><Textarea value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} placeholder="Escreva o conteúdo do prompt aqui..." rows={8} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-accent text-primary-foreground">{saving ? "Salvando..." : editingId ? "Atualizar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir prompt?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
