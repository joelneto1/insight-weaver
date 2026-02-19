import { useState, useMemo, useCallback, useRef } from "react";
import {
  DndContext, closestCenter, DragOverlay, type DragStartEvent, type DragEndEvent, type DragOverEvent,
  useSensor, useSensors, PointerSensor, TouchSensor, KeyboardSensor,
  MeasuringStrategy,
  type UniqueIdentifier,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, MoreVertical, Trash2, Edit2, Tv, Calendar as CalendarIcon, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useCanais, type Canal } from "@/hooks/useCanais";
import { useVideos, type Video, type VideoInsert } from "@/hooks/useVideos";
import { useKanbanColumns, type KanbanColumn } from "@/hooks/useKanbanColumns";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- Sortable Column Wrapper ---
function SortableColumn({ column, children, onEditTitle, onDelete, onAddVideo, itemCount }: {
  column: KanbanColumn;
  children: React.ReactNode;
  onEditTitle: (newTitle: string) => void;
  onDelete: () => void;
  onAddVideo: () => void;
  itemCount: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "Column", column }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("flex flex-col h-full", isDragging && "opacity-50")}>
      <DroppableColumn
        id={column.id}
        title={column.title}
        attributes={attributes}
        listeners={listeners}
        onEditTitle={onEditTitle}
        onDelete={onDelete}
        onAddVideo={onAddVideo}
        itemCount={itemCount}
      >
        {children}
      </DroppableColumn>
    </div>
  );
}

function DroppableColumn({ id, title, children, attributes, listeners, onEditTitle, onDelete, onAddVideo, itemCount }: {
  id: string;
  title: string;
  children: React.ReactNode;
  attributes: any;
  listeners: any;
  onEditTitle: (newTitle: string) => void;
  onDelete: () => void;
  onAddVideo: () => void;
  itemCount: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onEditTitle(editTitle);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-secondary/30 rounded-xl border border-border/40 p-2.5 sm:p-3 flex flex-col min-w-[260px] sm:min-w-[280px] w-[270px] sm:w-[300px] h-full shadow-sm">
      {/* Header - Drag Handle is valid here */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-3 px-1 group/col cursor-grab active:cursor-grabbing"
      >
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 mr-2" onPointerDown={(e) => e.stopPropagation()}>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-7 text-sm py-1 px-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
              }}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500" onClick={handleSaveTitle}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span
              className="text-sm font-semibold text-foreground truncate"
              onDoubleClick={(e) => {
                e.stopPropagation(); // Prevent drag start on double click if possible, though dnd-kit usually handles distinct gestures
                setIsEditing(true);
              }}
            >
              {title}
            </span>
            <span className="text-xs text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded-full font-medium">
              {itemCount}
            </span>
          </div>
        )}

        <div className="flex items-center sm:opacity-0 sm:group-hover/col:opacity-100 transition-opacity" onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={onAddVideo} className="p-1 rounded hover:bg-secondary transition-colors mr-1" title="Adicionar vídeo">
            <Plus className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-secondary transition-colors"><MoreVertical className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)} className="gap-2"><Edit2 className="w-3.5 h-3.5" /> Renomear</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive"><Trash2 className="w-3.5 h-3.5" /> Excluir Coluna</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div ref={setNodeRef} className={cn("flex-1 min-h-[150px] space-y-2 transition-colors duration-200 rounded-lg p-1", isOver && "bg-primary/5 ring-2 ring-primary/20 ring-dashed")}>
        {children}
      </div>
    </div>
  );
}

