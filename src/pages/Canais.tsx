import { useState } from "react";
import { SAMPLE_CANAIS, SAMPLE_VIDEOS, STATUS_LABELS, STATUS_COLORS, type Canal, type VideoStatus } from "@/lib/data";
import { Plus, Settings2, Tv, Globe, Clock, Mail, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    } else {
      // Create new canal
      const newCanal: Canal = { id: `c${Date.now()}`, ...formData };
      setCanais((prev) => [...prev, newCanal]);
      setSelectedCanal(newCanal.id);
    }

    setShowModal(false);
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
          <p className="text-muted-foreground text-sm">Nenhum canal cadastrado.</p>
        )}
      </div>

      {canal && (
        <motion.div
          key={canal.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 space-y-5"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Tv className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h2 className="text-xl font-bold text-foreground">{canal.nome}</h2>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{canal.idioma}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{canal.horarioPostagem}</span>
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{canal.email}</span>
                  <span>{canal.videosPostados} vídeos postados</span>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleOpenEdit} className="gap-2">
              <Edit2 className="w-4 h-4" /> Editar Canal
            </Button>
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

          <div className="bg-status-planning/10 border-l-4 border-status-planning rounded p-3">
            <p className="text-sm text-foreground">
              Nicho: {canal.nicho}, Subnicho: {canal.subnicho}, Micronicho: {canal.micronicho}
            </p>
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
    </div>
  );
}
