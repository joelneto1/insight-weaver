import { useState, useRef, useCallback } from "react";
import { SAMPLE_VIDEOS, SAMPLE_CANAIS, STATUS_LABELS, STATUS_COLORS, type Video, type VideoStatus } from "@/lib/data";
import { GripVertical, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLUMNS: VideoStatus[] = ["titulo_gerado", "roteiro_gerado", "geracao_imagens", "upload", "postado"];

export default function Kanban() {
  const [videos, setVideos] = useState<Video[]>(SAMPLE_VIDEOS);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<VideoStatus | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newVideo, setNewVideo] = useState({ titulo: "", canalId: "", notas: "", thumbnail: "" });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
    // Add a slight delay for visual feedback
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "1";
    setDragging(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, status: VideoStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(status);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (status: VideoStatus) => {
    if (!dragging) return;
    setVideos((prev) => prev.map((v) => (v.id === dragging ? { ...v, status } : v)));
    setDragging(null);
    setDragOverCol(null);
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
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kanban</h1>
          <p className="text-sm text-muted-foreground mt-1">Arraste os cards para mover no pipeline</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gradient-accent text-primary-foreground gap-2">
          <Plus className="w-4 h-4" /> Novo Título
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
        {COLUMNS.map((status) => {
          const columnVideos = videos.filter((v) => v.status === status);
          const isOver = dragOverCol === status;
          return (
            <div
              key={status}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(status)}
              className={`min-w-[260px] sm:min-w-[280px] flex-1 rounded-xl p-3 space-y-2 snap-start transition-colors duration-200 ${
                isOver ? "bg-primary/10 border-2 border-dashed border-primary/40" : "bg-secondary/30 border-2 border-transparent"
              }`}
            >
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]}`} />
                <span className="text-sm font-semibold text-foreground">{STATUS_LABELS[status]}</span>
                <span className="ml-auto text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                  {columnVideos.length}
                </span>
              </div>
              <AnimatePresence mode="popLayout">
                {columnVideos.map((video) => {
                  const canal = SAMPLE_CANAIS.find((c) => c.id === video.canalId);
                  return (
                    <motion.div
                      key={video.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      draggable
                      onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, video.id)}
                      onDragEnd={(e) => handleDragEnd(e as unknown as React.DragEvent)}
                      className={`bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-150 select-none ${
                        dragging === video.id
                          ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0 opacity-50" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{video.titulo}</p>
                          <p className="text-xs text-muted-foreground mt-1">{canal?.nome}</p>
                          {video.notas && (
                            <p className="text-xs text-muted-foreground/70 mt-1 truncate italic">{video.notas}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {columnVideos.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground/50">
                  Arraste cards aqui
                </div>
              )}
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
