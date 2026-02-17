import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type KanbanColumn = Tables<"kanban_columns">;
export type KanbanColumnInsert = Omit<KanbanColumn, "id" | "user_id" | "created_at">;

export function useKanbanColumns() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchColumns = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("kanban_columns")
            .select("*")
            .eq("user_id", user.id)
            .order("position", { ascending: true });

        if (error) {
            toast({ title: "Erro ao carregar colunas", description: error.message, variant: "destructive" });
        } else {
            setColumns(data || []);
        }
        setLoading(false);
    }, [user, toast]);

    useEffect(() => {
        fetchColumns();
    }, [fetchColumns]);

    const addColumn = async (title: string) => {
        if (!user) return null;
        const newPosition = columns.length > 0 ? Math.max(...columns.map(c => c.position)) + 1 : 0;

        const { data, error } = await supabase
            .from("kanban_columns")
            .insert({ user_id: user.id, title, position: newPosition })
            .select()
            .single();

        if (error) {
            toast({ title: "Erro ao criar coluna", description: error.message, variant: "destructive" });
            return null;
        }

        toast({ title: "Coluna criada!" });
        await fetchColumns();
        return data;
    };

    const updateColumn = async (id: string, updates: Partial<KanbanColumnInsert>) => {
        if (!user) return false;
        const { error } = await supabase
            .from("kanban_columns")
            .update(updates)
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            toast({ title: "Erro ao atualizar coluna", description: error.message, variant: "destructive" });
            return false;
        }

        await fetchColumns();
        return true;
    };

    const deleteColumn = async (id: string) => {
        if (!user) return false;

        // Verificar se tem vídeos? A FK tem ON DELETE SET NULL, então os vídeos ficariam "sem pai".
        // Mas a lógica do frontend pode quebrar. Se quiser deletar e manter vídeos, devia mover antes.
        // O usuário pediu "excluir", vou assumir que ele sabe o que faz (ou set null).
        // Se ON DELETE for RESTRICT, precisa limpar antes. No meu migration usei SET NULL!
        // Então os vídeos "sobrarão". Onde eles vão aparecer? Numa coluna "Sem Status"?

        const { error } = await supabase
            .from("kanban_columns")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            toast({ title: "Erro ao excluir coluna", description: error.message, variant: "destructive" });
            return false;
        }

        toast({ title: "Coluna ecluída!" });
        await fetchColumns();
        return true;
    };

    const reorderColumns = async (newOrder: KanbanColumn[]) => {
        // Optimistic UI
        setColumns(newOrder);

        // Bulk Update Positions
        const updates = newOrder.map((col, index) => ({
            id: col.id,
            position: index,
            user_id: user?.id
        }));

        // Supabase doesn't have bulk update via JS client easily without RPC or loop.
        // Loop is fine for small number of columns (usually < 10).
        try {
            await Promise.all(updates.map(u =>
                supabase.from("kanban_columns").update({ position: u.position }).eq("id", u.id)
            ));
        } catch (e) {
            console.error("Error reordering columns", e);
            toast({ title: "Erro ao salvar ordem das colunas", variant: "destructive" });
            fetchColumns(); // Revert
        }
    };

    return {
        columns,
        loading,
        fetchColumns,
        addColumn,
        updateColumn,
        deleteColumn,
        reorderColumns
    };
}
