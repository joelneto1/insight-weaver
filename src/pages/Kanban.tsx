import { useState, useMemo } from "react";
import {
  DndContext, closestCorners, DragOverlay, type DragStartEvent, type DragEndEvent,
  useSensor, useSensors, PointerSensor, TouchSensor,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
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
function SortableColumn({ column, children, onEditTitle, onDelete, onAddVideo }: {
  column: KanbanColumn;
  children: React.ReactNode;
  onEditTitle: (newTitle: string) => void;
  onDelete: () => void;
  onAddVideo: () => void;
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
      >
        {children}
      </DroppableColumn>
    </div>
  );
}

function DroppableColumn({ id, title, children, attributes, listeners, onEditTitle, onDelete, onAddVideo }: {
  id: string;
  title: string;
  children: React.ReactNode;
  attributes: any;
  listeners: any;
  onEditTitle: (newTitle: string) => void;
  onDelete: () => void;
  onAddVideo: () => void;
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
    <div className="bg-secondary/30 rounded-xl border border-border/40 p-3 flex flex-col min-w-[280px] w-[300px] h-full shadow-sm">
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
              {Array.isArray(children) ? children.length : 0}
            </span>
          </div>
        )}

        <div className="flex items-center opacity-0 group-hover/col:opacity-100 transition-opacity" onPointerDown={(e) => e.stopPropagation()}>
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

  const style = { transform: CSS.Transform.toString(transform), transition };
  const canal = canais.find((c) => c.id === video.canal_id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-card border border-border/50 rounded-lg p-3 group hover:border-primary/30 transition-all duration-200 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg scale-105 rotate-[2deg] z-50"
      )}
      onClick={onEdit} // Click to edit unless dragging
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
    <div className="bg-card border-2 border-primary/40 rounded-lg p-3 shadow-2xl rotate-[3deg] scale-105 cursor-grabbing">
      <div className="flex items-start gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{video.titulo}</p>
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
function DragOverlayColumn({ column, children }: { column: KanbanColumn; children: React.ReactNode }) {
  return (
    <div className="bg-background/80 backdrop-blur rounded-xl border-2 border-primary/50 p-3 flex flex-col w-[300px] h-full shadow-2xl opacity-80 cursor-grabbing">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-semibold text-foreground truncate">{column.title}</span>
          <span className="text-xs text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded-full font-medium">
            {Array.isArray(children) ? children.length : 0}
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
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const columnVideos = useMemo(() => {
    const result: Record<string, Video[]> = {};
    columns.forEach(col => { result[col.id] = []; });

    const fallbackId = columns[0]?.id;

    videos.forEach((v) => {
      if (v.column_id && result[v.column_id]) {
        result[v.column_id].push(v);
      } else if (fallbackId && !v.column_id) {
        // Should we handle unassigned videos? For now, ignoring or let backend handle.
      }
    });
    return result;
  }, [videos, columns]);

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }
    if (event.active.data.current?.type === "Video") {
      setActiveVideo(event.active.data.current.video);
      return;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveVideo(null);
    const { active, over } = event;
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

    // Handling Video Reordering
    const video = videos.find((v) => v.id === activeId);
    if (!video) return;

    let targetColumnId: string | null = null;
    let newIndex = 0;

    // Check if over is a column
    const isOverColumn = columns.some(c => c.id === overId);

    if (isOverColumn) {
      targetColumnId = overId;
      // If over column, put at end
      newIndex = columnVideos[targetColumnId]?.length || 0;
    } else {
      // Over a card
      const overVideo = videos.find((v) => v.id === overId);
      if (overVideo && overVideo.column_id) {
        targetColumnId = overVideo.column_id;
        const overIndex = columnVideos[targetColumnId].findIndex((v) => v.id === overId);
        newIndex = overIndex >= 0 ? overIndex : 0;
      }
    }

    if (!targetColumnId) return;

    const sourceColumnId = video.column_id;
    if (!sourceColumnId) return;

    if (sourceColumnId === targetColumnId) {
      // Reordering in same column
      const currentList = columnVideos[sourceColumnId];
      const oldIndex = currentList.findIndex((v) => v.id === activeId);

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(currentList, oldIndex, newIndex);
        const updates = reordered.map((v, index) => ({
          id: v.id,
          data: { position: index }
        }));
        const updatesWithMeta = updates.map(u => ({ id: u.id, data: { ...u.data, column_id: sourceColumnId } }));
        bulkUpdate(updatesWithMeta);
      }
    } else {
      // Moving to different column
      const targetList = columnVideos[targetColumnId];
      const newTargetList = [...targetList];

      newTargetList.splice(newIndex, 0, video);

      const updates = newTargetList.map((v, index) => ({
        id: v.id,
        data: {
          position: index,
          column_id: targetColumnId
        } as Partial<VideoInsert>
      }));

      bulkUpdate(updates);
    }
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
    if (editingVideoId) {
      await update(editingVideoId, videoForm);
    } else {
      await create(videoForm);
    }
    setSaving(false);
    setShowVideoModal(false);
  };

  const handleDeleteVideo = async () => {
    if (!deleteVideoId) return;
    await remove(deleteVideoId);
    setDeleteVideoId(null);
  };

  const handleCreateColumn = async () => {
    if (!newColumnTitle) return;
    setSaving(true);
    await addColumn(newColumnTitle);
    setNewColumnTitle("");
    setSaving(false);
    setShowColumnModal(false);
  }

  const handleDeleteColumnConfirm = async () => {
    if (!deleteColumnId) return;
    const hasVideos = videos.some(v => v.column_id === deleteColumnId);
    if (hasVideos) {
      toast({ title: "Ação bloqueada", description: "Remova ou mova os vídeos desta coluna antes de excluir.", variant: "destructive" });
    } else {
      await deleteColumn(deleteColumnId);
    }
    setDeleteColumnId(null);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[100vw] overflow-x-hidden h-[calc(100vh-60px)] flex flex-col">
      <PageHeader title="Kanban de Produção" description="Gerencie seu fluxo de produção de vídeos">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowColumnModal(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Coluna
          </Button>
          <Button onClick={() => handleCreateVideo()} className="gradient-accent text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Novo Vídeo
          </Button>
        </div>
      </PageHeader>

      {(loadingVideos || loadingCols) && videos.length === 0 && columns.length === 0 ? (
        <div className="flex items-center justify-center h-64">Loading...</div>
      ) : columns.length === 0 ? (
        <EmptyState icon={Tv} title="Nenhuma coluna configurada" description="Crie sua primeira coluna para começar (ex: Planejamento)." actionLabel="Criar Coluna" onAction={() => setShowColumnModal(true)} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-4 h-full min-w-max px-1 items-start">
                {columns.map((col) => (
                  <SortableColumn
                    key={col.id}
                    column={col}
                    onEditTitle={(newTitle) => updateColumn(col.id, { title: newTitle })}
                    onDelete={() => setDeleteColumnId(col.id)}
                    onAddVideo={() => handleCreateVideo(col.id)}
                  >
                    <SortableContext items={(columnVideos[col.id] || []).map((v) => v.id)} strategy={verticalListSortingStrategy}>
                      {(columnVideos[col.id] || []).map((video) => (
                        <SortableCard key={video.id} video={video} canais={canais} onEdit={() => handleEditVideo(video)} onDelete={() => setDeleteVideoId(video.id)} />
                      ))}
                    </SortableContext>
                  </SortableColumn>
                ))}
              </div>
            </SortableContext>
          </div>
          <DragOverlay>
            {activeColumn && (
              <DragOverlayColumn column={activeColumn}>
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
