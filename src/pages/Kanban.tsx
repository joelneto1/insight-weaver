import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  closestCorners,
  useDroppable
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { SAMPLE_VIDEOS, SAMPLE_CANAIS, STATUS_LABELS, STATUS_COLORS, type Video, type VideoStatus } from "@/lib/data";
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, MoveRight, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Ensure all column types are valid
const COLUMNS: VideoStatus[] = ["titulo_gerado", "roteiro_gerado", "geracao_imagens", "upload", "postado"];

// --- Card Component ---
function KanbanCard({ video, isOverlay, onClickEdit, onClickDelete, onQuickMove }: { video: Video; isOverlay?: boolean; onClickEdit?: () => void; onClickDelete?: () => void, onQuickMove?: (action: 'prev' | 'next' | 'move') => void }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: video.id,
    data: { type: "Video", video },
    disabled: isOverlay
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  const canal = SAMPLE_CANAIS.find(c => c.id === video.canalId);
  const statusColor = STATUS_COLORS[video.status] || "bg-primary";

  if (isOverlay) {
    return (
      <div className="bg-card/95 backdrop-blur-sm shadow-2xl rounded-xl border-2 border-primary/40 p-4 w-[280px] cursor-grabbing relative z-50 transform rotate-2 scale-105">
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${statusColor}`} />
        <CardContent video={video} canal={canal} />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/card relative bg-gradient-to-br from-card to-secondary/10 hover:to-secondary/20 dark:from-card dark:to-secondary/5 border border-border/60 dark:border-border/80 hover:border-primary/30 dark:hover:border-primary/50 rounded-xl p-3 sm:p-4 shadow-sm dark:shadow-md transition-all touch-none select-none mb-3 ${isDragging ? "opacity-30" : "hover:shadow-md hover:-translate-y-0.5 dark:hover:shadow-primary/5"}`}
      {...attributes}
      {...listeners}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${statusColor} opacity-75 dark:opacity-90 transition-opacity group-hover/card:opacity-100 shadow-[2px_0_8px_rgba(0,0,0,0.1)]`} />

      <div className="pl-2">
        <CardContent video={video} canal={canal} onClickEdit={onClickEdit} onClickDelete={onClickDelete} />

        {/* Mobile Quick Actions (Integrated directly in card) */}
        {onQuickMove && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 sm:hidden">
            <Button variant="ghost" size="sm" className="h-6 px-1 text-[10px] text-muted-foreground hover:bg-secondary" onClick={(e) => { e.stopPropagation(); onQuickMove('prev'); }}>
              <ChevronLeft className="w-3 h-3 mr-1" /> Voltar
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-1 text-[10px] text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); onQuickMove('move'); }}>
              <MoveRight className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-1 text-[10px] text-muted-foreground hover:bg-secondary" onClick={(e) => { e.stopPropagation(); onQuickMove('next'); }}>
              Avançar <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CardContent({ video, canal, onClickEdit, onClickDelete }: any) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-foreground/70 uppercase tracking-wider">
          {canal?.nicho || "Geral"}
        </span>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity">
          {onClickEdit && <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); onClickEdit(); }}><Edit2 className="w-3.5 h-3.5" /></Button>}
          {onClickDelete && <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); onClickDelete(); }}><Trash2 className="w-3.5 h-3.5" /></Button>}
        </div>
      </div>

      <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-relaxed tracking-tight">
        {video.titulo}
      </h4>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5 bg-secondary/40 px-2 py-1 rounded-md max-w-[70%]">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
          <span className="text-[10px] sm:text-xs text-muted-foreground truncate font-medium">{canal?.nome}</span>
        </div>
        {video.notas && <FileText className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
      </div>
    </div>
  )
}

// --- Column Component (New) ---
function KanbanColumn({ status, videos, onClickEdit, onClickDelete, onQuickMove }: { status: VideoStatus, videos: Video[], onClickEdit: (v: Video) => void, onClickDelete: (id: string) => void, onQuickMove: (v: Video, action: any) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[260px] sm:min-w-[280px] flex-1 bg-secondary/20 border-2 rounded-xl p-2 sm:p-3 snap-start h-fit transition-colors ${isOver ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]}`} />
        <span className="text-sm font-semibold text-foreground">{STATUS_LABELS[status]}</span>
        <span className="ml-auto text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-medium">{videos.length}</span>
      </div>

      <SortableContext id={status} items={videos.map(v => v.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[150px]">
          {videos.map((video) => (
            <KanbanCard
              key={video.id}
              video={video}
              onClickEdit={() => onClickEdit(video)}
              onClickDelete={() => onClickDelete(video.id)}
              onQuickMove={(action) => onQuickMove(video, action)}
            />
          ))}
          {videos.length === 0 && (
            <div className="h-full min-h-[140px] rounded-lg border-2 border-dashed border-border/30 flex items-center justify-center text-muted-foreground/30 text-xs italic">
              Arraste cards aqui
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// --- Main Kanban Component ---
export default function Kanban() {
  const [videos, setVideos] = useState<Video[]>(SAMPLE_VIDEOS);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null); // For drag overlay

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ titulo: "", canalId: "", notas: "", thumbnail: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [moveVideoId, setMoveVideoId] = useState<string | null>(null); // Mobile explicit move

  const { toast } = useToast();

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }) // Unified pointer sensor for mouse/touch with 8px threshold
  );

  // Computed columns for dnd-kit
  const columnsData = useMemo(() => {
    const cols: Record<string, Video[]> = {};
    COLUMNS.forEach(c => cols[c] = []);
    videos.forEach(v => {
      if (cols[v.status]) cols[v.status].push(v);
    });
    return cols;
  }, [videos]);

  // Handlers
  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const video = videos.find(v => v.id === active.id);
    if (video) setActiveVideo(video);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find containers
    const activeVideo = videos.find(v => v.id === activeId);
    if (!activeVideo) return;

    // Determine if dropping over a column or another card
    let overStatus: VideoStatus | null = null;

    if (COLUMNS.includes(overId as any)) {
      // Dropping directly over a column container
      overStatus = overId as VideoStatus;
    } else {
      // Dropping over a card
      const overVideo = videos.find(v => v.id === overId);
      if (overVideo) overStatus = overVideo.status;
    }

    if (!overStatus || activeVideo.status === overStatus) return;

    setVideos((items) => {
      const activeIndex = items.findIndex((v) => v.id === activeId);
      const overIndex = items.findIndex((v) => v.id === overId);

      let newIndex: number;
      if (COLUMNS.includes(overId as any)) {
        newIndex = items.length;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : items.length + 1;
      }

      const newItems = [...items];
      const [removed] = newItems.splice(activeIndex, 1);
      removed.status = overStatus as VideoStatus;

      let adjustedNewIndex = newIndex;
      if (activeIndex < newIndex) {
        adjustedNewIndex -= 1;
      }

      newItems.splice(adjustedNewIndex, 0, removed);
      return newItems;
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveVideo(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeItem = videos.find((v) => v.id === activeId);
    const overItem = videos.find((v) => v.id === overId);

    if (activeItem && overItem && activeItem.status === overItem.status) {
      const oldIndex = videos.findIndex((v) => v.id === activeId);
      const newIndex = videos.findIndex((v) => v.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        setVideos((items) => arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  // Mobile Arrows Logic
  const handleQuickMove = (video: Video, action: 'prev' | 'next' | 'move') => {
    const idx = COLUMNS.indexOf(video.status);
    if (action === 'move') {
      setMoveVideoId(video.id);
      return;
    }

    let newIdx = idx;
    if (action === 'prev' && idx > 0) newIdx--;
    if (action === 'next' && idx < COLUMNS.length - 1) newIdx++;

    if (newIdx !== idx) {
      const newStatus = COLUMNS[newIdx];
      setVideos(prev => prev.map(v => v.id === video.id ? { ...v, status: newStatus } : v));
      toast({ title: "Moved", description: `Moved to ${STATUS_LABELS[newStatus]}` });
    }
  };

  // CRUD Handlers
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

  const moveToColumn = (videoId: string, newStatus: VideoStatus) => {
    setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, status: newStatus } : v)));
    setMoveVideoId(null);
    toast({ title: "Card movido!", description: `Movido para "${STATUS_LABELS[newStatus]}"` });
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 max-w-[100vw] overflow-x-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Kanban</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Gerencie o fluxo de produção dos seus vídeos
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gradient-accent text-primary-foreground gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden xs:inline">Novo </span>Título
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-6 snap-x snap-mandatory -mx-3 px-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              videos={columnsData[status]}
              onClickEdit={handleOpenEdit}
              onClickDelete={(id) => setDeleteId(id)}
              onQuickMove={handleQuickMove}
            />
          ))}
        </div>

        {createPortal(
          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
            {activeVideo ? <KanbanCard video={activeVideo} isOverlay /> : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {/* Move Dialog (Mobile) */}
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
            <DialogTitle>Excluir Vídeo?</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir o vídeo? Esta ação não pode ser desfeita.</DialogDescription>
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
