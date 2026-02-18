import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type KanbanColumn = Tables<"kanban_columns">;
export type KanbanColumnInsert = Omit<KanbanColumn, "id" | "user_id" | "created_at">;

// Simple in-memory cache
const cache: { ownerId: string | null; data: KanbanColumn[] | null } = { ownerId: null, data: null };

export function useKanbanColumns() {
    const { user, ownerId } = useAuth();
    const { toast } = useToast();
    const toastRef = useRef(toast);
    toastRef.current = toast;

    const [columns, setColumns] = useState<KanbanColumn[]>(cache.ownerId === ownerId && cache.data ? cache.data : []);
    const [loading, setLoading] = useState(!(cache.ownerId === ownerId && cache.data));

    const fetchColumns = useCallback(async (force = false) => {
        if (!user || !ownerId) {
            setLoading(false);
            return;
        }
        if (!force && cache.ownerId === ownerId && cache.data) {
            setColumns(cache.data);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("kanban_columns")
                .select("*")
                .eq("user_id", ownerId)
                .order("position", { ascending: true });
            if (error) {
                toastRef.current({ title: "Erro ao carregar colunas", description: error.message, variant: "destructive" });
            } else {
                const result = data || [];
                cache.ownerId = ownerId;
                cache.data = result;
                setColumns(result);
            }
        } catch (err) {
            console.error("useKanbanColumns fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, ownerId]);

    useEffect(() => {
        fetchColumns();
    }, [fetchColumns]);

    const addColumn = async (title: string) => {
        if (!user || !ownerId) return null;
        const newPosition = columns.length > 0 ? Math.max(...columns.map(c => c.position)) + 1 : 0;

        const { data, error } = await supabase
            .from("kanban_columns")
            .insert({ user_id: ownerId, title, position: newPosition })
            .select()
            .single();

        if (error) {
            toastRef.current({ title: "Erro ao criar coluna", description: error.message, variant: "destructive" });
            return null;
        }

        toastRef.current({ title: "Coluna criada!" });
        await fetchColumns(true);
        return data;
    };

    const updateColumn = async (id: string, updates: Partial<KanbanColumnInsert>) => {
        if (!user || !ownerId) return false;
        const { error } = await supabase
            .from("kanban_columns")
            .update(updates)
            .eq("id", id)
            .eq("user_id", ownerId);

        if (error) {
            toastRef.current({ title: "Erro ao atualizar coluna", description: error.message, variant: "destructive" });
            return false;
        }

        await fetchColumns(true);
        return true;
    };

    const deleteColumn = async (id: string) => {
        if (!user || !ownerId) return false;

        const { error } = await supabase
            .from("kanban_columns")
            .delete()
            .eq("id", id)
            .eq("user_id", ownerId);

        if (error) {
            toastRef.current({ title: "Erro ao excluir coluna", description: error.message, variant: "destructive" });
            return false;
        }

        toastRef.current({ title: "Coluna excluída!" });
        await fetchColumns(true);
        return true;
    };

    const reorderColumns = async (newOrder: KanbanColumn[]) => {
        setColumns(newOrder);

        const updates = newOrder.map((col, index) => ({
            id: col.id,
            position: index,
            user_id: ownerId
        }));

        try {
            await Promise.all(updates.map(u =>
                supabase.from("kanban_columns").update({ position: u.position }).eq("id", u.id)
            ));
        } catch (e) {
            console.error("Error reordering columns", e);
            toastRef.current({ title: "Erro ao salvar ordem das colunas", variant: "destructive" });
            fetchColumns(true);
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
