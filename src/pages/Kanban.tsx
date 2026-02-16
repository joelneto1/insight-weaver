import { useState, useMemo } from "react";
import {
  DndContext, closestCorners, DragOverlay, type DragStartEvent, type DragEndEvent,
  useSensor, useSensors, PointerSensor, TouchSensor,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, MoreVertical, Trash2, Edit2, Tv, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useCanais } from "@/hooks/useCanais";
import { useVideos, STATUS_LABELS, STATUS_COLORS, type VideoStatus, type VideoInsert } from "@/hooks/useVideos";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import type { Video } from "@/hooks/useVideos";

const COLUMNS: VideoStatus[] = ["planejamento", "roteiro", "gravado", "upload", "postado"];

const EMPTY_FORM: VideoInsert = { titulo: "", status: "planejamento", canal_id: null, data_postagem: null };

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`min-h-[200px] space-y-2 transition-colors duration-200 rounded-lg p-1 ${isOver ? "bg-primary/5 ring-2 ring-primary/20 ring-dashed" : ""}`}>
      {children}
    </div>
  );
}

function SortableCard({ video, canais, onEdit, onDelete }: { video: Video; canais: { id: string; nome: string }[]; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const canalName = canais.find((c) => c.id === video.canal_id)?.nome;

  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className={`bg-card border border-border/50 rounded-lg p-3 group hover:border-primary/30 transition-all duration-200 ${isDragging ? "opacity-50 shadow-lg scale-105 rotate-[2deg]" : ""}`}>
      <div className="flex items-start gap-2">
        <button {...listeners} className="mt-1 cursor-grab active:cursor-grabbing opacity-30 group-hover:opacity-60 transition-opacity shrink-0">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
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
    <div className="bg-card border-2 border-primary/40 rounded-lg p-3 shadow-2xl rotate-[3deg] scale-105">
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

export default function Kanban() {
  const { toast } = useToast();
  const { canais } = useCanais();
  const { videos, loading, create, update, remove } = useVideos();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<VideoInsert>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const columnVideos = useMemo(() => {
    const result: Record<VideoStatus, Video[]> = { planejamento: [], roteiro: [], gravado: [], upload: [], postado: [] };
    videos.forEach((v) => {
      const status = v.status as VideoStatus;
      if (result[status]) result[status].push(v);
    });
    return result;
  }, [videos]);

  const activeVideo = activeId ? videos.find((v) => v.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const videoId = String(active.id);
    const overId = String(over.id);

    // Check if dropped on a column
    if (COLUMNS.includes(overId as VideoStatus)) {
      const video = videos.find((v) => v.id === videoId);
      if (video && video.status !== overId) {
        update(videoId, { status: overId as VideoStatus });
      }
      return;
    }

    // Dropped on another card — get target's column
    const targetVideo = videos.find((v) => v.id === overId);
    if (targetVideo) {
      const video = videos.find((v) => v.id === videoId);
      if (video && video.status !== targetVideo.status) {
        update(videoId, { status: targetVideo.status as VideoStatus });
      }
    }
  };

  const handleOpenCreate = (status?: VideoStatus) => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, status: status || "planejamento" });
    setShowModal(true);
  };

  const handleOpenEdit = (v: Video) => {
    setEditingId(v.id);
    setForm({
      titulo: v.titulo,
      status: v.status as VideoStatus,
      canal_id: v.canal_id,
      data_postagem: v.data_postagem,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titulo) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editingId) {
      await update(editingId, form);
    } else {
      await create(form);
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await remove(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[100vw] overflow-x-hidden">
      <PageHeader title="Kanban de Produção" description="Arraste os vídeos entre as colunas para atualizar o status">
        <Button onClick={() => handleOpenCreate()} className="gradient-accent text-primary-foreground gap-2">
          <Plus className="w-4 h-4" /> Novo Vídeo
        </Button>
      </PageHeader>

      {!loading && videos.length === 0 ? (
        <EmptyState icon={Tv} title="Nenhum vídeo no pipeline" description="Crie seu primeiro vídeo para começar a usar o Kanban de produção." actionLabel="Criar Primeiro Vídeo" onAction={() => handleOpenCreate()} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {COLUMNS.map((status) => (
              <motion.div key={status} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-secondary/30 rounded-xl border border-border/40 p-3 flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]}`} />
                    <span className="text-sm font-semibold text-foreground">{STATUS_LABELS[status]}</span>
                    <span className="text-xs text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded-full font-medium">{columnVideos[status].length}</span>
                  </div>
                  <button onClick={() => handleOpenCreate(status)} className="p-1 rounded hover:bg-secondary transition-colors" title="Adicionar vídeo">
                    <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
                <SortableContext items={columnVideos[status].map((v) => v.id)} strategy={verticalListSortingStrategy}>
                  <DroppableColumn id={status}>
                    {loading
                      ? Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="bg-card border border-border/50 rounded-lg p-3 space-y-2 animate-pulse">
                          <div className="h-4 w-3/4 bg-muted/60 rounded" />
                          <div className="h-3 w-1/2 bg-muted/60 rounded" />
                        </div>
                      ))
                      : columnVideos[status].map((video) => (
                        <SortableCard key={video.id} video={video} canais={canais} onEdit={() => handleOpenEdit(video)} onDelete={() => setDeleteId(video.id)} />
                      ))}
                  </DroppableColumn>
                </SortableContext>
              </motion.div>
            ))}
          </div>
          <DragOverlay>
            {activeVideo && <DragOverlayCard video={activeVideo} canais={canais} />}
          </DragOverlay>
        </DndContext>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border w-full max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Vídeo" : "Novo Vídeo"}</DialogTitle>
            <DialogDescription>{editingId ? "Atualize as informações do vídeo." : "Adicione um novo vídeo ao pipeline."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><label className="text-sm font-medium">Título *</label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: 5 Histórias Assustadoras" maxLength={150} /></div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Canal</label>
              <Select value={form.canal_id || "none"} onValueChange={(v) => setForm({ ...form, canal_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem canal</SelectItem>
                  {canais.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as VideoStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COLUMNS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Data de Postagem</label>
              <Input type="date" value={form.data_postagem || ""} onChange={(e) => setForm({ ...form, data_postagem: e.target.value || null })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-accent text-primary-foreground">{saving ? "Salvando..." : editingId ? "Atualizar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir vídeo?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
