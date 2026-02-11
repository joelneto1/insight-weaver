import { useState } from "react";
import { SAMPLE_CANAIS, SAMPLE_PROMPTS, type Prompt } from "@/lib/data";
import { Plus, Star, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

export default function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>(SAMPLE_PROMPTS);
  const [filterCanal, setFilterCanal] = useState("all");
  const [onlyFav, setOnlyFav] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ canalId: "", tipo: "", conteudo: "" });

  const filtered = prompts.filter((p) => {
    if (filterCanal !== "all" && p.canalId !== filterCanal) return false;
    if (onlyFav && !p.favorito) return false;
    if (search && !p.conteudo.toLowerCase().includes(search.toLowerCase()) && !p.tipo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = () => {
    if (!newPrompt.canalId || !newPrompt.conteudo) return;
    const p: Prompt = { id: `p${Date.now()}`, ...newPrompt, favorito: false };
    setPrompts((prev) => [...prev, p]);
    setNewPrompt({ canalId: "", tipo: "", conteudo: "" });
    setShowCreate(false);
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
            {SAMPLE_CANAIS.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={onlyFav ? "default" : "outline"}
          size="sm"
          onClick={() => setOnlyFav(!onlyFav)}
          className="gap-1"
        >
          <Star className="w-4 h-4" /> Apenas Favoritos
        </Button>

        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={() => setShowCreate(true)} className="gradient-accent text-primary-foreground gap-2">
          <Plus className="w-4 h-4" /> Novo Prompt
        </Button>
      </div>

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-12 text-center"
        >
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground text-lg">Nenhum prompt cadastrado</h3>
          <p className="text-muted-foreground text-sm mt-1">Comece criando seu primeiro prompt</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4 gradient-accent text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Criar Primeiro Prompt
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p) => {
            const canal = SAMPLE_CANAIS.find((c) => c.id === p.canalId);
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                <button onClick={() => toggleFav(p.id)}>
                  <Star className={`w-5 h-5 ${p.favorito ? "text-status-planning fill-status-planning" : "text-muted-foreground"}`} />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">{p.tipo}</span>
                    <span className="text-xs text-muted-foreground">{canal?.nome}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{p.conteudo}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Novo Prompt</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Canal</label>
              <Select value={newPrompt.canalId} onValueChange={(v) => setNewPrompt({ ...newPrompt, canalId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {SAMPLE_CANAIS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Tipo</label>
              <Input placeholder="Ex: Título, Roteiro, Thumbnail" value={newPrompt.tipo} onChange={(e) => setNewPrompt({ ...newPrompt, tipo: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Conteúdo</label>
              <Textarea placeholder="Digite o conteúdo do prompt..." value={newPrompt.conteudo} onChange={(e) => setNewPrompt({ ...newPrompt, conteudo: e.target.value })} className="mt-1" rows={6} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleCreate} className="flex-1 gradient-accent text-primary-foreground">Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
