import { useState } from "react";
import { Plus, Tv, Edit2, Trash2, Globe, Clock, Mail, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useCanais, type CanalInsert } from "@/hooks/useCanais";
import { useVideos, STATUS_LABELS, STATUS_COLORS, type VideoStatus } from "@/hooks/useVideos";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { SkeletonStatCard } from "@/components/SkeletonCard";

const EMPTY_FORM: CanalInsert = {
  nome: "", nicho: "", subnicho: "", micronicho: "",
  idioma: "Português", email: "", horario_postagem: "18:00",
  frequencia: "Diária", videos_postados: 0,
};

export default function Canais() {
  const { toast } = useToast();
  const { canais, loading, create, update, remove } = useCanais();
  const { videos } = useVideos();
  const [selectedCanal, setSelectedCanal] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CanalInsert>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canal = canais.find((c) => c.id === selectedCanal) || canais[0];

  // Auto-select first canal
  if (canais.length > 0 && !selectedCanal && !canal) {
    setSelectedCanal(canais[0].id);
  }

  const canalVideos = canal ? videos.filter((v) => v.canal_id === canal.id) : [];
  const statusCounts = (Object.keys(STATUS_LABELS) as VideoStatus[]).reduce((acc, s) => {
    acc[s] = canalVideos.filter((v) => v.status === s).length;
    return acc;
  }, {} as Record<VideoStatus, number>);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!`, description: text });
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleOpenEdit = () => {
    if (!canal) return;
    setIsEditing(true);
    setEditingId(canal.id);
    setForm({
      nome: canal.nome, nicho: canal.nicho, subnicho: canal.subnicho,
      micronicho: canal.micronicho, idioma: canal.idioma, email: canal.email,
      horario_postagem: canal.horario_postagem, frequencia: canal.frequencia,
      videos_postados: canal.videos_postados,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (isEditing && editingId) {
      await update(editingId, form);
    } else {
      const newCanal = await create(form);
      if (newCanal) setSelectedCanal(newCanal.id);
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await remove(deleteId);
    if (selectedCanal === deleteId) {
      setSelectedCanal(canais.filter((c) => c.id !== deleteId)[0]?.id || "");
    }
    setDeleteId(null);
  };

  if (!loading && canais.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader title="Gestão de Canais" description="Selecione um canal e gerencie seus vídeos">
          <Button onClick={handleOpenCreate} className="gradient-accent text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Novo Canal
          </Button>
        </PageHeader>
        <EmptyState icon={Tv} title="Nenhum canal cadastrado" description="Crie seu primeiro canal para começar a organizar seus vídeos." actionLabel="Criar Primeiro Canal" onAction={handleOpenCreate} />
        {renderModal()}
      </div>
    );
  }

  function renderModal() {
    return (
      <>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto w-full max-w-lg">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Canal" : "Criar Novo Canal"}</DialogTitle>
              <DialogDescription>{isEditing ? "Atualize as informações do canal." : "Preencha os dados do novo canal."}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1"><label className="text-sm font-medium">Nome do Canal *</label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: DarkMundo" maxLength={100} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-medium">Nicho</label><Input value={form.nicho} onChange={(e) => setForm({ ...form, nicho: e.target.value })} placeholder="Ex: Terror" maxLength={50} /></div>
                <div className="space-y-1"><label className="text-sm font-medium">Subnicho</label><Input value={form.subnicho} onChange={(e) => setForm({ ...form, subnicho: e.target.value })} placeholder="Ex: Histórias reais" maxLength={50} /></div>
              </div>
              <div className="space-y-1"><label className="text-sm font-medium">Micronicho</label><Input value={form.micronicho} onChange={(e) => setForm({ ...form, micronicho: e.target.value })} placeholder="Ex: Casos sobrenaturais" maxLength={50} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-medium">Idioma</label><Input value={form.idioma} onChange={(e) => setForm({ ...form, idioma: e.target.value })} /></div>
                <div className="space-y-1"><label className="text-sm font-medium">Frequência</label><Input value={form.frequencia} onChange={(e) => setForm({ ...form, frequencia: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-medium">Email</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-1"><label className="text-sm font-medium">Horário de Postagem</label><Input value={form.horario_postagem} onChange={(e) => setForm({ ...form, horario_postagem: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="gradient-accent text-primary-foreground">{saving ? "Salvando..." : isEditing ? "Atualizar" : "Criar Canal"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir canal?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Todos os vídeos vinculados perderão a associação com este canal.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader title="Gestão de Canais" description="Selecione um canal e gerencie seus vídeos">
        <Button onClick={handleOpenCreate} className="gradient-accent text-primary-foreground gap-2">
          <Plus className="w-4 h-4" /> Novo Canal
        </Button>
      </PageHeader>

      {/* Canal selector */}
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="animate-pulse h-10 w-64 bg-muted/60 rounded-md" />
        ) : (
          <Select value={selectedCanal || canal?.id || ""} onValueChange={setSelectedCanal}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              {canais.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {canal && (
        <motion.div key={canal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-3">
              <Tv className="w-5 h-5 text-primary mt-1" />
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {canal.nome}
                  <button onClick={() => copyToClipboard(canal.nome, "Nome do Canal")} title="Copiar" className="opacity-50 hover:opacity-100 transition-opacity">
                    <Copy className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </button>
                </h2>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{canal.idioma}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{canal.horario_postagem}</span>
                  {canal.email && (
                    <span className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors group" onClick={() => copyToClipboard(canal.email, "Email")}>
                      <Mail className="w-3.5 h-3.5" />{canal.email}
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                    </span>
                  )}
                  <span>{canalVideos.length} vídeos</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenEdit} className="gap-2"><Edit2 className="w-4 h-4" /> Editar</Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteId(canal.id)} className="gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"><Trash2 className="w-4 h-4" /> Excluir</Button>
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

          {(canal.nicho || canal.subnicho || canal.micronicho) && (
            <div className="bg-status-planning/10 border-l-4 border-status-planning rounded p-3 relative group">
              <p className="text-sm text-foreground">
                Nicho: {canal.nicho || "—"}, Subnicho: {canal.subnicho || "—"}, Micronicho: {canal.micronicho || "—"}
              </p>
              <button onClick={() => copyToClipboard(`Nicho: ${canal.nicho}, Subnicho: ${canal.subnicho}, Micronicho: ${canal.micronicho}`, "Nicho")}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-background/50 rounded hover:bg-background">
                <Copy className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {renderModal()}
    </div>
  );
}
