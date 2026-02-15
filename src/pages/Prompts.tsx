import { useState } from "react";
import { SAMPLE_CANAIS, SAMPLE_PROMPTS, type Prompt } from "@/lib/data";
import { Plus, Star, FileText, Search, Globe, Copy, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useCopy } from "@/hooks/use-copy";
import { useToast } from "@/hooks/use-toast";

export default function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>(SAMPLE_PROMPTS);
  const [filterCanal, setFilterCanal] = useState("all");
  const [onlyFav, setOnlyFav] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ canalId: "", tipo: "", conteudo: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { copyToClipboard } = useCopy();
  const { toast } = useToast();

  const filtered = prompts.filter((p) => {
    if (filterCanal !== "all") {
      if (filterCanal === "universal" && p.canalId !== "universal") return false;
      if (filterCanal !== "universal" && p.canalId !== filterCanal) return false;
    }
    if (onlyFav && !p.favorito) return false;
    if (search) {
      const lowerSearch = search.toLowerCase();
      if (!p.conteudo.toLowerCase().includes(lowerSearch) &&
        !p.tipo.toLowerCase().includes(lowerSearch)) return false;
    }
    return true;
  });

  const handleOpenCreate = () => {
    setFormData({ canalId: "", tipo: "", conteudo: "" });
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (prompt: Prompt) => {
    setFormData({ canalId: prompt.canalId, tipo: prompt.tipo, conteudo: prompt.conteudo });
    setEditingId(prompt.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.canalId || !formData.conteudo) return;
    if (editingId) {
      setPrompts((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...formData } : p)));
      toast({ title: "Prompt atualizado", description: "As alterações foram salvas." });
    } else {
      const p: Prompt = { id: `p${Date.now()}`, ...formData, favorito: false };
      setPrompts((prev) => [...prev, p]);
      toast({ title: "Prompt criado", description: "Novo prompt adicionado com sucesso." });
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setPrompts((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
    toast({ title: "Prompt excluído", description: "O prompt foi removido permanentemente." });
  };

  const toggleFav = (id: string) => {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, favorito: !p.favorito } : p)));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prompts por Canal</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus prompts organizados por canal com facilidade</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterCanal} onValueChange={setFilterCanal}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Todos os Canais" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Canais</SelectItem>
            <SelectItem value="universal">Universal (Sem Canal)</SelectItem>
            {SAMPLE_CANAIS.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant={onlyFav ? "default" : "outline"} size="sm" onClick={() => setOnlyFav(!onlyFav)} className="gap-1">
          <Star className="w-4 h-4" /> Apenas Favoritos
        </Button>

        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar prompts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Button onClick={handleOpenCreate} className="gradient-accent text-primary-foreground gap-2">
          <Plus className="w-4 h-4" /> Novo Prompt
        </Button>
      </div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground text-lg">Nenhum prompt encontrado</h3>
          <p className="text-muted-foreground text-sm mt-1">Tente ajustar os filtros ou crie um novo prompt</p>
          <Button onClick={handleOpenCreate} className="mt-4 gradient-accent text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Criar Primeiro Prompt
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p) => {
            const isUniversal = p.canalId === "universal";
            const canalNome = isUniversal ? "Universal" : SAMPLE_CANAIS.find((c) => c.id === p.canalId)?.nome;
            return (
              <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={p.id}
                className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 hover:border-sidebar-accent transition-colors group"
              >
                <div className="flex flex-col gap-2 mt-1">
                  <button onClick={() => toggleFav(p.id)} className="transition-transform hover:scale-110" title={p.favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
                    <Star className={`w-5 h-5 ${p.favorito ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`} />
                  </button>
                  <button onClick={() => copyToClipboard(p.conteudo, "Prompt")} className="transition-transform hover:scale-110" title="Copiar prompt">
                    <Copy className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                  </button>
                  <button onClick={() => handleOpenEdit(p)} className="transition-transform hover:scale-110" title="Editar prompt">
                    <Edit2 className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                  </button>
                  <button onClick={() => setDeleteId(p.id)} className="transition-transform hover:scale-110" title="Excluir prompt">
                    <Trash2 className="w-5 h-5 text-muted-foreground hover:text-red-500 transition-colors" />
                  </button>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium border border-primary/20">{p.tipo}</span>
                    {isUniversal ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded border border-border">
                        <Globe className="w-3 h-3" /> Universal
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-0.5 rounded border border-transparent bg-secondary/30">{canalNome}</span>
                    )}
                  </div>
                  <div className="relative group/content cursor-pointer" onClick={() => copyToClipboard(p.conteudo, "Prompt")}>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono bg-secondary/20 p-3 rounded-md border border-border/50 group-hover/content:bg-secondary/40 transition-colors">
                      {p.conteudo}
                    </p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover/content:opacity-100 transition-opacity bg-background/80 p-1 rounded shadow-sm backdrop-blur-sm">
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Prompt" : "Novo Prompt"}</DialogTitle>
            <DialogDescription>{editingId ? "Edite as informações do prompt." : "Crie um novo prompt para agilizar seu fluxo de trabalho."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Vincular a Canal</label>
              <Select value={formData.canalId} onValueChange={(v) => setFormData({ ...formData, canalId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="universal">
                    <div className="flex items-center gap-2 font-medium text-primary"><Globe className="w-4 h-4" /><span>Universal (Sem Vínculo)</span></div>
                  </SelectItem>
                  {SAMPLE_CANAIS.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Tipo de Prompt</label>
              <Input placeholder="Ex: Título, Roteiro, Descrição, Thumbnail" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Conteúdo do Prompt</label>
              <Textarea placeholder="Digite o conteúdo do prompt aqui..." value={formData.conteudo} onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })} className="mt-1 font-mono text-sm" rows={8} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 gradient-accent text-primary-foreground">{editingId ? "Salvar Alterações" : "Salvar Prompt"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Prompt?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este prompt? Esta ação não pode ser desfeita.</AlertDialogDescription>
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
