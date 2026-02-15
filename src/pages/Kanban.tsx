import { useState, useRef, useCallback, useEffect } from "react";
import { SAMPLE_VIDEOS, SAMPLE_CANAIS, STATUS_LABELS, STATUS_COLORS, type Video, type VideoStatus } from "@/lib/data";
import { GripVertical, Plus, Edit2, Trash2, ChevronRight, ChevronLeft, MoveRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const COLUMNS: VideoStatus[] = ["titulo_gerado", "roteiro_gerado", "geracao_imagens", "upload", "postado"];

export default function Kanban() {
  const [videos, setVideos] = useState<Video[]>(SAMPLE_VIDEOS);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<VideoStatus | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ titulo: "", canalId: "", notas: "", thumbnail: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [moveVideoId, setMoveVideoId] = useState<string | null>(null);
  const { toast } = useToast();

  // Detect touch device
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Touch drag state
  const touchState = useRef<{
    videoId: string;
    startX: number;
    startY: number;
    clone: HTMLElement | null;
    moved: boolean;
  } | null>(null);
  const columnsRef = useRef<Map<VideoStatus, HTMLElement>>(new Map());

  // Desktop drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
    (e.currentTarget as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    setDragging(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, status: VideoStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(status);
  };

  const handleDrop = (status: VideoStatus) => {
    if (!dragging) return;
    setVideos((prev) => prev.map((v) => (v.id === dragging ? { ...v, status } : v)));
    setDragging(null);
    setDragOverCol(null);
  };

  // Touch drag handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, videoId: string) => {
    const touch = e.touches[0];
    const el = e.currentTarget as HTMLElement;
    touchState.current = {
      videoId,
      startX: touch.clientX,
      startY: touch.clientY,
      clone: null,
      moved: false,
    };

    // Create floating clone for drag preview after a small delay/movement
    const rect = el.getBoundingClientRect();
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.opacity = "0";
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";
    clone.style.transform = "rotate(2deg) scale(1.03)";
    clone.style.boxShadow = "0 12px 24px rgba(0,0,0,0.3)";
    clone.style.borderRadius = "8px";
    document.body.appendChild(clone);
    touchState.current.clone = clone;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchState.current.startX;
    const dy = touch.clientY - touchState.current.startY;

    // Only start drag after minimum threshold
    if (!touchState.current.moved && Math.abs(dx) + Math.abs(dy) > 8) {
      touchState.current.moved = true;
      setDragging(touchState.current.videoId);
      if (touchState.current.clone) {
        touchState.current.clone.style.opacity = "0.9";
      }
    }

    if (touchState.current.moved && touchState.current.clone) {
      e.preventDefault();
      const clone = touchState.current.clone;
      const startRect = clone.getBoundingClientRect();
      clone.style.left = `${parseFloat(clone.style.left) + (touch.clientX - (startRect.left + startRect.width / 2))}px`;
      clone.style.top = `${parseFloat(clone.style.top) + (touch.clientY - (startRect.top + startRect.height / 2))}px`;

      // Detect which column we're over
      let foundCol: VideoStatus | null = null;
      columnsRef.current.forEach((colEl, status) => {
        const rect = colEl.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          foundCol = status;
        }
      });
      setDragOverCol(foundCol);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchState.current) return;

    // Clean up clone
    if (touchState.current.clone) {
      touchState.current.clone.remove();
    }

    // If moved and over a column, do the drop
    if (touchState.current.moved && dragOverCol) {
      setVideos((prev) => prev.map((v) =>
        v.id === touchState.current!.videoId ? { ...v, status: dragOverCol } : v
      ));
    }

    setDragging(null);
    setDragOverCol(null);
    touchState.current = null;
  }, [dragOverCol]);

  // Move video to column (mobile button approach)
  const moveToColumn = (videoId: string, newStatus: VideoStatus) => {
    setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, status: newStatus } : v)));
    setMoveVideoId(null);
    toast({ title: "Card movido!", description: `Movido para "${STATUS_LABELS[newStatus]}"` });
  };

  // Quick move: advance to next column
  const moveToNext = (video: Video) => {
    const idx = COLUMNS.indexOf(video.status);
    if (idx < COLUMNS.length - 1) {
      const next = COLUMNS[idx + 1];
      setVideos(prev => prev.map(v => v.id === video.id ? { ...v, status: next } : v));
      toast({ title: "Avançou!", description: `"${video.titulo}" → ${STATUS_LABELS[next]}` });
    }
  };

  const moveToPrev = (video: Video) => {
    const idx = COLUMNS.indexOf(video.status);
    if (idx > 0) {
      const prev = COLUMNS[idx - 1];
      setVideos(p => p.map(v => v.id === video.id ? { ...v, status: prev } : v));
      toast({ title: "Voltou!", description: `"${video.titulo}" → ${STATUS_LABELS[prev]}` });
    }
  };

  const handleOpenCreate = () => {
    setFormData({ titulo: "", canalId: "", notas: "", thumbnail: "" });
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (video: Video) => {
    setFormData({ titulo: video.titulo, canalId: video.canalId, notas: video.notas, thumbnail: video.thumbnail });
    setEditingId(video.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.titulo || !formData.canalId) return;
    if (editingId) {
      setVideos((prev) => prev.map((v) => (v.id === editingId ? { ...v, ...formData } : v)));
      toast({ title: "Vídeo atualizado", description: "As alterações foram salvas." });
    } else {
      const video: Video = { id: `v${Date.now()}`, canalId: formData.canalId, titulo: formData.titulo, thumbnail: formData.thumbnail, notas: formData.notas, status: "titulo_gerado" };
      setVideos((prev) => [...prev, video]);
      toast({ title: "Vídeo criado", description: "Novo vídeo adicionado ao pipeline." });
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setVideos((prev) => prev.filter((v) => v.id !== deleteId));
    setDeleteId(null);
    toast({ title: "Vídeo excluído", description: "O vídeo foi removido do pipeline." });
  };

  const setColumnRef = useCallback((status: VideoStatus) => (el: HTMLElement | null) => {
    if (el) columnsRef.current.set(status, el);
    else columnsRef.current.delete(status);
  }, []);

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Kanban</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            {isTouchDevice ? "Toque nas setas para mover os cards" : "Arraste os cards para mover no pipeline"}
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gradient-accent text-primary-foreground gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden xs:inline">Novo </span>Título
        </Button>
      </div>

      <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-4 snap-x snap-mandatory -mx-3 px-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0">
        {COLUMNS.map((status) => {
          const columnVideos = videos.filter((v) => v.status === status);
          const isOver = dragOverCol === status;
          const colIdx = COLUMNS.indexOf(status);
          return (
            <div
              key={status}
              ref={setColumnRef(status)}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDrop(status)}
              className={`min-w-[220px] sm:min-w-[260px] md:min-w-[280px] flex-1 rounded-xl p-2.5 sm:p-3 space-y-2 snap-start transition-colors duration-200 ${isOver ? "bg-primary/10 border-2 border-dashed border-primary/40" : "bg-secondary/30 border-2 border-transparent"}`}
            >
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${STATUS_COLORS[status]}`} />
                <span className="text-xs sm:text-sm font-semibold text-foreground">{STATUS_LABELS[status]}</span>
                <span className="ml-auto text-[10px] sm:text-xs bg-secondary px-1.5 sm:px-2 py-0.5 rounded-full text-muted-foreground font-medium">{columnVideos.length}</span>
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
                      draggable={!isTouchDevice}
                      onDragStart={!isTouchDevice ? (e) => handleDragStart(e as unknown as React.DragEvent, video.id) : undefined}
                      onDragEnd={!isTouchDevice ? (e) => handleDragEnd(e as unknown as React.DragEvent) : undefined}
                      onTouchStart={isTouchDevice ? (e) => handleTouchStart(e, video.id) : undefined}
                      onTouchMove={isTouchDevice ? handleTouchMove : undefined}
                      onTouchEnd={isTouchDevice ? handleTouchEnd : undefined}
                      className={`bg-card border rounded-lg p-2.5 sm:p-3 transition-all duration-150 select-none group/card ${!isTouchDevice ? "cursor-grab active:cursor-grabbing" : ""
                        } ${dragging === video.id ? "border-primary shadow-lg shadow-primary/20 scale-[1.02] opacity-50" : "border-border hover:border-primary/30"}`}
                    >
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        {!isTouchDevice && <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0 opacity-50" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm text-foreground truncate">{video.titulo}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{canal?.nome}</p>
                          {video.notas && <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-0.5 sm:mt-1 truncate italic">{video.notas}</p>}
                        </div>
                        <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(video); }} className="p-1 rounded hover:bg-secondary active:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Editar vídeo">
                            <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteId(video.id); }} className="p-1 rounded hover:bg-destructive/10 active:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Excluir vídeo">
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Mobile: Move arrows */}
                      {isTouchDevice && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                          <button
                            disabled={colIdx === 0}
                            onClick={(e) => { e.stopPropagation(); moveToPrev(video); }}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${colIdx === 0 ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground active:bg-secondary"
                              }`}
                          >
                            <ChevronLeft className="w-3 h-3" /> Voltar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMoveVideoId(video.id); }}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-primary hover:bg-primary/10 active:bg-primary/10 transition-colors"
                          >
                            <MoveRight className="w-3 h-3" /> Mover
                          </button>
                          <button
                            disabled={colIdx === COLUMNS.length - 1}
                            onClick={(e) => { e.stopPropagation(); moveToNext(video); }}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${colIdx === COLUMNS.length - 1 ? "text-muted-foreground/30 cursor-not-allowed" : "text-emerald-400 hover:bg-emerald-500/10 active:bg-emerald-500/10"
                              }`}
                          >
                            Avançar <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {columnVideos.length === 0 && <div className="text-center py-6 sm:py-8 text-[10px] sm:text-xs text-muted-foreground/50">{isTouchDevice ? "Mova cards para cá" : "Arraste cards aqui"}</div>}
            </div>
          );
        })}
      </div>

      {/* Move to specific column dialog (mobile) */}
      <Dialog open={!!moveVideoId} onOpenChange={() => setMoveVideoId(null)}>
        <DialogContent className="bg-card border-border w-[calc(100%-1.5rem)] sm:w-full max-w-sm rounded-xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base">Mover para...</DialogTitle>
            <DialogDescription className="text-xs">Selecione a coluna de destino</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 mt-3">
            {COLUMNS.map((status) => {
              const currentVideo = videos.find(v => v.id === moveVideoId);
              const isCurrent = currentVideo?.status === status;
              return (
                <button
                  key={status}
                  disabled={isCurrent}
                  onClick={() => moveVideoId && moveToColumn(moveVideoId, status)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isCurrent
                      ? "bg-primary/10 text-primary border border-primary/20 cursor-not-allowed"
                      : "text-foreground hover:bg-secondary active:bg-secondary border border-transparent"
                    }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]}`} />
                  <span>{STATUS_LABELS[status]}</span>
                  {isCurrent && <span className="ml-auto text-[10px] text-primary/70">Atual</span>}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border w-[calc(100%-1.5rem)] sm:w-full max-w-lg rounded-xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Vídeo" : "Novo Título/Vídeo"}</DialogTitle>
            <DialogDescription>{editingId ? "Edite as informações do vídeo." : "Criar um novo vídeo para o canal."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Título</label>
              <Input placeholder="Digite o título do vídeo" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} maxLength={100} className="mt-1" />
              <span className="text-xs text-muted-foreground">{formData.titulo.length}/100</span>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Canal</label>
              <Select value={formData.canalId} onValueChange={(v) => setFormData({ ...formData, canalId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o canal" /></SelectTrigger>
                <SelectContent>{SAMPLE_CANAIS.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Thumbnail</label>
              <Input placeholder="Descrição ou conceito da thumbnail" value={formData.thumbnail} onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Notas</label>
              <Textarea placeholder="Anotações sobre o vídeo ou descrição..." value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} maxLength={5000} className="mt-1" rows={4} />
              <span className="text-xs text-muted-foreground">{formData.notas.length}/5000</span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 gradient-accent text-primary-foreground">{editingId ? "Salvar Alterações" : "Criar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border w-[calc(100%-1.5rem)] sm:w-full rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Vídeo?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir o vídeo <strong>{videos.find(v => v.id === deleteId)?.titulo}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription>
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
