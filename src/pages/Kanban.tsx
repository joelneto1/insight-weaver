import { useState } from "react";
import { SAMPLE_VIDEOS, SAMPLE_CANAIS, STATUS_LABELS, STATUS_COLORS, type Video, type VideoStatus } from "@/lib/data";
import { GripVertical, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLUMNS: VideoStatus[] = ["titulo_gerado", "roteiro_gerado", "geracao_imagens", "upload", "postado"];

export default function Kanban() {
  const [videos, setVideos] = useState<Video[]>(SAMPLE_VIDEOS);
  const [dragging, setDragging] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newVideo, setNewVideo] = useState({ titulo: "", canalId: "", notas: "", thumbnail: "" });

  const handleDragStart = (id: string) => setDragging(id);

  const handleDrop = (status: VideoStatus) => {
    if (!dragging) return;
    setVideos((prev) => prev.map((v) => (v.id === dragging ? { ...v, status } : v)));
    setDragging(null);
  };

  const handleCreate = () => {
    if (!newVideo.titulo || !newVideo.canalId) return;
    const video: Video = {
      id: `v${Date.now()}`,
      canalId: newVideo.canalId,
      titulo: newVideo.titulo,
      thumbnail: newVideo.thumbnail,
      notas: newVideo.notas,
      status: "titulo_gerado",
    };
    setVideos((prev) => [...prev, video]);
    setNewVideo({ titulo: "", canalId: "", notas: "", thumbnail: "" });
    setShowCreate(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kanban</h1>
          <p className="text-sm text-muted-foreground mt-1">Arraste os cards para mover no pipeline</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gradient-accent text-primary-foreground gap-2">
          <Plus className="w-4 h-4" /> Novo Título
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => {
          const columnVideos = videos.filter((v) => v.status === status);
          return (
            <div
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
              className="min-w-[280px] flex-1 bg-secondary/30 rounded-xl p-3 space-y-3"
            >
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]}`} />
                <span className="text-sm font-semibold text-foreground">{STATUS_LABELS[status]}</span>
                <span className="ml-auto text-xs text-muted-foreground">{columnVideos.length}</span>
              </div>
              {columnVideos.map((video) => {
                const canal = SAMPLE_CANAIS.find((c) => c.id === video.canalId);
                return (
                  <motion.div
                    key={video.id}
                    layout
                    draggable
                    onDragStart={() => handleDragStart(video.id)}
                    className="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{video.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-1">{canal?.nome}</p>
                        {video.notas && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{video.notas}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Novo Título/Vídeo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Criar um novo vídeo para o canal</p>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Título</label>
              <Input
                placeholder="Digite o título do vídeo"
                value={newVideo.titulo}
                onChange={(e) => setNewVideo({ ...newVideo, titulo: e.target.value })}
                maxLength={100}
                className="mt-1"
              />
              <span className="text-xs text-muted-foreground">{newVideo.titulo.length}/100</span>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Canal</label>
              <Select value={newVideo.canalId} onValueChange={(v) => setNewVideo({ ...newVideo, canalId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o canal" /></SelectTrigger>
                <SelectContent>
                  {SAMPLE_CANAIS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Thumbnail</label>
              <Input
                placeholder="Descrição ou conceito da thumbnail"
                value={newVideo.thumbnail}
                onChange={(e) => setNewVideo({ ...newVideo, thumbnail: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Notas</label>
              <Textarea
                placeholder="Anotações sobre o vídeo ou descrição..."
                value={newVideo.notas}
                onChange={(e) => setNewVideo({ ...newVideo, notas: e.target.value })}
                maxLength={5000}
                className="mt-1"
                rows={4}
              />
              <span className="text-xs text-muted-foreground">{newVideo.notas.length}/5000</span>
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
