import { useState } from "react";
import { SAMPLE_CANAIS, SAMPLE_VIDEOS, STATUS_LABELS, STATUS_COLORS, type Canal, type VideoStatus } from "@/lib/data";
import { Plus, Settings2, Tv, Globe, Clock, Mail, Edit2, Copy, Check, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCopy } from "@/hooks/use-copy";
import { useToast } from "@/hooks/use-toast";

const INITIAL_CANAL_STATE = {
  nome: "", idioma: "Português", horarioPostagem: "19:00",
  email: "", frequencia: "", videosPostados: 0, anotacoes: "",
  nicho: "", subnicho: "", micronicho: "",
};

export default function Canais() {
  const [canais, setCanais] = useState<Canal[]>(SAMPLE_CANAIS);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCanal, setSelectedCanal] = useState<string>(canais[0]?.id || "");
  const [formData, setFormData] = useState(INITIAL_CANAL_STATE);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { copyToClipboard } = useCopy();
  const { toast } = useToast();

  const canal = canais.find((c) => c.id === selectedCanal);
  const canalVideos = SAMPLE_VIDEOS.filter((v) => v.canalId === selectedCanal);

  const statusCounts = (Object.keys(STATUS_LABELS) as VideoStatus[]).reduce((acc, s) => {
    acc[s] = canalVideos.filter((v) => v.status === s).length;
    return acc;
  }, {} as Record<VideoStatus, number>);

  const handleOpenCreate = () => {
    setFormData(INITIAL_CANAL_STATE);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = () => {
    if (!canal) return;
    setFormData({ ...canal });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.nome) return;

    if (isEditing && canal) {
      // Update existing canal
      setCanais((prev) =>
        prev.map((c) => (c.id === canal.id ? { ...c, ...formData } : c))
      );
      toast({ title: "Canal atualizado", description: "As informações foram salvas com sucesso." });
    } else {
      // Create new canal
      const newCanal: Canal = { id: `c${Date.now()}`, ...formData };
      setCanais((prev) => [...prev, newCanal]);
      setSelectedCanal(newCanal.id);
      toast({ title: "Canal criado", description: "Novo canal adicionado com sucesso." });
    }

    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;

    const newCanais = canais.filter((c) => c.id !== deleteId);
    setCanais(newCanais);

    // Se deletou o canal selecionado, seleciona outro (o primeiro disponível ou nada)
    if (selectedCanal === deleteId) {
      setSelectedCanal(newCanais.length > 0 ? newCanais[0].id : "");
    }

    setDeleteId(null);
    toast({ title: "Canal excluído", description: "O canal foi removido permanentemente." });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Canais</h1>
          <p className="text-sm text-muted-foreground mt-1">Selecione um canal e gerencie seus vídeos</p>
        </div>
        <div className="flex gap-2">
          {/* <Button variant="outline" className="gap-2"><Settings2 className="w-4 h-4" /> Criar Atalhos</Button> */}
          <Button onClick={handleOpenCreate} className="gradient-accent text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Novo Canal
          </Button>
        </div>
      </div>

      {/* Canal selector */}
      <div className="flex items-center gap-2">
        {canais.length > 0 ? (
          <Select value={selectedCanal} onValueChange={setSelectedCanal}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              {canais.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="p-4 border border-dashed border-border rounded-lg bg-secondary/20 text-center w-full">
            <p className="text-muted-foreground text-sm">Nenhum canal cadastrado. Crie um novo canal para começar.</p>
          </div>
        )}
      </div>

      {canal && (
        <motion.div
          key={canal.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 space-y-5"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-3">
              <Tv className="w-5 h-5 text-primary mt-1" />
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {canal.nome}
                  <button
                    onClick={() => copyToClipboard(canal.nome, "Nome do Canal")}
                    title="Copiar nome do canal"
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </button>
                </h2>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{canal.idioma}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{canal.horarioPostagem}</span>
                  <span
                    className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors group"
                    onClick={() => copyToClipboard(canal.email, "Email")}
                    title="Copiar Email"
                  >
                    <Mail className="w-3.5 h-3.5" />{canal.email}
                    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                  </span>
                  <span>{canal.videosPostados} vídeos postados</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenEdit} className="gap-2">
                <Edit2 className="w-4 h-4" /> Editar Canal
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteId(canal.id)} className="gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/30">
                <Trash2 className="w-4 h-4" /> Excluir
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(STATUS_LABELS) as VideoStatus[]).map((s) => (
              <div key={s} className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[s]}`} />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{STATUS_LABELS[s]}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{statusCounts[s]}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-primary font-medium">📅 Frequência: {canal.frequencia}</p>

          <div className="bg-status-planning/10 border-l-4 border-status-planning rounded p-3 relative group">
            <p className="text-sm text-foreground">
              Nicho: {canal.nicho}, Subnicho: {canal.subnicho}, Micronicho: {canal.micronicho}
            </p>
            <button
              onClick={() => copyToClipboard(`Nicho: ${canal.nicho}, Subnicho: ${canal.subnicho}, Micronicho: ${canal.micronicho}`, "Informações de Nicho")}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-background/50 rounded hover:bg-background"
              title="Copiar Nicho"
            >
              <Copy className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Canal" : "Criar Novo Canal"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Edite as informações do seu canal abaixo." : "Preencha as informações para criar um novo canal."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Nome do Canal</label>
              <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Nicho</label>
              <Input value={formData.nicho} onChange={(e) => setFormData({ ...formData, nicho: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Subnicho</label>
                <Input value={formData.subnicho} onChange={(e) => setFormData({ ...formData, subnicho: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Micronicho</label>
                <Input value={formData.micronicho} onChange={(e) => setFormData({ ...formData, micronicho: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Idioma</label>
              <Select value={formData.idioma} onValueChange={(v) => setFormData({ ...formData, idioma: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Português">Português</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Español">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Horário de Postagem</label>
              <Input value={formData.horarioPostagem} onChange={(e) => setFormData({ ...formData, horarioPostagem: e.target.value })} className="mt-1" placeholder="Ex: 13:00" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">E-mail</label>
              <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Frequência de Postagem</label>
              <Input value={formData.frequencia} onChange={(e) => setFormData({ ...formData, frequencia: e.target.value })} className="mt-1" placeholder="Ex: Diário, 3x por semana" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Vídeos Já Postados</label>
              <Input type="number" value={formData.videosPostados} onChange={(e) => setFormData({ ...formData, videosPostados: Number(e.target.value) })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Anotações</label>
              <Textarea value={formData.anotacoes} onChange={(e) => setFormData({ ...formData, anotacoes: e.target.value })} className="mt-1" rows={3} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 gradient-accent text-primary-foreground">
                {isEditing ? "Salvar Alterações" : "Criar Canal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Canal?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o canal <strong>{canais.find(c => c.id === deleteId)?.nome}</strong>? Esta ação não pode ser desfeita.
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
