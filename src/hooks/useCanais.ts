import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type Canal = Tables<"canais">;
export type CanalInsert = Omit<Canal, "id" | "created_at" | "updated_at" | "user_id">;

export function useCanais() {
    const { user, ownerId } = useAuth();
    const { toast } = useToast();
    const toastRef = useRef(toast);
    toastRef.current = toast;

    const [canais, setCanais] = useState<Canal[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        console.log("useCanais: fetch called, user:", user?.id, "ownerId:", ownerId);
        if (!user || !ownerId) {
            console.warn("useCanais: skipping fetch - user or ownerId is null", { user: !!user, ownerId });
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
            console.log("useCanais: query result", { count: data?.length, error: error?.message });
            if (error) {
                toastRef.current({ title: "Erro ao carregar canais", description: error.message, variant: "destructive" });
            } else {
                setCanais(data || []);
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
        await fetch();
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
        await fetch();
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
        await fetch();
        return true;
    };

    return { canais, loading, create, update, remove, refetch: fetch };
}
