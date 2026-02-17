import { useState, useMemo } from "react";
import {
  DndContext, closestCorners, DragOverlay, type DragStartEvent, type DragEndEvent,
  useSensor, useSensors, PointerSensor, TouchSensor,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, MoreVertical, Trash2, Edit2, Tv, CalendarDays, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useCanais } from "@/hooks/useCanais";
import { useVideos, type Video, type VideoInsert } from "@/hooks/useVideos";
import { useKanbanColumns, type KanbanColumn } from "@/hooks/useKanbanColumns";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

function DroppableColumn({ id, title, children, onEditTitle, onDelete, onAddVideo }: { id: string; title: string; children: React.ReactNode, onEditTitle: (newTitle: string) => void, onDelete: () => void, onAddVideo: () => void }) {
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
    <div className="bg-secondary/30 rounded-xl border border-border/40 p-3 flex flex-col min-w-[280px] h-full">
      <div className="flex items-center justify-between mb-3 px-1 group/col">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 mr-2">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-7 text-sm py-1 px-2" autoFocus />
            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500" onClick={handleSaveTitle}><Check className="w-4 h-4" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setIsEditing(false)}><X className="w-4 h-4" /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 cursor-pointer" onDoubleClick={() => setIsEditing(true)}>
            <span className="text-sm font-semibold text-foreground truncate">{title}</span>
            <span className="text-xs text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded-full font-medium">
              {Array.isArray(children) ? children.length : 0}
            </span>
          </div>
        )}

        <div className="flex items-center opacity-0 group-hover/col:opacity-100 transition-opacity">
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

      <div ref={setNodeRef} className={`flex-1 min-h-[150px] space-y-2 transition-colors duration-200 rounded-lg p-1 ${isOver ? "bg-primary/5 ring-2 ring-primary/20 ring-dashed" : ""}`}>
        {children}
      </div>
    </div>
  );
}

function SortableCard({ video, canais, onEdit, onDelete }: { video: Video; canais: { id: string; nome: string }[]; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const canalName = canais.find((c) => c.id === video.canal_id)?.nome;

  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className={`bg-card border border-border/50 rounded-lg p-3 group hover:border-primary/30 transition-all duration-200 ${isDragging ? "opacity-50 shadow-lg scale-105 rotate-[2deg] z-50" : ""}`}>
      <div className="flex items-start gap-2">
        <button {...listeners} className="mt-1 cursor-grab active:cursor-grabbing opacity-30 group-hover:opacity-60 transition-opacity shrink-0">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
          <p className="text-sm font-medium text-foreground truncate">{video.titulo}</p>
          {canalName && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <Tv className="w-3 h-3" /> {canalName}
            </div>
          )}
          {video.data_postagem && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <CalendarDays className="w-3 h-3" />
              {new Date(video.data_postagem + "T00:00:00").toLocaleDateString("pt-BR")}
            </div>
          )}
        </div>
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
  );
}

function DragOverlayCard({ video, canais }: { video: Video; canais: { id: string; nome: string }[] }) {
  const canalName = canais.find((c) => c.id === video.canal_id)?.nome;
  return (
    <div className="bg-card border-2 border-primary/40 rounded-lg p-3 shadow-2xl rotate-[3deg] scale-105 cursor-grabbing">
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 mt-1 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">{video.titulo}</p>
          {canalName && <p className="text-xs text-muted-foreground mt-1">{canalName}</p>}
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM: VideoInsert = { titulo: "", column_id: null, canal_id: null, data_postagem: null, position: 0 };

export default function Kanban() {
  const { toast } = useToast();
  const { canais } = useCanais();
  const { columns, loading: loadingCols, addColumn, updateColumn, deleteColumn } = useKanbanColumns();
  const { videos, loading: loadingVideos, create, update, remove, bulkUpdate } = useVideos();

  const [activeId, setActiveId] = useState<string | null>(null);

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

    // Add logic for videos possibly without valid column (fallback)
    const fallbackId = columns[0]?.id;

    videos.forEach((v) => {
      if (v.column_id && result[v.column_id]) {
        result[v.column_id].push(v);
      } else if (fallbackId) {
        // If column missing, put in first column temporarily? Or ignore.
        // Better to display them somewhere.
        // result[fallbackId].push(v); 
      }
    });
    return result;
  }, [videos, columns]);

  const activeVideo = activeId ? videos.find((v) => v.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeVideo = videos.find((v) => v.id === activeId);

    if (!activeVideo) return;

    // Determine target column and new index
    let targetColumnId: string | null = null;
    let newIndex = 0;

    // Check if over is a column
    const isOverColumn = columns.some(c => c.id === overId);

    if (isOverColumn) {
      targetColumnId = overId;
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

    const sourceColumnId = activeVideo.column_id;
    if (!sourceColumnId) return; // Should not happen with valid data

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
        // Optimistic / Bulk Update
        const updatesWithMeta = updates.map(u => ({ id: u.id, data: { ...u.data, column_id: sourceColumnId } }));
        bulkUpdate(updatesWithMeta);
      }
    } else {
      // Moving to different column
      const targetList = columnVideos[targetColumnId];
      const newTargetList = [...targetList];

      // Calculate splice logic correctly?
      // arrayMove is not for moving between lists.
      // We insert at newIndex.
      // Make sure we don't duplicate. activeVideo is NOT in targetList yet.

      newTargetList.splice(newIndex, 0, activeVideo);

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
    // Check if column has videos?
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
        <div className="flex items-center justify-center h-64">Loading...</div> // Better skeleton
      ) : columns.length === 0 ? (
        <EmptyState icon={Tv} title="Nenhuma coluna configurada" description="Crie sua primeira coluna para começar (ex: Planejamento)." actionLabel="Criar Coluna" onAction={() => setShowColumnModal(true)} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="flex gap-4 h-full min-w-max px-1">
              {columns.map((col) => (
                <div key={col.id} className="w-[300px] flex-shrink-0 flex flex-col">
                  <SortableContext items={(columnVideos[col.id] || []).map((v) => v.id)} strategy={verticalListSortingStrategy}>
                    <DroppableColumn
                      id={col.id}
                      title={col.title}
                      onEditTitle={(newTitle) => updateColumn(col.id, { title: newTitle })}
                      onDelete={() => setDeleteColumnId(col.id)}
                      onAddVideo={() => handleCreateVideo(col.id)}
                    >
                      {(columnVideos[col.id] || []).map((video) => (
                        <SortableCard key={video.id} video={video} canais={canais} onEdit={() => handleEditVideo(video)} onDelete={() => setDeleteVideoId(video.id)} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              ))}
            </div>
          </div>
          <DragOverlay>
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
              <Input type="date" value={videoForm.data_postagem || ""} onChange={(e) => setVideoForm({ ...videoForm, data_postagem: e.target.value || null })} />
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