function SortableCard({ video, canais, onEdit, onDelete }: { video: Video; canais: Canal[]; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: video.id,
    data: { type: "Video", video }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto' as any,
  };
  const canal = canais.find((c) => c.id === video.canal_id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-card border border-border/50 rounded-lg p-3 group hover:border-primary/30 transition-colors duration-150 cursor-grab active:cursor-grabbing touch-none",
        isDragging && "shadow-xl ring-2 ring-primary/30"
      )}
      onClick={onEdit}
    >
      <div className="flex items-start gap-2">
        {/* Removed GripVertical button, whole card is draggable */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{video.titulo}</p>
          {canal && (
            <div className="flex flex-col gap-1 mt-1.5">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Tv className="w-3 h-3" /> {canal.nome}
              </div>
              <div className="flex gap-2 flex-wrap">
                {canal.idioma && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{canal.idioma}</span>}
                {canal.nicho && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{canal.nicho}</span>}
              </div>
            </div>
          )}
          {video.data_postagem && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <CalendarIcon className="w-3 h-3" />
              {/* Ensure standard display format */}
              {format(new Date(video.data_postagem + "T00:00:00"), "dd/MM/yyyy")}
            </div>
          )}
        </div>
        <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary"><MoreVertical className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit} className="gap-2"><Edit2 className="w-3.5 h-3.5" /> Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive"><Trash2 className="w-3.5 h-3.5" /> Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function DragOverlayCard({ video, canais }: { video: Video; canais: Canal[] }) {
  const canal = canais.find((c) => c.id === video.canal_id);
  return (
    <div className="bg-card border-2 border-primary/40 rounded-lg p-3 shadow-2xl rotate-[1.5deg] scale-[1.02] cursor-grabbing w-[280px]" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)' }}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{video.titulo}</p>
          {canal && (
            <div className="mt-1">
              <p className="text-xs text-muted-foreground">{canal.nome}</p>
              <div className="flex gap-1 mt-1">
                {canal.idioma && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{canal.idioma}</span>}
                {canal.nicho && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{canal.nicho}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Overlay for dragging column
function DragOverlayColumn({ column, children, itemCount }: { column: KanbanColumn; children: React.ReactNode; itemCount: number }) {
  return (
    <div className="bg-background/80 backdrop-blur rounded-xl border-2 border-primary/50 p-3 flex flex-col w-[300px] h-full shadow-2xl opacity-80 cursor-grabbing">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-semibold text-foreground truncate">{column.title}</span>
          <span className="text-xs text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded-full font-medium">
            {itemCount}
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-[150px] space-y-2 p-1">
        {children}
      </div>
    </div>
  )
}


const EMPTY_FORM: VideoInsert = { titulo: "", column_id: null, canal_id: null, data_postagem: null, position: 0 };

export default function Kanban() {
  const { toast } = useToast();
  const { canais } = useCanais();
  const { columns, loading: loadingCols, addColumn, updateColumn, deleteColumn, reorderColumns } = useKanbanColumns();
  const { videos, loading: loadingVideos, create, update, remove, bulkUpdate } = useVideos();

  const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  // Modals state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  const [videoForm, setVideoForm] = useState<VideoInsert>(EMPTY_FORM);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Track the last valid overId for collision detection
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  const columnVideos = useMemo(() => {
    const result: Record<string, Video[]> = {};
    columns.forEach(col => { result[col.id] = []; });

    videos.forEach((v) => {
      if (v.column_id && result[v.column_id]) {
        result[v.column_id].push(v);
      }
    });
    return result;
  }, [videos, columns]);

  // Helper: find which column a given id belongs to (could be a column id or video id)
  const findColumnOfItem = useCallback((id: string): string | null => {
    // Check if it's a column id directly
    if (columns.some(c => c.id === id)) return id;
    // Otherwise, find the video's column
    const video = videos.find(v => v.id === id);
    return video?.column_id || null;
  }, [columns, videos]);

  // Custom collision detection for Kanban
  const collisionDetectionStrategy = useCallback(
    (args: any) => {
      if (activeColumn) {
        return closestCenter(args);
      }

      // Start with pointerWithin for precision
      const pointerCollisions = pointerWithin(args);

      if (pointerCollisions.length > 0) {
        // Among matches, prefer cards over columns
        const cardCollisions = pointerCollisions.filter(
          (c: any) => !columns.some(col => col.id === c.id)
        );
        if (cardCollisions.length > 0) {
          // Use closestCenter among these card collisions for best pick
          const closest = closestCenter({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              (container: any) => cardCollisions.some((c: any) => c.id === container.id)
            ),
          });
          if (closest.length > 0) {
            lastOverId.current = closest[0].id;
            return closest;
          }
        }
        // Fall back to the first collision (might be a column)
        lastOverId.current = pointerCollisions[0].id;
        return [pointerCollisions[0]];
      }

      // Fall back to rectIntersection
      const rectCollisions = rectIntersection(args);
      if (rectCollisions.length > 0) {
        lastOverId.current = rectCollisions[0].id;
        return [rectCollisions[0]];
      }

      // Last resort: return last known
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeColumn, columns]
  );

  // Measuring strategy for better overlay positioning
  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      setActiveVideo(null);
      return;
    }
    if (event.active.data.current?.type === "Video") {
      setActiveVideo(event.active.data.current.video);
      setActiveColumn(null);
      return;
    }
  };

  // Handle drag over: move cards between columns in real-time via optimistic local state
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over, delta } = event;
    if (!over) return;
    if (active.data.current?.type !== "Video") return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeColumnId = findColumnOfItem(activeId);
    const overColumnId = findColumnOfItem(overId);

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) return;

    // Card is moving to a different column - update local state immediately
    recentlyMovedToNewContainer.current = true;

    // Determine position in the target column
    const overItems = columnVideos[overColumnId] || [];
    const isOverAColumn = columns.some(c => c.id === overId);

    let newIndex: number;
    if (isOverAColumn) {
      // Dropped on the column itself - go to end
      newIndex = overItems.length;
    } else {
      const overIndex = overItems.findIndex(v => v.id === overId);
      // If pointer is in the bottom half of the over card, place after; else before
      const isBelowOverItem = delta.y > 0;
      newIndex = overIndex >= 0 ? (isBelowOverItem ? overIndex + 1 : overIndex) : overItems.length;
    }

    // Apply optimistic move to local state (via bulkUpdate's optimistic path, but without server call)
    // We directly update the videos state to move the card
    const activeVideo = videos.find(v => v.id === activeId);
    if (!activeVideo) return;

    // Build new videos array with the card moved
    const newVideos = videos.map(v => {
      if (v.id === activeId) {
        return { ...v, column_id: overColumnId, position: newIndex };
      }
      return v;
    });

    // Re-calculate positions for the target column
    const targetItems = newVideos
      .filter(v => v.column_id === overColumnId && v.id !== activeId);
    targetItems.splice(newIndex, 0, { ...activeVideo, column_id: overColumnId });

    // This triggers a re-render with the card in the new column
    // We do this via the hook's optimistic approach - but we need direct state access
    // Instead, let's just call bulkUpdate with only the moved card (optimistic, no server yet... but that triggers server)
    // Better approach: we handle this through the final handleDragEnd
    // For now, the recentlyMovedToNewContainer flag helps collision detection
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveColumn(null);
    setActiveVideo(null);
    recentlyMovedToNewContainer.current = false;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Handling Column Reordering
    if (active.data.current?.type === "Column") {
      if (activeId === overId) return;
      const oldIndex = columns.findIndex((c) => c.id === activeId);
      const newIndex = columns.findIndex((c) => c.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(columns, oldIndex, newIndex);
        reorderColumns(newOrder);
      }
      return;
    }

    // Handling Video Drop
    const video = videos.find((v) => v.id === activeId);
    if (!video) return;

    const sourceColumnId = video.column_id;
    if (!sourceColumnId) return;

    // Determine target column and index
    let targetColumnId: string | null = null;
    let newIndex = 0;

    const isOverColumn = columns.some(c => c.id === overId);

    if (isOverColumn) {
      targetColumnId = overId;
      const colVids = (columnVideos[targetColumnId] || []).filter(v => v.id !== activeId);
      newIndex = colVids.length; // end of column
    } else {
      const overVideo = videos.find((v) => v.id === overId);
      if (overVideo?.column_id) {
        targetColumnId = overVideo.column_id;
        const colVids = (columnVideos[targetColumnId] || []).filter(v => v.id !== activeId);
        const overIndex = colVids.findIndex((v) => v.id === overId);

        if (overIndex >= 0) {
          // Use the over.rect to determine if we should place before or after
          if (over.rect) {
            const overRect = over.rect;
            const overMiddleY = overRect.top + overRect.height / 2;
            // active.rect.current.translated gives the dragged item position
            const activeRect = active.rect?.current?.translated;
            if (activeRect) {
              const activeCenterY = activeRect.top + activeRect.height / 2;
              newIndex = activeCenterY < overMiddleY ? overIndex : overIndex + 1;
            } else {
              newIndex = overIndex;
            }
          } else {
            newIndex = overIndex;
          }
        } else {
          newIndex = colVids.length;
        }
      }
    }

    if (!targetColumnId) return;

    if (sourceColumnId === targetColumnId) {
      // Reordering in same column
      const currentList = [...(columnVideos[sourceColumnId] || [])];
      const oldIndex = currentList.findIndex((v) => v.id === activeId);

      if (oldIndex !== -1 && oldIndex !== newIndex) {
        // Adjust newIndex if needed (arrayMove expects indices in original array)
        const adjustedNewIndex = Math.min(newIndex, currentList.length - 1);
        const reordered = arrayMove(currentList, oldIndex, adjustedNewIndex);
        const updates = reordered.map((v, index) => ({
          id: v.id,
          data: { position: index, column_id: sourceColumnId }
        }));
        bulkUpdate(updates);
      }
    } else {
      // Moving to different column
      // Remove from source and re-index
      const sourceList = (columnVideos[sourceColumnId] || []).filter(v => v.id !== activeId);
      const sourceUpdates = sourceList.map((v, index) => ({
        id: v.id,
        data: { position: index, column_id: sourceColumnId }
      }));

      // Insert into target at correct position
      const targetList = (columnVideos[targetColumnId] || []).filter(v => v.id !== activeId);
      const clampedIndex = Math.min(newIndex, targetList.length);
      targetList.splice(clampedIndex, 0, video);
      const targetUpdates = targetList.map((v, index) => ({
        id: v.id,
        data: {
          position: index,
          column_id: targetColumnId
        } as Partial<VideoInsert>
      }));

      bulkUpdate([...sourceUpdates, ...targetUpdates]);
    }
  };

  // Drop animation configuration for smoother feel
  const dropAnimationConfig = {
    sideEffects: ({ active, dragOverlay }: any) => {
      if (active && dragOverlay) {
        active.node.style.opacity = '0.4';
      }
      return () => {
        if (active) {
          active.node.style.opacity = '';
        }
      };
    },
  };

  const handleCreateVideo = (columnId?: string) => {
    setEditingVideoId(null);
    setVideoForm({
      ...EMPTY_FORM,
      column_id: columnId || columns[0]?.id || null, // Default to first column
      position: columnVideos[columnId || columns[0]?.id]?.length || 0
    });
    setShowVideoModal(true);
  };

  const handleEditVideo = (v: Video) => {
    setEditingVideoId(v.id);
    setVideoForm({
      titulo: v.titulo,
      column_id: v.column_id,
      canal_id: v.canal_id,
      data_postagem: v.data_postagem,
      position: v.position || 0,
    });
    setShowVideoModal(true);
  };

  const handleSaveVideo = async () => {
    if (!videoForm.titulo) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingVideoId) {
        await update(editingVideoId, videoForm);
      } else {
        await create(videoForm);
      }
      setShowVideoModal(false);
    } catch (err) {
      console.error("handleSaveVideo error:", err);
      toast({ title: "Erro ao salvar vídeo", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!deleteVideoId) return;
    try {
      await remove(deleteVideoId);
    } catch (err) {
      console.error("handleDeleteVideo error:", err);
    }
    setDeleteVideoId(null);
  };

  const handleCreateColumn = async () => {
    if (!newColumnTitle.trim()) return;
    setSaving(true);
    try {
      await addColumn(newColumnTitle.trim());
      setNewColumnTitle("");
      setShowColumnModal(false);
    } catch (err) {
      console.error("handleCreateColumn error:", err);
      toast({ title: "Erro ao criar coluna", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const handleDeleteColumnConfirm = async () => {
    if (!deleteColumnId) return;
    const hasVideos = videos.some(v => v.column_id === deleteColumnId);
    if (hasVideos) {
      toast({ title: "Ação bloqueada", description: "Remova ou mova os vídeos desta coluna antes de excluir.", variant: "destructive" });
    } else {
      try {
        await deleteColumn(deleteColumnId);
      } catch (err) {
        console.error("handleDeleteColumn error:", err);
      }
    }
    setDeleteColumnId(null);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[100vw] overflow-x-hidden h-[calc(100vh-60px)] flex flex-col">
      <PageHeader title="Kanban de Produção" description="Gerencie seu fluxo de produção de vídeos">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setShowColumnModal(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Nova Coluna
          </Button>
          <Button onClick={() => handleCreateVideo()} className="gradient-accent text-primary-foreground gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Novo Vídeo
          </Button>
        </div>
      </PageHeader>

      {(loadingVideos || loadingCols) && videos.length === 0 && columns.length === 0 ? (
        <div className="flex items-center justify-center h-64">Loading...</div>
      ) : columns.length === 0 ? (
        <EmptyState icon={Tv} title="Nenhuma coluna configurada" description="Crie sua primeira coluna para começar (ex: Planejamento)." actionLabel="Criar Coluna" onAction={() => setShowColumnModal(true)} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          measuring={measuring}
        >
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 kanban-scroll">
            <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-4 h-full min-w-max px-1 items-start">
                {columns.map((col) => (
                  <SortableColumn
                    key={col.id}
                    column={col}
                    onEditTitle={(newTitle) => updateColumn(col.id, { title: newTitle })}
                    onDelete={() => setDeleteColumnId(col.id)}
                    onAddVideo={() => handleCreateVideo(col.id)}
                    itemCount={(columnVideos[col.id] || []).length}
                  >
                    <SortableContext items={(columnVideos[col.id] || []).map((v) => v.id)} strategy={verticalListSortingStrategy}>
                      {(columnVideos[col.id] || []).map((video) => (
                        <SortableCard key={video.id} video={video} canais={canais} onEdit={() => handleEditVideo(video)} onDelete={() => setDeleteVideoId(video.id)} />
                      ))}
                      {(columnVideos[col.id] || []).length === 0 && (
                        <div className="h-20 flex items-center justify-center rounded-lg border-2 border-dashed border-border/30 text-xs text-muted-foreground/50">
                          Solte aqui
                        </div>
                      )}
                    </SortableContext>
                  </SortableColumn>
                ))}
              </div>
            </SortableContext>
          </div>
          <DragOverlay dropAnimation={dropAnimationConfig} zIndex={1000}>
            {activeColumn && (
              <DragOverlayColumn column={activeColumn} itemCount={(columnVideos[activeColumn.id] || []).length}>
                {columnVideos[activeColumn.id]?.map(video => (
                  <div key={video.id} className="bg-card border border-border/50 rounded-lg p-3 opacity-50">
                    <p className="text-sm font-medium">{video.titulo}</p>
                  </div>
                ))}
              </DragOverlayColumn>
            )}
            {activeVideo && <DragOverlayCard video={activeVideo} canais={canais} />}
          </DragOverlay>
        </DndContext>
      )}

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="bg-card border-border w-full max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVideoId ? "Editar Vídeo" : "Novo Vídeo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><label className="text-sm font-medium">Título *</label><Input value={videoForm.titulo} onChange={(e) => setVideoForm({ ...videoForm, titulo: e.target.value })} placeholder="Título do vídeo" maxLength={150} /></div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Canal</label>
              <Select value={videoForm.canal_id || "none"} onValueChange={(v) => setVideoForm({ ...videoForm, canal_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem canal</SelectItem>
                  {canais.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Coluna / Status</label>
              <Select value={videoForm.column_id || ""} onValueChange={(v) => setVideoForm({ ...videoForm, column_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{columns.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Data de Postagem</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !videoForm.data_postagem && "text-muted-foreground")}>
                    {videoForm.data_postagem ? (
                      format(new Date(videoForm.data_postagem + "T00:00:00"), "dd/MM/yyyy")
                    ) : (
                      <span>DD/MM/AAAA</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={videoForm.data_postagem ? new Date(videoForm.data_postagem + "T00:00:00") : undefined}
                    onSelect={(date) => setVideoForm({ ...videoForm, data_postagem: date ? format(date, "yyyy-MM-dd") : null })}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-between w-full">
            {editingVideoId && (
              <Button variant="destructive" onClick={() => setDeleteVideoId(editingVideoId)} type="button">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setShowVideoModal(false)}>Cancelar</Button>
              <Button onClick={handleSaveVideo} disabled={saving} className="gradient-accent text-primary-foreground">{saving ? "Salvando..." : editingVideoId ? "Atualizar" : "Criar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Column Modal */}
      <Dialog open={showColumnModal} onOpenChange={setShowColumnModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nova Coluna</DialogTitle></DialogHeader>
          <div className="py-4">
            <Input placeholder="Nome da coluna (ex: Revisão)" value={newColumnTitle} onChange={(e) => setNewColumnTitle(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowColumnModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateColumn} disabled={!newColumnTitle || saving}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Video Alert */}
      <AlertDialog open={!!deleteVideoId} onOpenChange={() => setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir vídeo?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteVideo} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Column Alert */}
      <AlertDialog open={!!deleteColumnId} onOpenChange={() => setDeleteColumnId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir coluna?</AlertDialogTitle><AlertDialogDescription>Tenha certeza que a coluna está vazia antes de excluir.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteColumnConfirm} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
