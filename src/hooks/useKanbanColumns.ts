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

    const fetchColumns = useCallback(async (force = false, silent = false) => {
        if (!user || !ownerId) {
            setLoading(false);
            return;
        }
        if (!force && cache.ownerId === ownerId && cache.data) {
            setColumns(cache.data);
            setLoading(false);
            return;
        }
        // Only show loading spinner on initial load, not on background refetch
        if (!silent) setLoading(true);
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

        // Optimistic: add column immediately to UI
        const tempId = `temp-${Date.now()}`;
        const optimisticCol = { id: tempId, user_id: ownerId, title, position: newPosition, created_at: new Date().toISOString() } as KanbanColumn;
        setColumns(prev => [...prev, optimisticCol]);

        try {
            const { data, error } = await supabase
                .from("kanban_columns")
                .insert({ user_id: ownerId, title, position: newPosition })
                .select()
                .single();

            if (error) {
                // Rollback optimistic update
                setColumns(prev => prev.filter(c => c.id !== tempId));
                toastRef.current({ title: "Erro ao criar coluna", description: error.message, variant: "destructive" });
                return null;
            }

            toastRef.current({ title: "Coluna criada!" });
            // Silent refetch to get real ID from server
            await fetchColumns(true, true);
            return data;
        } catch (err) {
            // Rollback on network error
            setColumns(prev => prev.filter(c => c.id !== tempId));
            console.error("addColumn error:", err);
            toastRef.current({ title: "Erro ao criar coluna", variant: "destructive" });
            return null;
        }
    };

    const updateColumn = async (id: string, updates: Partial<KanbanColumnInsert>) => {
        if (!user || !ownerId) return false;

        // Optimistic update
        setColumns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

        try {
            const { error } = await supabase
                .from("kanban_columns")
                .update(updates)
                .eq("id", id)
                .eq("user_id", ownerId);

            if (error) {
                toastRef.current({ title: "Erro ao atualizar coluna", description: error.message, variant: "destructive" });
                await fetchColumns(true, true); // Rollback by refetching
                return false;
            }

            // Silent refetch to sync
            await fetchColumns(true, true);
            return true;
        } catch (err) {
            console.error("updateColumn error:", err);
            await fetchColumns(true, true);
            return false;
        }
    };

    const deleteColumn = async (id: string) => {
        if (!user || !ownerId) return false;

        // Optimistic delete
        const backup = columns;
        setColumns(prev => prev.filter(c => c.id !== id));

        try {
            const { error } = await supabase
                .from("kanban_columns")
                .delete()
                .eq("id", id)
                .eq("user_id", ownerId);

            if (error) {
                setColumns(backup); // Rollback
                toastRef.current({ title: "Erro ao excluir coluna", description: error.message, variant: "destructive" });
                return false;
            }

            toastRef.current({ title: "Coluna excluída!" });
            // Silent refetch to sync cache
            await fetchColumns(true, true);
            return true;
        } catch (err) {
            setColumns(backup); // Rollback
            console.error("deleteColumn error:", err);
            return false;
        }
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
