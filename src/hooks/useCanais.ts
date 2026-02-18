import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type Canal = Tables<"canais">;
export type CanalInsert = Omit<Canal, "id" | "created_at" | "updated_at" | "user_id">;

// Simple in-memory cache to avoid re-fetching on every page navigation
const cache: { ownerId: string | null; data: Canal[] | null } = { ownerId: null, data: null };

export function useCanais() {
    const { user, ownerId } = useAuth();
    const { toast } = useToast();
    const toastRef = useRef(toast);
    toastRef.current = toast;

    const [canais, setCanais] = useState<Canal[]>(cache.ownerId === ownerId && cache.data ? cache.data : []);
    const [loading, setLoading] = useState(!(cache.ownerId === ownerId && cache.data));

    const fetch = useCallback(async (force = false) => {
        if (!user || !ownerId) {
            setLoading(false);
            return;
        }
        // Skip fetch if cache is valid and not forced
        if (!force && cache.ownerId === ownerId && cache.data) {
            setCanais(cache.data);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("canais")
                .select("*")
                .eq("user_id", ownerId)
                .order("created_at", { ascending: true });
            if (error) {
                toastRef.current({ title: "Erro ao carregar canais", description: error.message, variant: "destructive" });
            } else {
                const result = data || [];
                cache.ownerId = ownerId;
                cache.data = result;
                setCanais(result);
            }
        } catch (err) {
            console.error("useCanais fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, ownerId]);

    useEffect(() => { fetch(); }, [fetch]);

    const create = async (canal: CanalInsert) => {
        if (!user || !ownerId) return null;
        const { data, error } = await supabase
            .from("canais")
            .insert({ ...canal, user_id: ownerId })
            .select()
            .single();
        if (error) {
            toastRef.current({ title: "Erro ao criar canal", description: error.message, variant: "destructive" });
            return null;
        }
        toastRef.current({ title: "Canal criado!" });
        await fetch(true);
        return data;
    };

    const update = async (id: string, canal: Partial<CanalInsert>) => {
        if (!user || !ownerId) return false;
        const { error } = await supabase
            .from("canais")
            .update(canal)
            .eq("id", id)
            .eq("user_id", ownerId);
        if (error) {
            toastRef.current({ title: "Erro ao atualizar canal", description: error.message, variant: "destructive" });
            return false;
        }
        toastRef.current({ title: "Canal atualizado!" });
        await fetch(true);
        return true;
    };

    const remove = async (id: string) => {
        if (!user) return false;
        const { error } = await supabase
            .from("canais")
            .delete()
            .eq("id", id)
            .eq("user_id", ownerId);
        if (error) {
            toastRef.current({ title: "Erro ao excluir canal", description: error.message, variant: "destructive" });
            return false;
        }
        toastRef.current({ title: "Canal excluído!" });
        await fetch(true);
        return true;
    };

    return { canais, loading, create, update, remove, refetch: fetch };
}
