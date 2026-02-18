import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type Prompt = Tables<"prompts">;
export type PromptInsert = Omit<Prompt, "id" | "created_at" | "updated_at" | "user_id">;

export function usePrompts() {
    const { user, ownerId } = useAuth();
    const { toast } = useToast();
    const toastRef = useRef(toast);
    toastRef.current = toast;

    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        if (!user || !ownerId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("prompts")
                .select("*")
                .eq("user_id", ownerId)
                .order("created_at", { ascending: false });
            if (error) {
                toastRef.current({ title: "Erro ao carregar prompts", description: error.message, variant: "destructive" });
            } else {
                setPrompts(data || []);
            }
        } catch (err) {
            console.error("usePrompts fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, ownerId]);

    useEffect(() => { fetch(); }, [fetch]);

    const create = async (prompt: PromptInsert) => {
        if (!user || !ownerId) return null;
        const { data, error } = await supabase
            .from("prompts")
            .insert({ ...prompt, user_id: ownerId })
            .select()
            .single();
        if (error) {
            toastRef.current({ title: "Erro ao criar prompt", description: error.message, variant: "destructive" });
            return null;
        }
        toastRef.current({ title: "Prompt criado!" });
        await fetch();
        return data;
    };

    const update = async (id: string, prompt: Partial<PromptInsert>) => {
        if (!user || !ownerId) return false;
        const { error } = await supabase
            .from("prompts")
            .update(prompt)
            .eq("id", id)
            .eq("user_id", ownerId);
        if (error) {
            toastRef.current({ title: "Erro ao atualizar prompt", description: error.message, variant: "destructive" });
            return false;
        }
        await fetch();
        return true;
    };

    const remove = async (id: string) => {
        if (!user || !ownerId) return false;
        const { error } = await supabase
            .from("prompts")
            .delete()
            .eq("id", id)
            .eq("user_id", ownerId);
        if (error) {
            toastRef.current({ title: "Erro ao excluir prompt", description: error.message, variant: "destructive" });
            return false;
        }
        toastRef.current({ title: "Prompt excluído!" });
        await fetch();
        return true;
    };

    const toggleFavorite = async (id: string, current: boolean) => {
        return update(id, { favorito: !current });
    };

    return { prompts, loading, create, update, remove, toggleFavorite, refetch: fetch };
}
