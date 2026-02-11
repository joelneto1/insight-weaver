import { useState } from "react";
import { SAMPLE_CANAIS, SAMPLE_VIDEOS, STATUS_LABELS, STATUS_COLORS, type Canal, type VideoStatus } from "@/lib/data";
import { Plus, Settings2, Tv, Globe, Clock, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Canais() {
  const [canais, setCanais] = useState<Canal[]>(SAMPLE_CANAIS);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCanal, setSelectedCanal] = useState<string>(canais[0]?.id || "");
  const [newCanal, setNewCanal] = useState({
    nome: "", idioma: "Português", horarioPostagem: "19:00",
    email: "", frequencia: "", videosPostados: 0, anotacoes: "",
    nicho: "", subnicho: "", micronicho: "",
  });

  const canal = canais.find((c) => c.id === selectedCanal);
  const canalVideos = SAMPLE_VIDEOS.filter((v) => v.canalId === selectedCanal);

  const statusCounts = (Object.keys(STATUS_LABELS) as VideoStatus[]).reduce((acc, s) => {
    acc[s] = canalVideos.filter((v) => v.status === s).length;
    return acc;
  }, {} as Record<VideoStatus, number>);

  const handleCreate = () => {
    if (!newCanal.nome) return;
    const c: Canal = { id: `c${Date.now()}`, ...newCanal };
    setCanais((prev) => [...prev, c]);
    setSelectedCanal(c.id);
    setNewCanal({ nome: "", idioma: "Português", horarioPostagem: "19:00", email: "", frequencia: "", videosPostados: 0, anotacoes: "", nicho: "", subnicho: "", micronicho: "" });
    setShowCreate(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Canais</h1>
          <p className="text-sm text-muted-foreground mt-1">Selecione um canal e gerencie seus vídeos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Settings2 className="w-4 h-4" /> Criar Atalhos</Button>
          <Button onClick={() => setShowCreate(true)} className="gradient-accent text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Novo Canal
          </Button>
        </div>
      </div>

      {/* Canal selector */}
      <Select value={selectedCanal} onValueChange={setSelectedCanal}>
        <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
        <SelectContent>
          {canais.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {canal && (
        <motion.div
          key={canal.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 space-y-5"
        >
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

          {/* Status cards */}
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

      {/* Create canal dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Canal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Preencha as informações do novo canal</p>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Nome do Canal</label>
              <Input value={newCanal.nome} onChange={(e) => setNewCanal({ ...newCanal, nome: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Nicho</label>
              <Input value={newCanal.nicho} onChange={(e) => setNewCanal({ ...newCanal, nicho: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Subnicho</label>
                <Input value={newCanal.subnicho} onChange={(e) => setNewCanal({ ...newCanal, subnicho: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Micronicho</label>
                <Input value={newCanal.micronicho} onChange={(e) => setNewCanal({ ...newCanal, micronicho: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Idioma</label>
              <Select value={newCanal.idioma} onValueChange={(v) => setNewCanal({ ...newCanal, idioma: v })}>
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
              <Input value={newCanal.horarioPostagem} onChange={(e) => setNewCanal({ ...newCanal, horarioPostagem: e.target.value })} className="mt-1" placeholder="Ex: 13:00" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">E-mail</label>
              <Input value={newCanal.email} onChange={(e) => setNewCanal({ ...newCanal, email: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Frequência de Postagem</label>
              <Input value={newCanal.frequencia} onChange={(e) => setNewCanal({ ...newCanal, frequencia: e.target.value })} className="mt-1" placeholder="Ex: Diário, 3x por semana" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Vídeos Já Postados</label>
              <Input type="number" value={newCanal.videosPostados} onChange={(e) => setNewCanal({ ...newCanal, videosPostados: Number(e.target.value) })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Anotações</label>
              <Textarea value={newCanal.anotacoes} onChange={(e) => setNewCanal({ ...newCanal, anotacoes: e.target.value })} className="mt-1" rows={3} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleCreate} className="flex-1 gradient-accent text-primary-foreground">Criar Canal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
